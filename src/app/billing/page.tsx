import { createClient } from "@/lib/supabase/server";
import { CheckCircle2, XCircle, Clock, AlertTriangle, Send, Download, Plus, RefreshCw } from "lucide-react";
import { formatJpy } from "@/lib/utils";

const statusConfig = {
  paid:      { label: "支払済",    icon: CheckCircle2, class: "bg-emerald-50 text-emerald-600" },
  pending:   { label: "未払い",    icon: Clock,        class: "bg-red-50 text-red-500" },
  failed:    { label: "引落失敗",  icon: XCircle,      class: "bg-red-100 text-red-700" },
  cancelled: { label: "キャンセル", icon: AlertTriangle, class: "bg-slate-100 text-slate-400" },
};

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; month?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: studioUser } = await supabase
    .from("studio_users")
    .select("studio_id")
    .eq("auth_id", user!.id)
    .single();

  const studioId = studioUser?.studio_id;
  const now = new Date();
  const year = Number(params.year ?? now.getFullYear());
  const month = Number(params.month ?? now.getMonth() + 1);

  // 請求データ
  const { data: invoices } = await supabase
    .from("invoices")
    .select("*, students(name), guardians(email)")
    .eq("studio_id", studioId)
    .order("created_at", { ascending: false });

  // 今月の期間でフィルタリング（billing_period_id は null の場合も含む）
  const thisMonthStart = new Date(year, month - 1, 1).toISOString();
  const thisMonthEnd = new Date(year, month, 0, 23, 59, 59).toISOString();

  const monthlyInvoices = (invoices ?? []).filter(inv => {
    const created = inv.created_at;
    return created >= thisMonthStart && created <= thisMonthEnd;
  });

  const totalAmount = monthlyInvoices.reduce((s, i) => s + i.amount, 0);
  const paidAmount = monthlyInvoices.filter(i => i.status === "paid").reduce((s, i) => s + i.amount, 0);
  const pendingAmount = monthlyInvoices.filter(i => i.status === "pending").reduce((s, i) => s + i.amount, 0);
  const failedAmount = monthlyInvoices.filter(i => i.status === "failed").reduce((s, i) => s + i.amount, 0);

  const summaryCards = [
    { label: "今月の請求合計", value: formatJpy(totalAmount), sub: `${monthlyInvoices.length}件`, color: "text-slate-800" },
    { label: "入金済", value: formatJpy(paidAmount), sub: `${monthlyInvoices.filter(i => i.status === "paid").length}件`, color: "text-emerald-600" },
    { label: "未収", value: formatJpy(pendingAmount), sub: `${monthlyInvoices.filter(i => i.status === "pending").length}件`, color: "text-red-500" },
    { label: "引落失敗", value: formatJpy(failedAmount), sub: `${monthlyInvoices.filter(i => i.status === "failed").length}件`, color: "text-red-700" },
  ];

  // 月タブ用（直近3ヶ月）
  const monthTabs = [-2, -1, 0].map(offset => {
    const d = new Date(now.getFullYear(), now.getMonth() + offset, 1);
    return { year: d.getFullYear(), month: d.getMonth() + 1, label: `${d.getFullYear()}年${d.getMonth() + 1}月` };
  });

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">請求・決済</h1>
          <p className="text-slate-400 text-sm mt-1">{year}年{month}月分</p>
        </div>
        <div className="flex gap-3">
          <form action={`/api/billing/generate`} method="POST">
            <button
              type="submit"
              className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 text-slate-600 rounded-lg text-sm hover:bg-slate-50 transition-colors"
            >
              <RefreshCw size={16} />
              月次請求を生成
            </button>
          </form>
          <a
            href="/billing/extra/new"
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            <Plus size={16} />
            臨時請求を作成
          </a>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {summaryCards.map((c) => (
          <div key={c.label} className="bg-white rounded-xl border border-slate-200 p-5">
            <p className="text-sm text-slate-500 mb-2">{c.label}</p>
            <p className={`text-2xl font-bold ${c.color}`}>{c.value}</p>
            <p className="text-xs text-slate-400 mt-1">{c.sub}</p>
          </div>
        ))}
      </div>

      {/* Month tabs */}
      <div className="flex gap-2 mb-6">
        {monthTabs.map((m) => {
          const isActive = m.year === year && m.month === month;
          return (
            <a
              key={m.label}
              href={`/billing?year=${m.year}&month=${m.month}`}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive ? "bg-indigo-600 text-white" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {m.label}
            </a>
          );
        })}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {monthlyInvoices.length === 0 ? (
          <div className="px-6 py-12 text-center text-slate-400 text-sm">
            この月の請求データはありません。<br />「月次請求を生成」ボタンで作成できます。
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">生徒名</th>
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">内容</th>
                <th className="text-right px-4 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">金額</th>
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">ステータス</th>
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">期日</th>
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">アクション</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {monthlyInvoices.map((inv) => {
                const cfg = statusConfig[inv.status as keyof typeof statusConfig] ?? statusConfig.pending;
                return (
                  <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-slate-800">
                      {(inv.students as unknown as { name: string } | null)?.name ?? "—"}
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-500">{inv.description}</td>
                    <td className="px-4 py-4 text-sm font-mono text-slate-800 text-right">
                      {formatJpy(inv.amount)}
                    </td>
                    <td className="px-4 py-4">
                      <span className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full w-fit ${cfg.class}`}>
                        <cfg.icon size={12} />
                        {cfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-500">{inv.due_date ?? "—"}</td>
                    <td className="px-4 py-4">
                      {inv.status === "pending" && (
                        <form action="/api/billing/remind" method="POST">
                          <input type="hidden" name="invoiceId" value={inv.id} />
                          <button className="flex items-center gap-1.5 text-xs text-indigo-600 font-medium hover:underline">
                            <Send size={12} />
                            リマインド送信
                          </button>
                        </form>
                      )}
                      {inv.status === "failed" && (
                        <span className="flex items-center gap-1.5 text-xs text-red-600 font-medium">
                          <Send size={12} />
                          再請求する
                        </span>
                      )}
                      {inv.status === "paid" && (
                        <button className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600">
                          <Download size={12} />
                          領収書
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
