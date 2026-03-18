import { CreditCard, Bell, Users, Building2, ChevronRight, CheckCircle2 } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">設定</h1>
        <p className="text-slate-400 text-sm mt-1">教室・決済・通知の設定</p>
      </div>

      <div className="space-y-6">
        {/* Studio info */}
        <section className="bg-white rounded-xl border border-slate-200">
          <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100">
            <Building2 size={18} className="text-slate-400" />
            <h2 className="font-semibold text-slate-800">教室情報</h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-slate-500 block mb-1.5">教室名</label>
                <input defaultValue="山田ピアノ教室" className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 block mb-1.5">教室の種別</label>
                <select className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
                  <option>ピアノ</option>
                  <option>バレエ</option>
                  <option>英会話</option>
                  <option>書道</option>
                  <option>その他</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 block mb-1.5">電話番号</label>
                <input defaultValue="03-1234-5678" className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 block mb-1.5">メールアドレス</label>
                <input defaultValue="yamada-piano@example.com" className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div className="col-span-2">
                <label className="text-xs font-medium text-slate-500 block mb-1.5">住所</label>
                <input defaultValue="東京都渋谷区〇〇町1-2-3" className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
            </div>
            <div className="flex justify-end">
              <button className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
                保存する
              </button>
            </div>
          </div>
        </section>

        {/* Payment settings */}
        <section className="bg-white rounded-xl border border-slate-200">
          <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100">
            <CreditCard size={18} className="text-slate-400" />
            <h2 className="font-semibold text-slate-800">決済設定</h2>
          </div>
          <div className="p-6 space-y-5">
            {/* PAY.JP status */}
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex items-center gap-3">
                <CheckCircle2 size={20} className="text-slate-400" />
                <div>
                  <p className="text-sm font-semibold text-slate-700">PAY.JP 決済</p>
                  <p className="text-xs text-slate-400 mt-0.5">APIキーは決済設定ページで管理します</p>
                </div>
              </div>
              <a href="/settings/payjp" className="text-xs text-indigo-600 font-medium border border-indigo-200 px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition-colors">
                決済設定へ
              </a>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-slate-500 block mb-1.5">月謝引き落とし日</label>
                <select className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
                  {[1, 5, 10, 15, 20, 25, 28].map((d) => (
                    <option key={d} selected={d === 1}>毎月 {d}日</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 block mb-1.5">決済手数料</label>
                <div className="border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-400 bg-slate-50">
                  PAY.JP 手数料 3.0%
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Notification settings */}
        <section className="bg-white rounded-xl border border-slate-200">
          <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100">
            <Bell size={18} className="text-slate-400" />
            <h2 className="font-semibold text-slate-800">通知設定</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {[
              { label: "未払いリマインド", desc: "引き落とし3日前・当日・3日後に自動送信", enabled: true },
              { label: "引き落とし失敗通知", desc: "引き落とし失敗時にオーナーへメール通知", enabled: true },
              { label: "欠席連絡の受信通知", desc: "保護者から欠席連絡が届いたときに通知", enabled: true },
              { label: "振替申請の受信通知", desc: "保護者から振替申請が届いたときに通知", enabled: false },
            ].map((n) => (
              <div key={n.label} className="flex items-center justify-between px-6 py-4">
                <div>
                  <p className="text-sm font-medium text-slate-800">{n.label}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{n.desc}</p>
                </div>
                <button
                  className={`relative w-11 h-6 rounded-full transition-colors ${n.enabled ? "bg-indigo-600" : "bg-slate-200"}`}
                >
                  <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${n.enabled ? "translate-x-5" : "translate-x-0.5"}`} />
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Staff */}
        <section className="bg-white rounded-xl border border-slate-200">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <Users size={18} className="text-slate-400" />
              <h2 className="font-semibold text-slate-800">講師アカウント</h2>
            </div>
            <button className="text-xs text-indigo-600 font-medium hover:underline">＋ 追加</button>
          </div>
          <div className="divide-y divide-slate-100">
            {[
              { name: "山田 花子", email: "hanako@example.com", role: "オーナー" },
              { name: "中川 ゆみ", email: "yumi@example.com", role: "講師" },
            ].map((s) => (
              <div key={s.email} className="flex items-center gap-4 px-6 py-4">
                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm shrink-0">
                  {s.name[0]}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-800">{s.name}</p>
                  <p className="text-xs text-slate-400">{s.email}</p>
                </div>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${s.role === "オーナー" ? "bg-indigo-50 text-indigo-600" : "bg-slate-100 text-slate-600"}`}>
                  {s.role}
                </span>
                <button className="text-slate-400 hover:text-slate-600">
                  <ChevronRight size={16} />
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
