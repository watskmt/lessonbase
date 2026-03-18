import { createClient } from "@/lib/supabase/server";
import { MessagesClient } from "@/components/portal/MessagesClient";

export default async function PortalMessagesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: guardian } = await supabase
    .from("guardians")
    .select("id, student_id, students!inner(studio_id)")
    .eq("auth_id", user!.id)
    .single();

  const studioId = (guardian?.students as unknown as { studio_id: string } | null)?.studio_id;

  // メッセージ一覧
  const { data: messages } = await supabase
    .from("messages")
    .select("id, title, body, created_at")
    .eq("studio_id", studioId ?? "")
    .order("created_at", { ascending: false });

  // 既読IDリスト
  const { data: reads } = await supabase
    .from("message_reads")
    .select("message_id")
    .eq("guardian_id", guardian?.id ?? "");

  const readSet = new Set((reads ?? []).map(r => r.message_id));

  const enriched = (messages ?? []).map(m => ({
    ...m,
    isRead: readSet.has(m.id),
  }));

  return <MessagesClient messages={enriched} />;
}
