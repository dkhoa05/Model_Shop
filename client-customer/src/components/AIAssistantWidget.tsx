"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { MessageCircle, Send, X } from "lucide-react";

interface Message {
  role: "assistant" | "user";
  content: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const initialMessages: Message[] = [
  {
    role: "assistant",
    content: "Xin chào! Mình có thể gợi ý mẫu Gundam hoặc figure theo ngân sách, độ khó khi lắp và tình trạng hàng."
  }
];

/** Hộp thoại trợ lý: role="dialog", Escape để đóng, nhận focus khi mở, tin nhắn mới được đọc qua vùng aria-live */
export default function AIAssistantWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const inputRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages, loading]);

  const close = () => {
    setOpen(false);
    triggerRef.current?.focus();
  };

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
      const answer = data?.answer || "Hệ thống tạm thời chưa trả lời được, bạn thử lại sau nhé.";
      setMessages((current) => [...current, { role: "assistant", content: answer }]);
    } catch {
      setMessages((current) => [...current, { role: "assistant", content: "Không kết nối được tới máy chủ. Vui lòng thử lại." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-40 sm:bottom-6 sm:right-6">
      {open && (
        <section
          role="dialog"
          aria-label="Trợ lý ModelShop"
          onKeyDown={(e) => e.key === "Escape" && close()}
          className="mb-3 flex h-[28rem] w-[22rem] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-[24px] border border-zinc-700 bg-zinc-900 shadow-pop"
        >
          <div className="flex items-center justify-between border-b border-zinc-800 p-4">
            <div>
              <h2 className="text-base font-bold text-fg">Trợ lý ModelShop</h2>
              <p className="text-sm text-zinc-400">Gợi ý theo ngân sách và cấp độ build</p>
            </div>
            <button type="button" onClick={close} aria-label="Đóng trợ lý" className="grid h-11 w-11 place-items-center rounded-xl text-zinc-300 hover:bg-zinc-800 hover:text-fg">
              <X size={20} aria-hidden />
            </button>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto p-4" role="log" aria-live="polite" aria-label="Cuộc trò chuyện">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-6 ${
                  message.role === "assistant" ? "bg-zinc-800 text-fg" : "ml-auto bg-accent font-medium text-on-accent"
                }`}
              >
                {message.content}
              </div>
            ))}
            {loading && <p className="text-sm text-zinc-400">Đang soạn câu trả lời...</p>}
            <div ref={endRef} />
          </div>

          <form onSubmit={handleSubmit} className="flex gap-2 border-t border-zinc-800 p-3">
            <label htmlFor="assistant-input" className="sr-only">
              Câu hỏi của bạn
            </label>
            <input ref={inputRef} id="assistant-input" value={input} onChange={(event) => setInput(event.target.value)} className="input min-h-11 py-2" placeholder="Ví dụ: người mới nên chọn mẫu nào?" autoComplete="off" />
            <button className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-accent text-on-accent transition hover:brightness-110 disabled:opacity-50" type="submit" aria-label="Gửi câu hỏi" disabled={loading || !input.trim()}>
              <Send size={18} aria-hidden />
            </button>
          </form>
        </section>
      )}

      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        className="flex min-h-12 items-center gap-2 rounded-full bg-accent px-5 text-[15px] font-bold text-on-accent shadow-pop transition hover:brightness-110 active:scale-95"
      >
        <MessageCircle size={20} aria-hidden />
        Hỏi trợ lý
      </button>
    </div>
  );
}
