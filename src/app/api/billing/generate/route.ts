import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createPayjpClient, getOrCreateCustomer, createOneTimeCharge } from "@/lib/payjp";

function createServiceClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  );
}

export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { studioId, year, month } = await req.json();
  if (!studioId || !year || !month) {
    return NextResponse.json({ error: "Missing studioId, year, month" }, { status: 400 });
  }

  const supabase = createServiceClient();

  const { data: studio } = await supabase
    .from("studios")
    .select("*")
    .eq("id", studioId)
    .single();

  if (!studio || !studio.payjp_secret_key) {
    return NextResponse.json({ error: "Studio not found or PAY.JP not configured" }, { status: 400 });
  }

  const payjp = createPayjpClient(studio.payjp_secret_key);

  // billing_period を upsert
  const { data: period } = await supabase
    .from("billing_periods")
    .upsert({ studio_id: studioId, year, month }, { onConflict: "studio_id,year,month" })
    .select()
    .single();

  if (!period) return NextResponse.json({ error: "Failed to create billing period" }, { status: 500 });

  // 在籍中の生徒とクラス登録
  const { data: enrollments } = await supabase
    .from("class_enrollments")
    .select("*, students!inner(id, name, status, guardians(id, email, name, payjp_customer_id)), classes(id, name, monthly_fee)")
    .eq("students.status", "active")
    .eq("students.studio_id", studioId)
    .is("left_at", null);

  if (!enrollments || enrollments.length === 0) {
    return NextResponse.json({ ok: true, created: 0, skipped: 0 });
  }

  let created = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const enrollment of enrollments) {
    const student = enrollment.students as {
      id: string;
      name: string;
      guardians: { id: string; email: string; name: string; payjp_customer_id: string | null }[];
    };
    const cls = enrollment.classes as { id: string; name: string; monthly_fee: number };
    const guardian = student.guardians?.[0];

    if (!guardian) { skipped++; continue; }

    // 同期間の請求が既にあればスキップ
    const { data: existing } = await supabase
      .from("invoices")
      .select("id")
      .eq("billing_period_id", period.id)
      .eq("student_id", student.id)
      .maybeSingle();

    if (existing) { skipped++; continue; }

    const fee = enrollment.custom_fee ?? cls.monthly_fee;

    try {
      const customerId = await getOrCreateCustomer(
        payjp,
        guardian.id,
        guardian.email,
        guardian.name,
        guardian.payjp_customer_id
      );

      if (!guardian.payjp_customer_id) {
        await supabase.from("guardians").update({ payjp_customer_id: customerId }).eq("id", guardian.id);
      }

      // PAY.JP で即時課金（保護者のカード登録済みの場合）
      // カード未登録の場合はペンディングとして保存
      let chargeId: string | null = null;
      let status = "pending";

      if (guardian.payjp_customer_id) {
        try {
          const charge = await createOneTimeCharge(payjp, {
            customerId,
            amount: fee,
            description: `${cls.name} 月謝（${year}年${month}月）`,
            metadata: {
              student_id: student.id,
              guardian_id: guardian.id,
              studio_id: studioId,
              class_id: cls.id,
            },
          });
          chargeId = charge.id;
          status = charge.paid ? "paid" : "pending";
        } catch {
          status = "failed";
        }
      }

      await supabase.from("invoices").insert({
        billing_period_id: period.id,
        studio_id: studioId,
        student_id: student.id,
        guardian_id: guardian.id,
        amount: fee,
        description: `${cls.name} 月謝`,
        type: "monthly",
        status,
        payjp_charge_id: chargeId,
        due_date: new Date(year, month - 1, studio.billing_day).toISOString().split("T")[0],
        paid_at: status === "paid" ? new Date().toISOString() : null,
      });

      created++;
    } catch (err) {
      errors.push(`${student.name}: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  }

  return NextResponse.json({ ok: true, created, skipped, errors });
}
