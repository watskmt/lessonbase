import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/email/sender";
import { guardianInviteEmail } from "@/lib/email/templates";
import { createServerClient } from "@supabase/ssr";

function createServiceClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  );
}

export async function POST(req: NextRequest) {
  try {
    const { guardianEmail, guardianName, studentName, inviteToken, studioName } = await req.json();

    const studio = studioName ?? "習い事教室";
    const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/portal/login?invite_token=${inviteToken}`;

    const { subject, html } = guardianInviteEmail({
      guardianName,
      studentName,
      studioName: studio,
      inviteUrl,
    });

    await sendEmail({ to: guardianEmail, subject, html });

    // 招待送信日時を記録
    const supabase = createServiceClient();
    await supabase
      .from("guardians")
      .update({ invite_token: inviteToken })
      .eq("email", guardianEmail)
      .is("invite_accepted_at", null);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("invite error:", err);
    return NextResponse.json({ error: "Failed to send invite" }, { status: 500 });
  }
}
