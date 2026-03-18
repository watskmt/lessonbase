import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createPayjpClient, getOrCreateCustomer, createOneTimeCharge } from "@/lib/payjp";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { studentId, amount, description, dueDateStr } = await req.json();
    if (!studentId || !amount || !description) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const [studentRes, studioUserRes] = await Promise.all([
      supabase.from("students").select("*, guardians(*)").eq("id", studentId).single(),
      supabase.from("studio_users").select("*, studios(*)").eq("auth_id", user.id).single(),
    ]);

    if (studentRes.error || studioUserRes.error) {
      return NextResponse.json({ error: "Data fetch failed" }, { status: 500 });
    }

    const student = studentRes.data;
    const studio = studioUserRes.data.studios as { id: string; payjp_secret_key: string | null };
    const guardian = student.guardians?.[0];

    if (!guardian) return NextResponse.json({ error: "No guardian found" }, { status: 400 });
    if (!studio.payjp_secret_key) {
      return NextResponse.json({ error: "PAY.JP not configured" }, { status: 400 });
    }

    const payjp = createPayjpClient(studio.payjp_secret_key);

    const customerId = await getOrCreateCustomer(
      payjp,
      guardian.id,
      guardian.email,
      guardian.name,
      guardian.payjp_customer_id ?? null
    );

    if (!guardian.payjp_customer_id) {
      await supabase.from("guardians").update({ payjp_customer_id: customerId }).eq("id", guardian.id);
    }

    const charge = await createOneTimeCharge(payjp, {
      customerId,
      amount,
      description,
      metadata: {
        student_id: studentId,
        guardian_id: guardian.id,
        studio_id: studio.id,
      },
    });

    // invoices テーブルに保存
    await supabase.from("invoices").insert({
      studio_id: studio.id,
      student_id: studentId,
      guardian_id: guardian.id,
      amount,
      description,
      type: "extra",
      status: charge.paid ? "paid" : "pending",
      payjp_charge_id: charge.id,
      due_date: dueDateStr ?? null,
      paid_at: charge.paid ? new Date().toISOString() : null,
    });

    return NextResponse.json({ chargeId: charge.id, paid: charge.paid });
  } catch (err) {
    console.error("create-charge error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}
