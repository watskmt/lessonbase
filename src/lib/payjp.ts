import { createHmac } from "crypto";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const PayjpConstructor = require("payjp");

// PAY.JP クライアントを教室ごとのシークレットキーで生成
export function createPayjpClient(secretKey: string) {
  return PayjpConstructor(secretKey) as PayjpClient;
}

// ============================================================
// 型定義（payjp に @types がないため手動定義）
// ============================================================
export interface PayjpCustomer {
  id: string;
  object: "customer";
  email: string | null;
  description: string | null;
  metadata: Record<string, string>;
  created: number;
}

export interface PayjpPlan {
  id: string;
  object: "plan";
  amount: number;
  currency: string;
  interval: "month" | "year";
  name: string;
  metadata: Record<string, string>;
}

export interface PayjpSubscription {
  id: string;
  object: "subscription";
  customer: string;
  plan: PayjpPlan;
  status: "active" | "trial" | "canceled" | "paused";
  current_period_start: number;
  current_period_end: number;
  metadata: Record<string, string>;
}

export interface PayjpCharge {
  id: string;
  object: "charge";
  amount: number;
  currency: string;
  paid: boolean;
  captured: boolean;
  refunded: boolean;
  customer: string | null;
  description: string | null;
  failure_code: string | null;
  failure_message: string | null;
  metadata: Record<string, string>;
  created: number;
}

export interface PayjpClient {
  customers: {
    create(params: { email?: string; description?: string; metadata?: Record<string, string> }): Promise<PayjpCustomer>;
    retrieve(id: string): Promise<PayjpCustomer>;
    update(id: string, params: Partial<PayjpCustomer>): Promise<PayjpCustomer>;
    delete(id: string): Promise<{ id: string; deleted: boolean }>;
  };
  plans: {
    create(params: {
      amount: number;
      currency?: string;
      interval: "month" | "year";
      name: string;
      metadata?: Record<string, string>;
    }): Promise<PayjpPlan>;
    retrieve(id: string): Promise<PayjpPlan>;
    delete(id: string): Promise<{ id: string; deleted: boolean }>;
  };
  subscriptions: {
    create(params: {
      customer: string;
      plan: string;
      metadata?: Record<string, string>;
    }): Promise<PayjpSubscription>;
    retrieve(id: string): Promise<PayjpSubscription>;
    cancel(id: string): Promise<PayjpSubscription>;
    pause(id: string): Promise<PayjpSubscription>;
    resume(id: string): Promise<PayjpSubscription>;
  };
  charges: {
    create(params: {
      amount: number;
      currency?: string;
      customer?: string;
      card?: string;
      description?: string;
      capture?: boolean;
      metadata?: Record<string, string>;
    }): Promise<PayjpCharge>;
    retrieve(id: string): Promise<PayjpCharge>;
    refund(id: string, params?: { amount?: number }): Promise<PayjpCharge>;
  };
  events: {
    retrieve(id: string): Promise<{ id: string; type: string; data: unknown }>;
  };
}

// ============================================================
// ヘルパー関数
// ============================================================

/**
 * PAY.JP Customer を取得 or 作成
 */
export async function getOrCreateCustomer(
  payjp: PayjpClient,
  guardianId: string,
  email: string,
  name: string,
  payjpCustomerId: string | null
): Promise<string> {
  if (payjpCustomerId) {
    // 存在確認（削除されていないか）
    try {
      await payjp.customers.retrieve(payjpCustomerId);
      return payjpCustomerId;
    } catch {
      // 存在しない場合は新規作成
    }
  }

  const customer = await payjp.customers.create({
    email,
    description: name,
    metadata: { guardian_id: guardianId },
  });

  return customer.id;
}

/**
 * 月謝プランを作成して購読を開始
 * PAY.JP はサブスクリプションに Plan が必要
 */
export async function createMonthlySubscription(
  payjp: PayjpClient,
  {
    customerId,
    amount,
    description,
    metadata,
  }: {
    customerId: string;
    amount: number;
    description: string;
    metadata: Record<string, string>;
  }
): Promise<PayjpSubscription> {
  // Plan を作成（クラスごとに1つ、同額なら再利用してもよい）
  const plan = await payjp.plans.create({
    amount,
    currency: "jpy",
    interval: "month",
    name: description,
    metadata,
  });

  return await payjp.subscriptions.create({
    customer: customerId,
    plan: plan.id,
    metadata,
  });
}

/**
 * 臨時請求（発表会費・教材費など）を即時課金
 */
export async function createOneTimeCharge(
  payjp: PayjpClient,
  {
    customerId,
    amount,
    description,
    metadata,
  }: {
    customerId: string;
    amount: number;
    description: string;
    metadata: Record<string, string>;
  }
): Promise<PayjpCharge> {
  return payjp.charges.create({
    amount,
    currency: "jpy",
    customer: customerId,
    description,
    capture: true,
    metadata,
  });
}

/**
 * Webhook 署名を検証
 * PAY.JP は HMAC-SHA256 (hex) を X-Payjp-Signature ヘッダーで送る
 */
export function verifyWebhookSignature(
  rawBody: string,
  signature: string,
  secret: string
): boolean {
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  return expected === signature;
}
