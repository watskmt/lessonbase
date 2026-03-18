import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createPayjpClient } from "@/lib/payjp";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { tokenId } = await req.json();
    if (!tokenId) return NextResponse.json({ error: "tokenId is required" }, { status: 400 });

    // 保護者と教室のPAY.JPキーを取得
    const { data: guardian } = await supabase
      .from("guardians")
      .select("id, email, name, payjp_customer_id, student_id, students!inner(studio_id)")
      .eq("auth_id", user.id)
      .single();

    if (!guardian) return NextResponse.json({ error: "Guardian not found" }, { status: 404 });

    const studioId = (guardian.students as unknown as { studio_id: string })?.studio_id;

    const { data: studio } = await supabase
      .from("studios")
      .select("payjp_secret_key")
      .eq("id", studioId)
      .single();

    if (!studio?.payjp_secret_key) {
      return NextResponse.json({ error: "PAY.JP not configured" }, { status: 400 });
    }

    const payjp = createPayjpClient(studio.payjp_secret_key);

    // Customer が既存なら card を追加、なければ Customer ごと作成
    let customerId = guardian.payjp_customer_id;

    if (customerId) {
      // カードを追加
      await (payjp.customers as unknown as {
        createCard: (id: string, params: { card: string }) => Promise<unknown>;
      }).createCard(customerId, { card: tokenId });
    } else {
      // Customer を新規作成
      const customer = await payjp.customers.create({
        email: guardian.email,
        description: guardian.name,
        metadata: { guardian_id: guardian.id },
      });
      customerId = customer.id;

      await supabase
        .from("guardians")
        .update({ payjp_customer_id: customerId })
        .eq("id", guardian.id);
    }

    return NextResponse.json({ ok: true, customerId });
  } catch (err) {
    console.error("register-card error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}
