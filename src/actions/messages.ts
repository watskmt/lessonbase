"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function sendMessage(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: studioUser } = await supabase
    .from("studio_users")
    .select("id, studio_id")
    .eq("auth_id", user.id)
    .single();
  if (!studioUser) throw new Error("Not a studio user");

  const title = formData.get("title") as string;
  const body = formData.get("body") as string;
  const targetType = formData.get("target_type") as string;
  const targetId = formData.get("target_id") as string | null;

  const { data: message, error } = await supabase
    .from("messages")
    .insert({
      studio_id: studioUser.studio_id,
      sender_id: studioUser.id,
      title,
      body,
      target_type: targetType ?? "all",
      target_id: targetId || null,
    })
    .select()
    .single();

  if (error || !message) throw new Error(error?.message);

  // 送信対象の保護者を取得してメール通知（型エラー回避のため条件分岐で別クエリ）

  // メール送信はバックグラウンドで
  fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/messages/notify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messageId: message.id }),
  }).catch(console.error);

  revalidatePath("/messages");
  return { messageId: message.id };
}

export async function markMessageRead(messageId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: guardian } = await supabase
    .from("guardians")
    .select("id")
    .eq("auth_id", user.id)
    .single();

  if (!guardian) throw new Error("Not a guardian");

  await supabase
    .from("message_reads")
    .upsert({ message_id: messageId, guardian_id: guardian.id }, { onConflict: "message_id,guardian_id" });

  revalidatePath("/portal/messages");
}
