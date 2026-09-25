"use client";

import { FormEvent, useState } from "react";
import { Bot, Send, X } from "lucide-react";

interface Message {
  role: "assistant" | "user";
  content: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const initialMessages: Message[] = [
  {
    role: "assistant",
    content: "Chao ban, toi co the tu van mau Gundam/Figure theo ngan sach, do kho build va tinh trang hang."
  }
];

export default function AIAssistantWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>(initialMessages);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const question = input.trim();
    if (!question || loading) return;

    setMessages((current) => [...current, { role: "user", content: question }]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/api/ai/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question })
      });
      const data = await response.json();
      const answer = data?.answer || "He thong AI tam thoi chua tra loi duoc, ban thu lai sau.";
      setMessages((current) => [...current, { role: "assistant", content: answer }]);
    } catch {
      setMessages((current) => [...current, { role: "assistant", content: "Khong the ket noi AI service. Vui long thu lai." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {open ? (
        <section className="mb-3 flex h-[460px] w-[340px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-[18px] border border-apple-hairline bg-white text-apple-ink shadow-product">
          <div className="flex items-center justify-between border-b border-apple-hairline p-4">
            <div className="flex items-center gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-apple-blue text-white">
                <Bot size={19} />
              </span>
              <div>
                <h2 className="text-sm font-semibold">AI ModelShop</h2>
                <p className="text-xs text-apple-muted">Tu van mua hang 24/7</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="text-apple-muted hover:text-apple-ink" aria-label="Dong AI chat">
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {messages.map((message, index) => (
              <div key={index} className={`rounded-[18px] p-3 text-sm leading-6 ${message.role === "assistant" ? "bg-apple-parchment text-apple-ink" : "ml-8 bg-apple-blue text-white"}`}>
                {message.content}
              </div>
            ))}
            {loading ? <p className="text-xs text-apple-muted">Dang phan tich...</p> : null}
          </div>

          <form onSubmit={handleSubmit} className="flex gap-2 border-t border-apple-hairline p-3">
            <input value={input} onChange={(event) => setInput(event.target.value)} className="input h-10 py-2" placeholder="Hoi ve san pham..." />
            <button className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-apple-blue text-white hover:bg-[#0071e3]" type="submit" aria-label="Gui cau hoi">
              <Send size={16} />
            </button>
          </form>
        </section>
      ) : null}

      <button onClick={() => setOpen((current) => !current)} className="flex h-11 items-center gap-2 rounded-full bg-apple-blue px-5 text-sm text-white shadow-product hover:bg-[#0071e3] active:scale-95">
        <Bot size={18} />
        AI tu van
      </button>
    </div>
  );
}
