import { createClient } from "@/lib/supabase/server";
import { CheckCircle2, XCircle, AlertCircle, Users, CalendarCheck, TrendingUp, Clock } from "lucide-react";
import { respondToReschedule } from "@/actions/reschedule";

export default async function Dashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: studioUser } = await supabase
    .from("studio_users")
    .select("studio_id, studios(name, billing_day)")
    .eq("auth_id", user!.id)
    .single();

  const studioId = studioUser?.studio_id;
  const studioName = (studioUser?.studios as unknown as { name: string } | null)?.name ?? "教室";

  const today = new Date();
  // const todayStr = today.toISOString().split("T")[0];
  const todayDow = today.getDay();

  // 並列で全データを取得
  const [studentsRes, todayLessonsRes, unpaidRes, salesRes, alertsRes, rescheduleRes] =
    await Promise.all([
      // 生徒数
      supabase
        .from("students")
        .select("id, status")
        .eq("studio_id", studioId),

      // 今日の授業
      supabase
        .from("classes")
        .select("id, name, start_time, end_time, class_enrollments(id)")
        .eq("studio_id", studioId)
        .eq("day_of_week", todayDow)
        .order("start_time"),

      // 未払い
      supabase
        .from("invoices")
        .select("id, amount, students(name), due_date")
        .eq("studio_id", studioId)
        .eq("status", "pending"),

      // 今月の売上
      supabase
        .from("invoices")
        .select("amount")
        .eq("studio_id", studioId)
        .eq("status", "paid")
        .gte("paid_at", new Date(today.getFullYear(), today.getMonth(), 1).toISOString()),

      // 失敗した請求
      supabase
        .from("invoices")
        .select("id, students(name), failed_at")
        .eq("studio_id", studioId)
        .eq("status", "failed")
        .order("failed_at", { ascending: false })
        .limit(5),

      // 振替申請
      supabase
        .from("reschedule_requests")
        .select("id, students(name), attendance(lessons(date, classes(name))), target_lesson_id")
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

  const activeStudents = studentsRes.data?.filter(s => s.status === "active").length ?? 0;
  const totalSales = salesRes.data?.reduce((sum, i) => sum + i.amount, 0) ?? 0;
  const unpaidCount = unpaidRes.data?.length ?? 0;
  const todayClasses = todayLessonsRes.data ?? [];
  const rescheduleRequests = rescheduleRes.data ?? [];

  const stats = [
    { label: "在籍生徒数", value: String(activeStudents), unit: "名", icon: Users, color: "bg-indigo-50 text-indigo-600", sub: "" },
    { label: "今月の未払い", value: String(unpaidCount), unit: "件", icon: AlertCircle, color: "bg-red-50 text-red-500", sub: unpaidCount > 0 ? "要対応" : "なし" },
    { label: "今日の授業", value: String(todayClasses.length), unit: "コマ", icon: CalendarCheck, color: "bg-emerald-50 text-emerald-600", sub: todayClasses[0] ? `次: ${todayClasses[0].start_time.slice(0, 5)}〜` : "" },
    { label: "今月の売上", value: totalSales.toLocaleString(), unit: "円", icon: TrendingUp, color: "bg-amber-50 text-amber-600", sub: "" },
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">ダッシュボード</h1>
        <p className="text-slate-400 text-sm mt-1">
          {today.toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric", weekday: "short" })}
          　{studioName}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-slate-500">{s.label}</span>
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${s.color}`}>
                <s.icon size={18} />
              </div>
            </div>
            <div className="flex items-end gap-1">
              <span className="text-3xl font-bold text-slate-800">{s.value}</span>
              <span className="text-slate-500 text-sm mb-0.5">{s.unit}</span>
            </div>
            {s.sub && <p className="text-xs text-slate-400 mt-1">{s.sub}</p>}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Today's classes */}
        <div className="col-span-2 bg-white rounded-xl border border-slate-200">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-800">今日の授業</h2>
            <span className="text-xs text-slate-400">
              {today.toLocaleDateString("ja-JP", { month: "numeric", day: "numeric", weekday: "short" })}
            </span>
          </div>
          {todayClasses.length === 0 ? (
            <div className="px-6 py-8 text-center text-slate-400 text-sm">今日は授業がありません</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {todayClasses.map((c) => {
                const enrollCount = (c.class_enrollments as { id: string }[] | null)?.length ?? 0;
                return (
                  <div key={c.id} className="flex items-center px-6 py-4 gap-4">
                    <div className="flex items-center gap-2 w-16">
                      <Clock size={14} className="text-slate-400" />
                      <span className="text-sm font-mono text-slate-600">{c.start_time.slice(0, 5)}</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-800">{c.name}</p>
                      <p className="text-xs text-slate-400">{enrollCount}名</p>
                    </div>
                    <a href="/attendance" className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition-colors">
                      出欠入力
                    </a>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="space-y-6">
          {/* Alerts */}
          <div className="bg-white rounded-xl border border-slate-200">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-800">アラート</h2>
              {unpaidCount > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                  {unpaidCount}
                </span>
              )}
            </div>
            <div className="divide-y divide-slate-100">
              {unpaidRes.data?.slice(0, 3).map((inv) => (
                <div key={inv.id} className="px-5 py-3.5 flex gap-3">
                  <XCircle size={16} className="text-red-400 mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-700 leading-relaxed">
                      {(inv.students as unknown as { name: string } | null)?.name} の月謝が未払いです
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      期日: {inv.due_date ?? "未設定"}
                    </p>
                  </div>
                </div>
              ))}
              {alertsRes.data?.slice(0, 2).map((inv) => (
                <div key={inv.id} className="px-5 py-3.5 flex gap-3">
                  <AlertCircle size={16} className="text-amber-400 mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-700 leading-relaxed">
                      {(inv.students as unknown as { name: string } | null)?.name} の引き落としが失敗しました
                    </p>
                  </div>
                </div>
              ))}
              {unpaidCount === 0 && (alertsRes.data?.length ?? 0) === 0 && (
                <div className="px-5 py-4 text-center">
                  <CheckCircle2 size={16} className="text-emerald-500 mx-auto mb-1" />
                  <p className="text-xs text-slate-400">アラートはありません</p>
                </div>
              )}
            </div>
          </div>

          {/* Reschedule requests */}
          <div className="bg-white rounded-xl border border-slate-200">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-800">振替申請</h2>
              <span className="text-xs text-indigo-600 font-medium">{rescheduleRequests.length}件</span>
            </div>
            {rescheduleRequests.length === 0 ? (
              <div className="px-5 py-4 text-center text-xs text-slate-400">申請はありません</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {rescheduleRequests.map((r) => {
                  const studentName = (r.students as unknown as { name: string } | null)?.name ?? "—";
                  return (
                    <div key={r.id} className="px-5 py-3.5">
                      <div className="flex items-center justify-between mb-1.5">
                        <p className="text-sm font-medium text-slate-800">{studentName}</p>
                        <span className="text-xs bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full">承認待ち</span>
                      </div>
                      <div className="flex gap-2 mt-2.5">
                        <form action={async () => { "use server"; await respondToReschedule(r.id, "approved"); }}>
                          <button className="flex-1 text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-1">
                            <CheckCircle2 size={12} />
                            承認
                          </button>
                        </form>
                        <form action={async () => { "use server"; await respondToReschedule(r.id, "rejected"); }}>
                          <button className="flex-1 text-xs border border-slate-200 text-slate-600 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-1">
                            <XCircle size={12} />
                            却下
                          </button>
                        </form>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
