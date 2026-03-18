"use client";

import { useState, useTransition } from "react";
import { ChevronLeft, CheckCheck } from "lucide-react";
import { markMessageRead } from "@/actions/messages";

export interface MessageItem {
  id: string;
  title: string;
  body: string;
  created_at: string;
  isRead: boolean;
}

export function MessagesClient({ messages }: { messages: MessageItem[] }) {
  const [selected, setSelected] = useState<string | null>(null);
  const [localRead, setLocalRead] = useState<Set<string>>(new Set());
  const [, startTransition] = useTransition();

  const message = messages.find(m => m.id === selected);
  const unread = messages.filter(m => !m.isRead && !localRead.has(m.id)).length;

  const handleOpen = (id: string, isRead: boolean) => {
    setSelected(id);
    if (!isRead && !localRead.has(id)) {
      setLocalRead(prev => new Set([...prev, id]));
      startTransition(() => { markMessageRead(id); });
    }
  };

  if (selected && message) {
    const dateStr = new Date(message.created_at).toLocaleDateString("ja-JP", { month: "long", day: "numeric" });
    return (
      <div className="space-y-4">
        <button onClick={() => setSelected(null)} className="flex items-center gap-1 text-sm text-indigo-600 font-medium">
          <ChevronLeft size={16} />
          お知らせ一覧
        </button>
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <p className="text-xs text-slate-400 mb-1">{dateStr}</p>
          <h1 className="text-lg font-bold text-slate-800 mb-4">{message.title}</h1>
          <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-line border-t border-slate-100 pt-4">
            {message.body}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-800">お知らせ</h1>
        {unread > 0 && (
          <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5 font-bold">未読 {unread}</span>
        )}
      </div>

      {messages.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 px-5 py-8 text-center text-slate-400 text-sm">
          お知らせはありません
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden divide-y divide-slate-100">
          {messages.map((m) => {
            const isRead = m.isRead || localRead.has(m.id);
            const dateStr = new Date(m.created_at).toLocaleDateString("ja-JP", { month: "numeric", day: "numeric" });
            return (
              <button key={m.id} onClick={() => handleOpen(m.id, m.isRead)} className="w-full text-left px-5 py-4 hover:bg-slate-50 transition-colors flex gap-3">
                <div className={`w-2 h-2 mt-1.5 shrink-0 rounded-full ${!isRead ? "bg-indigo-500" : ""}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <p className={`text-sm truncate ${!isRead ? "font-semibold text-slate-800" : "text-slate-600"}`}>{m.title}</p>
                    <span className="text-xs text-slate-400 shrink-0">{dateStr}</span>
                  </div>
                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{m.body?.slice(0, 80)}</p>
                  {isRead && (
                    <span className="flex items-center gap-1 text-xs text-slate-300 mt-1">
                      <CheckCheck size={11} />
                      既読
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
