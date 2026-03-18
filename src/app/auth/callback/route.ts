import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // 保護者か教室ユーザーかで振り分け
      const { data: guardian } = await supabase
        .from("guardians")
        .select("id, invite_token")
        .eq("auth_id", data.user.id)
        .maybeSingle();

      if (guardian) {
        // 招待トークンがあれば accepted にする
        if (guardian.invite_token) {
          await supabase
            .from("guardians")
            .update({ invite_accepted_at: new Date().toISOString(), invite_token: null })
            .eq("id", guardian.id);
        }
        return NextResponse.redirect(`${origin}/portal`);
      }

      // 招待トークン経由のログイン（初回）
      const inviteToken = searchParams.get("invite_token");
      if (inviteToken) {
        await supabase
          .from("guardians")
          .update({
            auth_id: data.user.id,
            invite_accepted_at: new Date().toISOString(),
            invite_token: null,
          })
          .eq("invite_token", inviteToken);
        return NextResponse.redirect(`${origin}/portal`);
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
