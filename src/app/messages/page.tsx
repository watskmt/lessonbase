import { Send, Users, ChevronRight, CheckCheck, Check } from "lucide-react";

const messages = [
  {
    id: 1,
    title: "3月の発表会について",
    target: "全員",
    sent: "3/15 10:00",
    readCount: 38,
    totalCount: 42,
    preview: "3月28日（土）14:00より発表会を開催いたします。お子様のご参加をお待ちしております。",
  },
  {
    id: 2,
    title: "【重要】3/19（水）休講のお知らせ",
    target: "初級ピアノ A・B",
    sent: "3/14 18:30",
    readCount: 14,
    totalCount: 14,
    preview: "講師体調不良のため、3月19日の授業を休講とさせていただきます。振替授業の日程は別途ご連絡します。",
  },
  {
    id: 3,
    title: "4月からの月謝改定について",
    target: "全員",
    sent: "3/10 09:00",
    readCount: 40,
    totalCount: 42,
    preview: "日頃よりご利用いただきありがとうございます。物価高騰に伴い、4月より月謝を改定させていただきます。",
  },
];

const templates = [
  { id: 1, name: "休講連絡" },
  { id: 2, name: "振替授業のご案内" },
  { id: 3, name: "月謝のご請求" },
  { id: 4, name: "発表会のご案内" },
  { id: 5, name: "入会ご案内" },
];

export default function MessagesPage() {
  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">連絡</h1>
          <p className="text-slate-400 text-sm mt-1">保護者への一斉・個別連絡</p>
        </div>
        <button className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
          <Send size={16} />
          新規メッセージ
        </button>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Message list */}
        <div className="col-span-2 space-y-4">
          {messages.map((m) => {
            const allRead = m.readCount === m.totalCount;
            return (
              <div key={m.id} className="bg-white rounded-xl border border-slate-200 p-5 hover:border-slate-300 transition-colors cursor-pointer">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800 text-sm">{m.title}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="flex items-center gap-1 text-xs text-slate-400">
                        <Users size={12} />
                        {m.target}
                      </span>
                      <span className="text-xs text-slate-400">{m.sent}</span>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-slate-400 shrink-0 mt-0.5" />
                </div>
                <p className="text-xs text-slate-500 leading-relaxed line-clamp-2 mb-3">{m.preview}</p>
                <div className="flex items-center gap-2">
                  {allRead ? (
                    <CheckCheck size={14} className="text-indigo-500" />
                  ) : (
                    <Check size={14} className="text-slate-400" />
                  )}
                  <span className="text-xs text-slate-500">
                    既読 <span className={`font-semibold ${allRead ? "text-indigo-600" : "text-slate-700"}`}>{m.readCount}</span> / {m.totalCount}名
                  </span>
                  <div className="flex-1 bg-slate-100 rounded-full h-1.5 ml-2">
                    <div
                      className={`h-1.5 rounded-full ${allRead ? "bg-indigo-500" : "bg-slate-400"}`}
                      style={{ width: `${(m.readCount / m.totalCount) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right: compose + templates */}
        <div className="space-y-6">
          {/* Quick compose */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h2 className="font-semibold text-slate-800 mb-4">クイック送信</h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-500 block mb-1">送信先</label>
                <select className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
                  <option>全員（42名）</option>
                  <option>初級ピアノ A</option>
                  <option>初級ピアノ B</option>
                  <option>中級ピアノ</option>
                  <option>上級ピアノ</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 block mb-1">件名</label>
                <input
                  type="text"
                  placeholder="件名を入力..."
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 block mb-1">本文</label>
                <textarea
                  rows={5}
                  placeholder="メッセージを入力..."
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>
              <button className="w-full bg-indigo-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2">
                <Send size={14} />
                送信する
              </button>
            </div>
          </div>

          {/* Templates */}
          <div className="bg-white rounded-xl border border-slate-200">
            <div className="px-5 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-800">テンプレート</h2>
            </div>
            <div className="divide-y divide-slate-100">
              {templates.map((t) => (
                <button key={t.id} className="w-full flex items-center justify-between px-5 py-3 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                  {t.name}
                  <ChevronRight size={14} className="text-slate-400" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
