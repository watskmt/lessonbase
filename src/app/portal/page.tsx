import { createClient } from "@/lib/supabase/server";
import { CheckCircle2, XCircle, ArrowLeftRight, Bell, ChevronRight, CreditCard } from "lucide-react";
import Link from "next/link";

const statusConfig = {
  present:   { label: "出席", icon: CheckCircle2, class: "text-emerald-600 bg-emerald-50" },
  absent:    { label: "欠席", icon: XCircle,       class: "text-red-500 bg-red-50" },
  reschedule:{ label: "振替", icon: ArrowLeftRight, class: "text-amber-600 bg-amber-50" },
};

export default async function PortalHome() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: guardian } = await supabase
    .from("guardians")
    .select("id, name, student_id, students(id, name, status, class_enrollments(classes(name, day_of_week, start_time, end_time)))")
    .eq("auth_id", user!.id)
    .single();

  const student = (guardian?.students as unknown as {
    id: string;
    name: string;
    status: string;
    class_enrollments: { classes: { name: string; day_of_week: number; start_time: string; end_time: string } }[];
  } | null);

  // 出席履歴
  const { data: attendanceHistory } = await supabase
    .from("attendance")
    .select("status, updated_at, lessons(date, classes(name))")
    .eq("student_id", student?.id ?? "")
    .order("lessons(date)", { ascending: false })
    .limit(5);

  // 未読メッセージ
  const { data: unreadMessages } = await supabase
    .from("messages")
    .select("id, title, body, created_at")
    .eq("studio_id", student?.id ? undefined : "")
    .not("id", "in",
      `(select message_id from message_reads where guardian_id = '${guardian?.id ?? ""}')`
    )
    .order("created_at", { ascending: false })
    .limit(3);

  const dayLabels = ["日", "月", "火", "水", "木", "金", "土"];

  return (
    <div className="space-y-5">
      {/* Student card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xl">
            {student?.name?.[0] ?? "?"}
          </div>
          <div>
            <p className="font-bold text-slate-800 text-lg">{student?.name ?? "—"}</p>
            <p className="text-xs text-slate-400">{student?.status === "active" ? "在籍中" : "休会中"}</p>
          </div>
        </div>
        <div className="space-y-2">
          {student?.class_enrollments?.map((e, i) => {
            const cls = e.classes;
            return (
              <div key={i} className="bg-indigo-50 rounded-xl px-4 py-3">
                <p className="text-sm font-semibold text-indigo-800">{cls.name}</p>
                <p className="text-xs text-indigo-500 mt-0.5">
                  {dayLabels[cls.day_of_week]}曜日　{cls.start_time.slice(0, 5)}〜{cls.end_time.slice(0, 5)}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3">
        <Link href="/portal/attendance" className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col gap-2 hover:border-indigo-300 transition-colors">
          <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
            <XCircle size={20} className="text-amber-600" />
          </div>
          <p className="font-semibold text-slate-800 text-sm">欠席連絡</p>
          <p className="text-xs text-slate-400">授業を欠席する場合</p>
        </Link>
        <Link href="/portal/billing" className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col gap-2 hover:border-indigo-300 transition-colors">
          <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
            <CreditCard size={20} className="text-emerald-600" />
          </div>
          <p className="font-semibold text-slate-800 text-sm">支払い確認</p>
          <p className="text-xs text-slate-400">月謝・領収書</p>
        </Link>
      </div>

      {/* Unread messages */}
      {unreadMessages && unreadMessages.length > 0 && (
        <div className="space-y-2">
          {unreadMessages.map(msg => (
            <Link
              key={msg.id}
              href="/portal/messages"
              className="bg-indigo-600 rounded-2xl p-4 flex items-center gap-3"
            >
              <div className="w-9 h-9 bg-indigo-500 rounded-xl flex items-center justify-center shrink-0">
                <Bell size={18} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold text-sm">{msg.title}</p>
                <p className="text-indigo-200 text-xs mt-0.5 truncate">{msg.body?.slice(0, 60)}…</p>
              </div>
              <ChevronRight size={16} className="text-indigo-300 shrink-0" />
            </Link>
          ))}
        </div>
      )}

      {/* Recent attendance */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800">最近の出席記録</h2>
        </div>
        {!attendanceHistory || attendanceHistory.length === 0 ? (
          <div className="px-5 py-6 text-center text-xs text-slate-400">出席記録はまだありません</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {attendanceHistory.map((a, i) => {
              const lesson = a.lessons as unknown as { date: string; classes: { name: string } } | null;
              const cfg = statusConfig[a.status as keyof typeof statusConfig];
              if (!cfg || !lesson) return null;
              const dateStr = new Date(lesson.date).toLocaleDateString("ja-JP", { month: "numeric", day: "numeric", weekday: "short" });
              return (
                <div key={i} className="flex items-center px-5 py-3.5 gap-3">
                  <p className="text-sm text-slate-500 w-24 shrink-0">{dateStr}</p>
                  <p className="flex-1 text-sm text-slate-700">{lesson.classes?.name}</p>
                  <span className={`flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${cfg.class}`}>
                    <cfg.icon size={12} />
                    {cfg.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
