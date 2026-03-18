import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createPayjpClient, getOrCreateCustomer, createMonthlySubscription } from "@/lib/payjp";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { studentId, classId } = await req.json();
    if (!studentId || !classId) {
      return NextResponse.json({ error: "studentId and classId are required" }, { status: 400 });
    }

    const [studentRes, classRes, studioUserRes] = await Promise.all([
      supabase.from("students").select("*, guardians(*)").eq("id", studentId).single(),
      supabase.from("classes").select("*").eq("id", classId).single(),
      supabase.from("studio_users").select("*, studios(*)").eq("auth_id", user.id).single(),
    ]);

    if (studentRes.error || classRes.error || studioUserRes.error) {
      return NextResponse.json({ error: "Data fetch failed" }, { status: 500 });
    }

    const student = studentRes.data;
    const cls = classRes.data;
    const studio = studioUserRes.data.studios as {
      payjp_secret_key: string | null;
      billing_day: number;
    };
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

    const subscription = await createMonthlySubscription(payjp, {
      customerId,
      amount: cls.monthly_fee,
      description: `${cls.name} 月謝`,
      metadata: {
        student_id: studentId,
        class_id: classId,
        guardian_id: guardian.id,
      },
    });

    return NextResponse.json({
      subscriptionId: subscription.id,
      status: subscription.status,
    });
  } catch (err) {
    console.error("create-subscription error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}
