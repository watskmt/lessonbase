import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { verifyWebhookSignature } from "@/lib/payjp";

function createServiceClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  );
}

interface PayjpEvent {
  id: string;
  type: string;
  created: number;
  data: {
    object: {
      id: string;
      amount?: number;
      paid?: boolean;
      captured?: boolean;
      failure_code?: string | null;
      metadata?: Record<string, string>;
      customer?: string;
      plan?: { id: string; amount: number };
    };
  };
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("x-payjp-signature") ?? "";
  const secret = process.env.PAYJP_WEBHOOK_SECRET ?? "";

  // 本番では署名検証を必ず有効に（開発時はシークレット未設定でもスキップ）
  if (secret && !verifyWebhookSignature(body, signature, secret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let event: PayjpEvent;
  try {
    event = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const supabase = createServiceClient();
  const obj = event.data.object;

  switch (event.type) {
    // ============================================================
    // 課金成功
    // ============================================================
    case "charge.succeeded": {
      await supabase
        .from("invoices")
        .update({
          status: "paid",
          paid_at: new Date().toISOString(),
        })
        .eq("payjp_charge_id", obj.id);
      break;
    }

    // ============================================================
    // 課金失敗
    // ============================================================
    case "charge.failed": {
      await supabase
        .from("invoices")
        .update({
          status: "failed",
          failed_at: new Date().toISOString(),
        })
        .eq("payjp_charge_id", obj.id);
      break;
    }

    // ============================================================
    // サブスクリプション課金（月次）
    // subscription.payment_succeeded は PAY.JP では charge.succeeded で来る
    // ============================================================
    case "subscription.created": {
      const studentId = obj.metadata?.student_id;
      const guardianId = obj.metadata?.guardian_id;
      const studioId = obj.metadata?.studio_id;

      if (studentId && guardianId && studioId) {
        const { data: existing } = await supabase
          .from("invoices")
          .select("id")
          .eq("payjp_subscription_id", obj.id)
          .maybeSingle();

        if (!existing) {
          await supabase.from("invoices").insert({
            studio_id: studioId,
            student_id: studentId,
            guardian_id: guardianId,
            amount: obj.plan?.amount ?? 0,
            description: "月謝",
            type: "monthly",
            status: "pending",
            payjp_subscription_id: obj.id,
          });
        }
      }
      break;
    }

    // ============================================================
    // サブスクリプション解約
    // ============================================================
    case "subscription.canceled":
    case "subscription.deleted": {
      // 必要に応じて在籍ステータス更新等
      break;
    }

    default:
      // 未処理イベントは無視
      break;
  }

  return NextResponse.json({ received: true });
}
