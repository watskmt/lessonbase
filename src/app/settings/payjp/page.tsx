import { createClient } from "@/lib/supabase/server";
import { CheckCircle2, AlertCircle, ExternalLink, KeyRound } from "lucide-react";
import Link from "next/link";
import { savePayjpKeys } from "./actions";

export default async function PayjpSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: studioUser } = await supabase
    .from("studio_users")
    .select("studios(payjp_secret_key, payjp_public_key, billing_day)")
    .eq("auth_id", user!.id)
    .single();

  const studio = studioUser?.studios as unknown as {
    payjp_secret_key: string | null;
    payjp_public_key: string | null;
    billing_day: number;
  } | null;

  const isConfigured = !!studio?.payjp_secret_key;
  const justSaved = params.saved === "1";

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">PAY.JP 決済設定</h1>
        <p className="text-slate-400 text-sm mt-1">月謝の自動引き落としを設定します</p>
      </div>

      {justSaved && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-5 py-4 flex items-center gap-3 mb-6">
          <CheckCircle2 size={20} className="text-emerald-600 shrink-0" />
          <p className="text-sm text-emerald-800 font-medium">
            PAY.JP キーを保存しました。月謝の自動課金が使えるようになりました。
          </p>
        </div>
      )}

      <div className="space-y-6">
        {/* ステータス */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="font-semibold text-slate-800 mb-4">接続ステータス</h2>
          {isConfigured ? (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                <CheckCircle2 size={20} className="text-emerald-600" />
              </div>
              <div>
                <p className="font-semibold text-slate-800">PAY.JP 設定済み</p>
                <p className="text-xs text-slate-400 mt-0.5 font-mono">
                  {studio?.payjp_secret_key?.slice(0, 12)}••••••••
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                <AlertCircle size={20} className="text-amber-600" />
              </div>
              <div>
                <p className="font-semibold text-slate-800">未設定</p>
                <p className="text-sm text-slate-400">PAY.JP の API キーを設定してください</p>
              </div>
            </div>
          )}
        </div>

        {/* PAY.JP とは */}
        {!isConfigured && (
          <div className="bg-slate-50 rounded-xl p-5 space-y-2">
            <p className="text-sm font-semibold text-slate-700 mb-3">PAY.JP でできること</p>
            {[
              "クレジットカードで月謝を自動引き落とし",
              "入金管理・未払いリマインドを自動化",
              "手数料: 決済金額の 3.0%（国内最安水準）",
              "Visa / MasterCard / JCB / AMEX / Diners 対応",
            ].map((item) => (
              <div key={item} className="flex items-start gap-2 text-sm text-slate-600">
                <CheckCircle2 size={14} className="text-indigo-500 mt-0.5 shrink-0" />
                {item}
              </div>
            ))}
            <div className="pt-2">
              <a
                href="https://pay.jp"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-indigo-600 font-medium hover:underline"
              >
                PAY.JP でアカウントを作成する
                <ExternalLink size={13} />
              </a>
            </div>
          </div>
        )}

        {/* APIキー入力フォーム */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="font-semibold text-slate-800 mb-1 flex items-center gap-2">
            <KeyRound size={16} className="text-slate-400" />
            API キーの設定
          </h2>
          <p className="text-xs text-slate-400 mb-4">
            PAY.JP ダッシュボード →「API」からキーを確認できます。
            テスト中は <code className="bg-slate-100 px-1 rounded">sk_test_</code> / 本番は <code className="bg-slate-100 px-1 rounded">sk_live_</code> で始まるキーを使用してください。
          </p>

          <form action={savePayjpKeys} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1.5">
                シークレットキー <span className="text-red-400">*</span>
              </label>
              <input
                type="password"
                name="secret_key"
                defaultValue={studio?.payjp_secret_key ?? ""}
                placeholder="sk_test_xxxxxxxxxxxxxxxxxxxx"
                required
                className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm font-mono text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <p className="text-xs text-slate-400 mt-1">サーバーサイドでの課金処理に使用します。外部に公開しないでください。</p>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1.5">
                公開キー <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                name="public_key"
                defaultValue={studio?.payjp_public_key ?? ""}
                placeholder="pk_test_xxxxxxxxxxxxxxxxxxxx"
                required
                className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm font-mono text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <p className="text-xs text-slate-400 mt-1">保護者ポータルのカード登録フォームに使用します。</p>
            </div>
            <button
              type="submit"
              className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
            >
              保存する
            </button>
          </form>
        </div>

        {/* 引き落とし設定 */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="font-semibold text-slate-800 mb-4">引き落とし設定</h2>
          <form action="/api/settings/billing" method="POST" className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1.5">毎月の引き落とし日</label>
              <select
                name="billing_day"
                defaultValue={studio?.billing_day ?? 1}
                className="border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                {[1, 5, 10, 15, 20, 25, 28].map(d => (
                  <option key={d} value={d}>毎月 {d}日</option>
                ))}
              </select>
            </div>
            <button type="submit" className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
              保存する
            </button>
          </form>
        </div>

        {/* Webhook 設定ガイド */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="font-semibold text-slate-800 mb-3">Webhook 設定</h2>
          <p className="text-sm text-slate-500 mb-3">
            PAY.JP ダッシュボード →「Webhook」に以下の URL を登録してください。
          </p>
          <div className="bg-slate-50 rounded-lg px-4 py-3 font-mono text-sm text-slate-700 flex items-center justify-between gap-3">
            <span className="truncate">{"{あなたのドメイン}"}/api/payjp/webhook</span>
            <Link href="https://pay.jp" target="_blank" rel="noopener noreferrer">
              <ExternalLink size={14} className="text-slate-400 shrink-0" />
            </Link>
          </div>
          <p className="text-xs text-slate-400 mt-2">
            受信するイベント: <code className="bg-slate-100 px-1 rounded">charge.succeeded</code>　<code className="bg-slate-100 px-1 rounded">charge.failed</code>　<code className="bg-slate-100 px-1 rounded">subscription.created</code>
          </p>
        </div>
      </div>
    </div>
  );
}
