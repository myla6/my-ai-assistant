import { ChatOpenAI } from "@langchain/openai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    
    // 1. 初始化模型
    const model = new ChatOpenAI({
      modelName: "deepseek-chat", // 或者 gpt-3.5-turbo
      temperature: 0.7,    // 创造性程度
      // 关键：增加下面这一段，让它支持通过环境变量读取 BaseURL
      configuration: {
        baseURL: process.env.OPENAI_API_BASE, 
      },
    });

    // 2. 调用模型 (最简单的调用方式)
    // 注意：messages 格式需要符合 OpenAI 标准
    const response = await model.invoke(messages);

    return NextResponse.json({ content: response.content });
  } catch (e: any) {
    console.error("Chat API Error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
