import { ChatOpenAI } from "@langchain/openai";
import { NextResponse } from "next/server";
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { SystemMessage, HumanMessage, AIMessage, ToolMessage } from "@langchain/core/messages";
import { TavilySearchResults } from "@langchain/community/tools/tavily_search";

// 1. 定义天气查询工具
const weatherTool = tool(
  async ({ location }) => {
    try {
      // 使用 wttr.in 免费天气服务 (format=j1 返回 JSON)
      const res = await fetch(`https://wttr.in/${encodeURIComponent(location)}?format=j1`);
      const data = await res.json();
      
      const current = data.current_condition[0];
      const weatherDesc = current.lang_zh ? current.lang_zh[0].value : current.weatherDesc[0].value;
      
      return `地点：${location}\n当前温度：${current.temp_C}°C\n体感温度：${current.FeelsLikeC}°C\n天气描述：${weatherDesc}`;
    } catch (error) {
      console.error("Weather tool error:", error);
      return "抱歉，暂时无法获取该地点的天气信息。";
    }
  },
  {
    name: "get_weather",
    description: "获取指定城市的实时天气信息",
    schema: z.object({
      location: z.string().describe("城市名称 (如：北京、上海)"),
    }),
  }
);

// 2. 定义联网搜索工具
const searchTool = new TavilySearchResults({
  maxResults: 5,
  apiKey: process.env.TAVILY_API_KEY,
  kwargs: {
    includeAnswer: true,
    includeRawContent: false,
  },
});

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export async function POST(req: Request) {
  try {
    const { messages }: { messages: ChatMessage[] } = await req.json();
    
    // 1. 获取用户地理位置 (通过 IP 自动识别)
    let userCity = "成都"; // 默认城市
    try {
      // 在本地开发环境下，127.0.0.1 是查不出城市的
      // 当你上线后，req.headers.get("x-forwarded-for") 就能拿到真实用户的 IP
      const forwarded = req.headers.get("x-forwarded-for");
      const clientIp = forwarded ? forwarded.split(",")[0] : "";
      
      // 调用免费的 IP 查询接口 (ip-api.com)
      const ipRes = await fetch(`http://ip-api.com/json/${clientIp}?lang=zh-CN`);
      const ipData = await ipRes.json();
      if (ipData.status === "success" && ipData.city) {
        userCity = ipData.city;
      }
    } catch (ipError) {
      console.warn("IP Location failed, fallback to default city.", ipError);
    }

    // 2. 初始化模型并绑定工具
    const model = new ChatOpenAI({
      modelName: "deepseek-chat",
      temperature: 0.7,
      configuration: {
        baseURL: process.env.OPENAI_API_BASE,
      },
    });
    const modelWithTools = model.bindTools([weatherTool, searchTool]);

    // 3. 检查是否需要压缩历史 (当消息超过 6 条时)
    let optimizedMessages = [...messages];
    let isSummarized = false;

    if (messages.length > 6) {
      console.log("History too long, starting summarization...");
      // 取出前 4 条进行总结
      const toSummarize = messages.slice(0, 4);
      const remaining = messages.slice(4);

      const summaryPrompt = `请将以下对话历史总结为一段简短的话（100字以内），作为后续对话的上下文。保持关键信息（如人名、地点、核心意图）齐全：
      
      ${toSummarize.map(m => `${m.role}: ${m.content}`).join("\n")}`;

      const summaryResponse = await model.invoke([new HumanMessage(summaryPrompt)]);
      const summary = summaryResponse.content;

      // 构造优化后的消息数组：[系统摘要消息, ...剩余消息]
      optimizedMessages = [
        { role: "assistant", content: `[历史对话记录摘要]：${summary}` },
        ...remaining
      ];
      isSummarized = true;
      console.log("Summarization complete.");
    }

    // 4. 将消息转换为 LangChain 格式并注入动态系统提示词
    const currentDate = new Date().toLocaleDateString("zh-CN");
    const formattedMessages = [
      new SystemMessage(`你是一个贴心的 AI 助手。当前用户所在地是：${userCity}。如果用户没提城市，请默认查询${userCity}的天气。现在的时间是 ${currentDate}。

你拥有以下能力：
1. 查询天气信息 - 使用 get_weather 工具
2. 联网搜索 - 使用 tavily_search_results_json 工具获取最新信息

当用户询问实时信息、新闻、最新数据或你不确定的知识时，主动使用搜索工具。`),
      ...optimizedMessages.map((m) => {
        if (m.role === "user") return new HumanMessage(m.content);
        return new AIMessage(m.content);
      })
    ];

    // 3. 第一次调用模型
    let response = await modelWithTools.invoke(formattedMessages);

    // 4. 判断模型是否想要调用工具
    if (response.tool_calls && response.tool_calls.length > 0) {
      const toolMessages: ToolMessage[] = [];
      
      for (const toolCall of response.tool_calls) {
        let toolResult;
        
        if (toolCall.name === "get_weather") {
          // 执行天气工具
          toolResult = await weatherTool.invoke(toolCall);
        } else if (toolCall.name === "tavily_search_results_json") {
          // 执行搜索工具
          toolResult = await searchTool.invoke(toolCall);
        }
        
        if (toolResult) {
          // 构造工具返回消息
          toolMessages.push(new ToolMessage({
            tool_call_id: toolCall.id!,
            content: typeof toolResult === "string" ? toolResult : JSON.stringify(toolResult),
          }));
        }
      }

      // 5. 将分析历史、原 AI 回复和工具结果合并，进行最终回复
      const finalMessages = [
        ...formattedMessages,
        response,
        ...toolMessages,
      ];
      
      response = await modelWithTools.invoke(finalMessages);
    }

    return NextResponse.json({ 
      content: response.content,
      newMessages: isSummarized ? optimizedMessages : null 
    });
  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : "Internal Server Error";
    console.error("Chat API Error:", e);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
