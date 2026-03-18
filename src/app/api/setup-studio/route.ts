import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

function createServiceClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  );
}

export async function POST(req: NextRequest) {
  try {
    const { authId, name, email, studioName, studioType } = await req.json();

    if (!authId || !name || !email || !studioName || !studioType) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const supabase = createServiceClient();

    // 1. Studio を作成
    const { data: studio, error: studioError } = await supabase
      .from("studios")
      .insert({ name: studioName, type: studioType, email, billing_day: 1 })
      .select()
      .single();

    if (studioError || !studio) {
      return NextResponse.json({ error: studioError?.message }, { status: 500 });
    }

    // 2. StudioUser を作成（オーナー）
    const { error: userError } = await supabase
      .from("studio_users")
      .insert({
        studio_id: studio.id,
        auth_id: authId,
        name,
        email,
        role: "owner",
      });

    if (userError) {
      // ロールバック: studio を削除
      await supabase.from("studios").delete().eq("id", studio.id);
      return NextResponse.json({ error: userError.message }, { status: 500 });
    }

    return NextResponse.json({ studioId: studio.id });
  } catch (err) {
    console.error("setup-studio error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
