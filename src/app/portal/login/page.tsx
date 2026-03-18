"use client";

import { useState } from "react";
import { GraduationCap, Mail, ArrowRight, CheckCircle2 } from "lucide-react";

export default function PortalLoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
  };

  if (sent) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-8 w-full max-w-sm text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 size={32} className="text-emerald-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">メールを送信しました</h2>
          <p className="text-sm text-slate-500 leading-relaxed">
            <span className="font-medium text-slate-700">{email}</span> にログインリンクを送りました。
            メールボックスをご確認ください。
          </p>
          <p className="text-xs text-slate-400 mt-4">
            ※ メールが届かない場合は迷惑メールフォルダをご確認ください
          </p>
          <button
            onClick={() => setSent(false)}
            className="mt-6 text-sm text-indigo-600 font-medium hover:underline"
          >
            メールアドレスを変更する
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
            <GraduationCap size={22} className="text-white" />
          </div>
          <span className="font-bold text-slate-800 text-2xl">Lessonbase</span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-8">
          <h1 className="text-xl font-bold text-slate-800 mb-1">保護者ポータル</h1>
          <p className="text-sm text-slate-400 mb-6">
            登録されたメールアドレスにログインリンクを送ります
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1.5">
                メールアドレス
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="yamada@example.com"
                  className="w-full pl-9 pr-4 py-3 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-indigo-600 text-white py-3 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
            >
              ログインリンクを送る
              <ArrowRight size={16} />
            </button>
          </form>

          <p className="text-xs text-slate-400 text-center mt-5 leading-relaxed">
            アカウントをお持ちでない方は<br />
            教室の先生にご連絡ください
          </p>
        </div>
      </div>
    </div>
  );
}
