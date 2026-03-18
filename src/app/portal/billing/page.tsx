import { createClient } from "@/lib/supabase/server";
import { CheckCircle2, Clock, Download, CreditCard, ChevronRight, XCircle } from "lucide-react";
import { formatJpy } from "@/lib/utils";

const statusConfig = {
  paid:    { label: "支払済",   icon: CheckCircle2, class: "text-emerald-600 bg-emerald-50" },
  pending: { label: "未払い",   icon: Clock,        class: "text-amber-600 bg-amber-50" },
  failed:  { label: "引落失敗", icon: XCircle,      class: "text-red-600 bg-red-50" },
};

export default async function PortalBillingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: guardian } = await supabase
    .from("guardians")
    .select("id, payjp_customer_id")
    .eq("auth_id", user!.id)
    .single();

  const { data: invoices } = await supabase
    .from("invoices")
    .select("*, billing_periods(year, month)")
    .eq("guardian_id", guardian?.id ?? "")
    .order("created_at", { ascending: false });

  const pending = (invoices ?? []).filter(i => i.status === "pending" || i.status === "failed");
  const paid = (invoices ?? []).filter(i => i.status === "paid");

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-800">支払い</h1>
        <p className="text-slate-400 text-sm mt-0.5">月謝・請求の確認</p>
      </div>

      {/* 未払い・失敗 */}
      {pending.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">お支払い待ち</h2>
          {pending.map((inv) => {
            const period = inv.billing_periods as { year: number; month: number } | null;
            const monthLabel = period ? `${period.year}年${period.month}月` : "";
            const cfg = statusConfig[inv.status as keyof typeof statusConfig] ?? statusConfig.pending;
            return (
              <div key={inv.id} className="bg-white rounded-2xl border border-amber-200 p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-xs text-amber-600 font-medium">{monthLabel}</p>
                    <p className="font-semibold text-slate-800 mt-0.5">{inv.description}</p>
                  </div>
                  <span className={`flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${cfg.class}`}>
                    <cfg.icon size={12} />
                    {cfg.label}
                  </span>
                </div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-2xl font-bold text-slate-800">{formatJpy(inv.amount)}</p>
                  {inv.due_date && <p className="text-xs text-slate-400">期日: {inv.due_date}</p>}
                </div>
                <button className="w-full bg-indigo-600 text-white py-3 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2">
                  <CreditCard size={14} />
                  今すぐ支払う
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* 支払い方法 */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
              <CreditCard size={18} className="text-slate-500" />
            </div>
            <div>
              <p className="text-xs text-slate-400">登録カード</p>
              {guardian?.payjp_customer_id ? (
                <p className="font-semibold text-slate-800 text-sm">カード登録済み</p>
              ) : (
                <p className="font-semibold text-slate-500 text-sm">カード未登録</p>
              )}
            </div>
          </div>
          <button className="text-xs text-indigo-600 font-medium flex items-center gap-1">
            変更 <ChevronRight size={12} />
          </button>
        </div>
      </div>

      {/* 支払い履歴 */}
      {paid.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">支払い履歴</h2>
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden divide-y divide-slate-100">
            {paid.map((inv) => {
              const period = inv.billing_periods as { year: number; month: number } | null;
              const monthLabel = period ? `${period.year}年${period.month}月` : "";
              const paidAt = inv.paid_at
                ? new Date(inv.paid_at).toLocaleDateString("ja-JP", { month: "numeric", day: "numeric" })
                : "—";
              return (
                <div key={inv.id} className="flex items-center px-4 py-4 gap-3">
                  <div className="w-9 h-9 bg-emerald-50 rounded-xl flex items-center justify-center shrink-0">
                    <CheckCircle2 size={16} className="text-emerald-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{inv.description}</p>
                    <p className="text-xs text-slate-400">{monthLabel}　{paidAt}支払済</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-slate-800">{formatJpy(inv.amount)}</p>
                    <button className="text-xs text-indigo-600 flex items-center gap-1 mt-0.5">
                      <Download size={10} />
                      領収書
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {invoices?.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 px-5 py-8 text-center text-slate-400 text-sm">
          支払い履歴はまだありません
        </div>
      )}
    </div>
  );
}
