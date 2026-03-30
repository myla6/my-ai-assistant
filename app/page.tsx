"use client";

import { useState } from "react";

export default function ChatPage() {
  const [input, setInput] = useState("");
  const [chatLog, setChatLog] = useState<{ role: string; content: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg = { role: "user", content: input };
    setChatLog((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [userMsg] }),
      });
      const data = await res.json();

      if (data.error) {
        setChatLog((prev) => [...prev, { role: "assistant", content: `Error: ${data.error}` }]);
      } else {
        setChatLog((prev) => [...prev, { role: "assistant", content: data.content }]);
      }
    } catch (error) {
      console.error("Fetch error:", error);
      setChatLog((prev) => [...prev, { role: "assistant", content: "抱歉，出错了，请检查后台日志或 API Key 配置。" }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-8 min-h-screen flex flex-col font-sans">
      <header className="mb-8 border-b pb-4">
        <h1 className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-teal-500">
          我的 AI 助手
        </h1>
        <p className="text-gray-500 text-sm mt-1">基于 Next.js + LangChain.js</p>
      </header>

      <div className="flex-1 border rounded-xl p-6 h-[500px] overflow-y-auto mb-6 bg-white shadow-sm border-gray-100 flex flex-col gap-4">
        {chatLog.length === 0 && (
          <div className="text-center text-gray-400 mt-20">
            👋 你好！有什么我可以帮你的吗？
          </div>
        )}
        {chatLog.map((msg, i) => (
          <div
            key={i}
            className={`max-w-[80%] p-4 rounded-2xl ${
              msg.role === "user"
                ? "bg-blue-600 text-white self-end rounded-br-none shadow-md"
                : "bg-gray-100 text-gray-800 self-start rounded-bl-none border border-gray-200"
            } animate-in fade-in slide-in-from-bottom-2 duration-300`}
          >
            <div className="text-xs opacity-70 mb-1 font-bold uppercase tracking-wider">
              {msg.role === "user" ? "我" : "AI"}
            </div>
            <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>
          </div>
        ))}
        {isLoading && (
          <div className="bg-gray-100 text-gray-400 self-start p-4 rounded-2xl rounded-bl-none border border-gray-200 animate-pulse">
            AI 正在思考中...
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-3 sticky bottom-8">
        <input
          className="flex-1 border border-gray-200 p-4 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-black"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="问点什么..."
          disabled={isLoading}
        />
        <button
          className={`px-8 py-4 rounded-xl font-bold transition-all shadow-lg active:scale-95 ${
            isLoading
              ? "bg-gray-300 cursor-not-allowed"
              : "bg-black text-white hover:bg-gray-800"
          }`}
          disabled={isLoading}
        >
          {isLoading ? "发送中..." : "发送"}
        </button>
      </form>

      <footer className="mt-8 text-center text-xs text-gray-400">
        Demo developed with Antigravity AI
      </footer>
    </div>
  );
}
