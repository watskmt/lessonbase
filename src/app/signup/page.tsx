"use client";

import { useState } from "react";
import { GraduationCap, Mail, Lock, User, Building2, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

const STUDIO_TYPES = ["ピアノ", "バレエ", "英会話", "サッカー", "書道", "ダンス", "水泳", "その他"];

export default function SignupPage() {
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [studioName, setStudioName] = useState("");
  const [studioType, setStudioType] = useState("ピアノ");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();

    // 1. Supabase Auth にサインアップ
    const { data, error: signupError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (signupError || !data.user) {
      setError(signupError?.message ?? "登録に失敗しました");
      setLoading(false);
      return;
    }

    // 2. studios & studio_users を作成（サービスロール経由の API を呼ぶ）
    const res = await fetch("/api/setup-studio", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        authId: data.user.id,
        name,
        email,
        studioName,
        studioType,
      }),
    });

    if (!res.ok) {
      setError("教室の作成に失敗しました。再度お試しください。");
      setLoading(false);
      return;
    }

    setDone(true);
    setLoading(false);
  };

  if (done) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-8 w-full max-w-sm text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 size={32} className="text-emerald-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">登録完了！</h2>
          <p className="text-sm text-slate-500 leading-relaxed">
            <span className="font-medium text-slate-700">{email}</span> に確認メールを送りました。
            メール内のリンクをクリックしてログインしてください。
          </p>
          <Link href="/login" className="block mt-6 text-sm text-indigo-600 font-medium hover:underline">
            ログイン画面へ
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
            <GraduationCap size={22} className="text-white" />
          </div>
          <span className="font-bold text-slate-800 text-2xl">Lessonbase</span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-8">
          {/* Steps indicator */}
          <div className="flex items-center gap-2 mb-6">
            {[1, 2].map((s) => (
              <div key={s} className={`flex-1 h-1.5 rounded-full ${step >= s ? "bg-indigo-600" : "bg-slate-200"}`} />
            ))}
          </div>

          <h1 className="text-xl font-bold text-slate-800 mb-1">
            {step === 1 ? "アカウント作成" : "教室情報を入力"}
          </h1>
          <p className="text-sm text-slate-400 mb-6">
            {step === 1 ? "ステップ 1/2 — 基本情報" : "ステップ 2/2 — 教室情報"}
          </p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-4">
              {error}
            </div>
          )}

          {step === 1 ? (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1.5">お名前</label>
                <div className="relative">
                  <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text" required value={name} onChange={e => setName(e.target.value)}
                    placeholder="山田 花子"
                    className="w-full pl-9 pr-4 py-3 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1.5">メールアドレス</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email" required value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="yamada@example.com"
                    className="w-full pl-9 pr-4 py-3 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1.5">パスワード</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showPassword ? "text" : "password"} required value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="8文字以上"
                    minLength={8}
                    className="w-full pl-9 pr-10 py-3 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <button
                onClick={() => { if (name && email && password.length >= 8) setStep(2); }}
                disabled={!name || !email || password.length < 8}
                className="w-full bg-indigo-600 text-white py-3 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                次へ
              </button>
            </div>
          ) : (
            <form onSubmit={handleSignup} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1.5">教室名</label>
                <div className="relative">
                  <Building2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text" required value={studioName} onChange={e => setStudioName(e.target.value)}
                    placeholder="山田ピアノ教室"
                    className="w-full pl-9 pr-4 py-3 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1.5">教室の種別</label>
                <div className="grid grid-cols-4 gap-2">
                  {STUDIO_TYPES.map(t => (
                    <button
                      key={t} type="button" onClick={() => setStudioType(t)}
                      className={`py-2 rounded-xl text-xs font-medium border transition-colors ${studioType === t ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-slate-600 border-slate-200 hover:border-indigo-300"}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button" onClick={() => setStep(1)}
                  className="flex-1 border border-slate-200 text-slate-600 py-3 rounded-xl text-sm font-medium hover:bg-slate-50"
                >
                  戻る
                </button>
                <button
                  type="submit" disabled={loading || !studioName}
                  className="flex-1 bg-indigo-600 text-white py-3 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "登録中..." : "登録する"}
                </button>
              </div>
            </form>
          )}

          <p className="text-xs text-slate-400 text-center mt-5">
            すでにアカウントをお持ちの方は{" "}
            <Link href="/login" className="text-indigo-600 font-medium hover:underline">ログイン</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
