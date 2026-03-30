import { ChatOpenAI } from "@langchain/openai";
import { NextResponse } from "next/server";
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { HumanMessage, AIMessage, ToolMessage } from "@langchain/core/messages";

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

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export async function POST(req: Request) {
  try {
    const { messages }: { messages: ChatMessage[] } = await req.json();
    
    // 1. 初始化模型并绑定工具
    const model = new ChatOpenAI({
      modelName: "deepseek-chat", // 或者 gpt-4o-mini
      temperature: 0.7,
      configuration: {
        baseURL: process.env.OPENAI_API_BASE,
      },
    }).bindTools([weatherTool]);

    // 2. 将传入的消息转换为 LangChain 消息格式
    const formattedMessages = messages.map((m) => {
      if (m.role === "user") return new HumanMessage(m.content);
      return new AIMessage(m.content);
    });

    // 3. 第一次调用模型
    let response = await model.invoke(formattedMessages);

    // 4. 判断模型是否想要调用工具
    if (response.tool_calls && response.tool_calls.length > 0) {
      const toolMessages: ToolMessage[] = [];
      
      for (const toolCall of response.tool_calls) {
        if (toolCall.name === "get_weather") {
          // 执行工具函数 (传入工具参数)
          const toolResult = await weatherTool.invoke(toolCall);
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
      
      response = await model.invoke(finalMessages);
    }

    return NextResponse.json({ content: response.content });
  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : "Internal Server Error";
    console.error("Chat API Error:", e);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
