import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { sendEmail } from "@/lib/email/sender";
import { messageNotificationEmail } from "@/lib/email/templates";

function createServiceClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  );
}

export async function POST(req: NextRequest) {
  try {
    const { messageId } = await req.json();
    const supabase = createServiceClient();

    // メッセージと教室情報を取得
    const { data: message } = await supabase
      .from("messages")
      .select("*, studios(name), studio_users(name)")
      .eq("id", messageId)
      .single();

    if (!message) return NextResponse.json({ error: "Message not found" }, { status: 404 });

    const studioName = (message.studios as { name: string })?.name ?? "教室";

    // 送信対象の保護者を取得
    const guardiansQuery = supabase
      .from("guardians")
      .select("email, name, student_id, students!inner(studio_id)")
      .eq("students.studio_id", message.studio_id)
      .not("auth_id", "is", null);

    const { data: guardians } = await guardiansQuery;
    if (!guardians || guardians.length === 0) {
      return NextResponse.json({ ok: true, sent: 0 });
    }

    const preview = message.body.slice(0, 100) + (message.body.length > 100 ? "…" : "");
    const portalUrl = `${process.env.NEXT_PUBLIC_APP_URL}/portal/messages`;

    // 各保護者にメール送信（並列・失敗を無視）
    await Promise.allSettled(
      guardians.map(g =>
        sendEmail({
          to: g.email,
          ...messageNotificationEmail({
            guardianName: g.name,
            studioName,
            messageTitle: message.title,
            messagePreview: preview,
            portalUrl,
          }),
        })
      )
    );

    return NextResponse.json({ ok: true, sent: guardians.length });
  } catch (err) {
    console.error("message notify error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
