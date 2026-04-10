# バックエンド モジュール解説

## 目次

1. [全体構成](#全体構成)
2. [認証・ミドルウェア](#認証ミドルウェア)
3. [API Routes](#api-routes)
   - [POST /api/setup-studio](#post-apisetup-studio)
   - [POST /api/guardians/invite](#post-apiguardiansinvite)
   - [POST /api/billing/generate](#post-apibillinggenerate)
   - [POST /api/billing/remind](#post-apibillingremind)
   - [POST /api/payjp/register-card](#post-apipayjpregister-card)
   - [POST /api/payjp/create-charge](#post-apipayjpcreate-charge)
   - [POST /api/payjp/create-subscription](#post-apipayjpcreate-subscription)
   - [POST /api/payjp/webhook](#post-apipayjpwebhook)
   - [POST /api/messages/notify](#post-apimessagesnotify)
4. [Server Actions](#server-actions)
   - [students.ts](#studentsts)
   - [classes.ts](#classests)
   - [attendance.ts](#attendancets)
   - [reschedule.ts](#reschedulets)
   - [messages.ts](#messagests)
5. [ライブラリ](#ライブラリ)
   - [lib/payjp.ts](#libpayjpts)
   - [lib/email/sender.ts](#libemailsenderts)
   - [lib/email/templates.ts](#libemailtemplatests)
   - [lib/utils.ts](#libutilsts)
6. [Supabase クライアント](#supabase-クライアント)

---

## 全体構成

```
リクエスト
    │
    ├─ ページ遷移 ──→ middleware.ts（認証チェック）
    │
    ├─ フォーム送信 ──→ Server Actions（actions/*.ts）
    │                        │
    │                        └─ Supabase DB 操作
    │                           + revalidatePath() でキャッシュ更新
    │
    └─ API 呼び出し ──→ API Routes（app/api/**/route.ts）
                             │
                             ├─ 外部サービス（PAY.JP / Resend）
                             └─ Supabase DB 操作
```

### Supabase クライアントの使い分け

| クライアント | キー | 用途 |
|---|---|---|
| `createClient()` (SSR) | anon key + cookie | ユーザー認証が必要な操作（RLS が効く） |
| `createServiceClient()` | service_role key | RLS をバイパスしたサーバー専用操作（Cron・Webhook など） |

---

## 認証・ミドルウェア

### `src/middleware.ts`

Next.js のすべてのリクエストに対して認証チェックを実行します（静的ファイルと `/api/payjp/webhook` は除外）。

#### 処理フロー

```
リクエスト
    │
    ├─ /portal/* へのアクセス
    │    ├─ 未ログイン → /portal/login にリダイレクト
    │    └─ guardians テーブルに該当なし → /portal/login にリダイレクト
    │
    ├─ スタジオ管理画面（/ /students /classes /attendance /billing /messages /settings）
    │    ├─ 未ログイン → /login にリダイレクト
    │    └─ studio_users テーブルに該当なし → /login にリダイレクト
    │
    ├─ ログイン済みで /login または /signup にアクセス
    │    └─ studio_users が存在 → / にリダイレクト（ダッシュボードへ）
    │
    └─ ログイン済みで /portal/login にアクセス
         └─ guardians が存在 → /portal にリダイレクト
```

#### 注意点

- セッション確認には **anon key** を使用
- DB 参照（`studio_users` / `guardians` の存在確認）には **service_role key** を使用（RLS バイパス）
- Webhook エンドポイント (`/api/payjp/webhook`) はミドルウェアの対象外（`matcher` で除外）

---

## API Routes

### POST `/api/setup-studio`

**目的**: サインアップ後にスタジオと管理ユーザーを初期化する。

**リクエスト Body**:
```json
{
  "authId": "uuid",
  "name": "田中 太郎",
  "email": "owner@example.com",
  "studioName": "田中音楽教室",
  "studioType": "music"
}
```

**処理フロー**:
1. `studios` テーブルに新規スタジオを作成（`billing_day: 1` で初期化）
2. `studio_users` テーブルにオーナーレコードを作成（`role: "owner"`）
3. ステップ 2 でエラーが発生した場合、ステップ 1 で作成したスタジオを削除してロールバック

**レスポンス**: `{ studioId: string }`

---

### POST `/api/guardians/invite`

**目的**: 保護者にポータル招待メールを送信する。

**リクエスト Body**:
```json
{
  "guardianEmail": "parent@example.com",
  "guardianName": "山田 花子",
  "studentName": "山田 太郎",
  "inviteToken": "abc123...",
  "studioName": "田中音楽教室"
}
```

**処理フロー**:
1. 招待 URL を生成: `${APP_URL}/portal/login?invite_token=<token>`
2. `guardianInviteEmail()` でHTMLメールを生成
3. Resend 経由でメール送信
4. `guardians` テーブルの `invite_token` を更新（未受諾のレコードのみ）

**認証**: 不要（Server Actions から内部的に呼び出す）

---

### POST `/api/billing/generate`

**目的**: 指定月の月謝請求を一括生成し、カード登録済みの保護者には即時課金する。

**認証**: `Authorization: Bearer <CRON_SECRET>` ヘッダー必須

**リクエスト Body**:
```json
{
  "studioId": "uuid",
  "year": 2026,
  "month": 4
}
```

**処理フロー**:

```
1. CRON_SECRET で認証
2. studios からスタジオと PAY.JP キーを取得
3. billing_periods を upsert（同月が既存なら取得）
4. 在籍中（status = "active"）の生徒の class_enrollments を取得
5. 各登録に対してループ:
   │
   ├─ 保護者がいない → スキップ
   ├─ 同期間の invoices が既存 → スキップ（二重生成防止）
   │
   ├─ PAY.JP Customer を getOrCreateCustomer() で取得または作成
   ├─ Customer ID を guardians テーブルに保存（新規作成時のみ）
   │
   ├─ カード登録済み（payjp_customer_id あり）の場合:
   │    └─ createOneTimeCharge() で即時課金
   │         ├─ 成功 → status = "paid" または "pending"
   │         └─ 失敗 → status = "failed"
   │
   └─ カード未登録の場合: status = "pending" で保存
6. invoices テーブルに挿入
```

**金額の決定**: `enrollment.custom_fee` が設定されていればその値、なければ `class.monthly_fee`

**レスポンス**: `{ ok: true, created: number, skipped: number, errors: string[] }`

---

### POST `/api/billing/remind`

**目的**: 未払い請求のある保護者に支払いリマインドメールを送信する。

**認証**: `Authorization: Bearer <CRON_SECRET>` でCron実行、または認証済みユーザーによる手動実行

**リクエスト Body**（いずれか）:
```json
{ "invoiceId": "uuid" }        // 特定請求への催促
{ "studioId": "uuid" }         // スタジオ全未払いへの一括催促
```

**処理フロー**:
1. `status = "pending"` かつ `due_date` が設定された `invoices` を取得
2. 各請求に対して `paymentReminderEmail()` でメールを生成・送信
3. 送信成功後、`invoices.reminder_sent_at` を更新

**レスポンス**: `{ ok: true, sent: number }`

---

### POST `/api/payjp/register-card`

**目的**: 保護者がクレジットカードを登録する（保護者ポータルから呼び出し）。

**認証**: Supabase セッション（保護者ログイン必須）

**リクエスト Body**:
```json
{ "tokenId": "tok_xxxx" }
```

**処理フロー**:
1. ログイン中の保護者情報と所属スタジオの PAY.JP キーを取得
2. PAY.JP Customer が既存の場合 → `customers.createCard()` でカードを追加
3. PAY.JP Customer が未作成の場合 → `customers.create()` で新規作成し `payjp_customer_id` を DB に保存

**レスポンス**: `{ ok: true, customerId: string }`

---

### POST `/api/payjp/create-charge`

**目的**: スタジオ管理者が臨時請求（発表会費・教材費など）を即時課金する。

**認証**: Supabase セッション（スタジオユーザー必須）

**リクエスト Body**:
```json
{
  "studentId": "uuid",
  "amount": 3000,
  "description": "発表会参加費",
  "dueDateStr": "2026-05-31"
}
```

**処理フロー**:
1. 生徒情報・スタジオ情報を並列取得
2. `getOrCreateCustomer()` で PAY.JP Customer を確保
3. `createOneTimeCharge()` で即時課金
4. `invoices` テーブルに `type: "extra"` で記録

**レスポンス**: `{ chargeId: string, paid: boolean }`

---

### POST `/api/payjp/create-subscription`

**目的**: 月謝サブスクリプションを開始する。

**認証**: Supabase セッション（スタジオユーザー必須）

**リクエスト Body**:
```json
{
  "studentId": "uuid",
  "classId": "uuid"
}
```

**処理フロー**:
1. 生徒・クラス・スタジオ情報を並列取得
2. `getOrCreateCustomer()` で PAY.JP Customer を確保
3. `createMonthlySubscription()` でプランを作成し、サブスクリプションを開始
4. サブスクリプション ID とステータスを返す（`invoices` への記録は Webhook で行う）

**レスポンス**: `{ subscriptionId: string, status: string }`

---

### POST `/api/payjp/webhook`

**目的**: PAY.JP からのイベント通知を受信し、DB のステータスを更新する。

**認証**: `X-Payjp-Signature` ヘッダーによる HMAC-SHA256 署名検証（`PAYJP_WEBHOOK_SECRET`）

> ミドルウェアの認証チェック対象外。`matcher` で除外されている。

**処理するイベント**:

| イベント | 処理内容 |
|---|---|
| `charge.succeeded` | `invoices.status = "paid"`, `paid_at` を記録 |
| `charge.failed` | `invoices.status = "failed"`, `failed_at` を記録 |
| `subscription.created` | `invoices` に `type: "monthly"`, `status: "pending"` で新規挿入（重複確認あり） |
| `subscription.canceled` / `subscription.deleted` | 現状は未処理（拡張ポイント） |

**署名検証ロジック**:
```
HMAC-SHA256(rawBody, PAYJP_WEBHOOK_SECRET) === X-Payjp-Signature ヘッダーの値
```
開発環境では `PAYJP_WEBHOOK_SECRET` が未設定の場合、検証をスキップ。

---

### POST `/api/messages/notify`

**目的**: メッセージ送信時に保護者全員へメール通知を送る（fire-and-forget）。

**認証**: 不要（Server Actions から内部的に呼び出す）

**リクエスト Body**:
```json
{ "messageId": "uuid" }
```

**処理フロー**:
1. メッセージと教室情報を取得
2. そのスタジオに所属し、ポータルアカウントを持つ保護者（`auth_id IS NOT NULL`）を取得
3. `Promise.allSettled()` で全保護者に並列メール送信（一部失敗しても継続）
4. 本文の先頭100文字をプレビューとして送信

**レスポンス**: `{ ok: true, sent: number }`

---

## Server Actions

`"use server"` ディレクティブを持つ関数。Next.js の App Router からフォーム送信やボタンクリックで直接呼び出される。すべての関数で Supabase 認証チェックを冒頭で実施し、処理後に `revalidatePath()` でページキャッシュを更新する。

---

### `students.ts`

#### `createStudent(formData)`

生徒登録の一連処理を4ステップで実行する。

```
1. students テーブルに生徒を挿入（status: "active"）
2. guardians テーブルに保護者を挿入（invite_token 付き）
3. class_enrollments テーブルに複数クラスを一括挿入
4. /api/guardians/invite を fetch して招待メールを送信
```

フォームフィールド: `name`, `kana`, `birth_date`, `notes`, `guardian_name`, `guardian_email`, `guardian_phone`, `relationship`, `class_ids[]`

#### `updateStudent(studentId, formData)`

生徒の基本情報（`name`, `kana`, `birth_date`, `notes`）を更新する。保護者情報・クラス登録は対象外。

#### `updateStudentStatus(studentId, status)`

在籍ステータスを変更する。`"active"` | `"suspended"` | `"withdrawn"` の3種類。

---

### `classes.ts`

#### `createClass(formData)`

ログインユーザーのスタジオ ID に紐づけてクラスを作成する。

フォームフィールド: `name`, `day_of_week`, `start_time`, `end_time`, `capacity`, `monthly_fee`, `color`

#### `updateClass(classId, formData)`

クラスの属性を更新する（`color` は更新対象外）。

#### `deleteClass(classId)`

クラスを削除する。関連する `class_enrollments` や `lessons` の扱いは DB の CASCADE 設定に依存する。

---

### `attendance.ts`

#### `upsertAttendance(lessonId, studentId, status)`

単一の出席記録を登録または更新する。`(lesson_id, student_id)` の複合ユニーク制約で upsert。

ステータス: `"present"` | `"absent"` | `"reschedule"` | `"none"`

#### `bulkUpsertAttendance(entries)`

複数の出席記録を一括 upsert する。1つのリクエストでレッスン全生徒分の記録を一括更新する用途。

#### `ensureLesson(classId, date)`

指定クラスの指定日のレッスン記録が存在しない場合に作成する。出席記録を操作する前に呼び出す。`(class_id, date)` の複合ユニーク制約で upsert。クラスの `start_time` / `end_time` を自動設定する。

---

### `reschedule.ts`

#### `createRescheduleRequest(attendanceId, studentId, targetLessonId, note?)`

保護者が振替申請を作成する。ログインユーザーが `guardians` テーブルに存在することを確認してから挿入。`status: "pending"` で作成。

#### `respondToReschedule(requestId, status)`

スタジオ側が振替申請を承認または却下する。`status` を `"approved"` または `"rejected"` に更新し、`responded_at` に現在時刻を記録。

---

### `messages.ts`

#### `sendMessage(formData)`

メッセージを作成し、保護者へのメール通知をバックグラウンドで送信する。

フォームフィールド: `title`, `body`, `target_type` (`"all"` | `"class"` | `"individual"`), `target_id`

**注意**: `/api/messages/notify` の呼び出しは `.catch(console.error)` で fire-and-forget。メール送信の失敗はメッセージ作成に影響しない。

#### `markMessageRead(messageId)`

保護者がメッセージを既読にする。`(message_id, guardian_id)` の複合ユニーク制約で upsert するため、重複挿入エラーは発生しない。

---

## ライブラリ

### `lib/payjp.ts`

PAY.JP API のラッパー。各スタジオが独自の PAY.JP シークレットキーを持つマルチテナント構成に対応。

#### `createPayjpClient(secretKey)`

スタジオごとのシークレットキーで PAY.JP クライアントを生成する。`@types` がないため手動で型定義（`PayjpClient` インターフェース）。

#### `getOrCreateCustomer(payjp, guardianId, email, name, payjpCustomerId)`

保護者の PAY.JP Customer を取得または作成する。

```
payjpCustomerId が存在する場合:
  └─ customers.retrieve() で存在確認
       ├─ 成功 → 既存 ID を返す
       └─ 失敗（削除済みなど） → 新規作成にフォールスルー

payjpCustomerId が null の場合:
  └─ customers.create() で新規作成 → ID を返す
```

返り値は Customer ID（string）のみ。DB への保存は呼び出し元の責務。

#### `createMonthlySubscription(payjp, { customerId, amount, description, metadata })`

月謝サブスクリプションを設定する。PAY.JP ではサブスクリプションに Plan オブジェクトが必要なため、毎回 Plan を作成してから `subscriptions.create()` を呼び出す。

#### `createOneTimeCharge(payjp, { customerId, amount, description, metadata })`

臨時請求の即時課金を実行する。`capture: true` で即時確定。通貨は `"jpy"` 固定。

#### `verifyWebhookSignature(rawBody, signature, secret)`

Webhook の署名を検証する。

```
HMAC-SHA256(rawBody, secret) を hex 文字列で生成
→ X-Payjp-Signature ヘッダーの値と文字列一致比較
```

---

### `lib/email/sender.ts`

Resend クライアントのシングルトンラッパー。

#### `sendEmail({ to, subject, html, from? })`

- `from` のデフォルト値: `"Resend <noreply@lessonbase.app>"`
- Resend クライアントはモジュール内でシングルトンとして保持（`_resend` 変数）
- 送信失敗時は `Error` をスロー

---

### `lib/email/templates.ts`

HTMLメールテンプレートを生成する純粋関数群。引数を受け取り `{ subject, html }` を返す。

#### `guardianInviteEmail({ guardianName, studentName, studioName, inviteUrl })`

保護者ポータルへの招待メール。招待リンクは7日間有効（メール本文に記載）。

#### `paymentReminderEmail({ guardianName, studentName, amount, month, dueDate, portalUrl })`

未払い月謝の催促メール。件名に対象月と金額を含む。

#### `messageNotificationEmail({ guardianName, studioName, messageTitle, messagePreview, portalUrl })`

教室からのお知らせ通知メール。本文の先頭100文字をプレビューとして表示。

---

### `lib/utils.ts`

副作用のない純粋なユーティリティ関数群。

| 関数 | 説明 |
|---|---|
| `generateInviteToken()` | Node.js `crypto.randomBytes(32)` で64文字の16進数トークンを生成 |
| `formatJpy(amount)` | `toLocaleString("ja-JP")` で `¥5,000` 形式にフォーマット |
| `formatDate(dateStr)` | `toLocaleDateString("ja-JP")` で `2026年4月1日` 形式にフォーマット |
| `getDayLabel(dayOfWeek)` | 0〜6 を `日月火水木金土` に変換。範囲外は `—` |
| `getAttendanceRate(present, total)` | 出席率をパーセント整数で返す。`total = 0` のとき `0`（ゼロ除算防止） |
| `getCurrentYearMonth()` | `{ year: number, month: number }` を返す（月は1〜12） |

---

## Supabase クライアント

### `lib/supabase/server.ts`（`createClient()`）

Next.js の Cookie を利用してセッションを管理するサーバーサイドクライアント。`@supabase/ssr` を使用。RLS が有効なため、ログインユーザーの権限内でのみ操作可能。Server Actions やセッション確認に使用。

### `lib/supabase/client.ts`（`createBrowserClient()`）

クライアントサイド（ブラウザ）用の Supabase クライアント。`NEXT_PUBLIC_` プレフィックスの環境変数のみ使用。

### API Routes 内の `createServiceClient()`

各 API Route ファイル内にローカル定義されているサービスロールクライアント。`SUPABASE_SECRET_KEY`（service_role key）を使用し RLS をバイパスする。Cron・Webhook・内部処理専用。Cookie は空（`getAll: () => []`）。
