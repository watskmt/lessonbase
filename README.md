# Lessonbase

音楽・スポーツ・習い事教室向けのスタジオ管理 SaaS。生徒管理・出席記録・月謝請求・保護者連絡を一元化します。

---

## 概要

Lessonbase は、教室運営者（スタジオ）と保護者の双方が利用できる Web アプリケーションです。

- **スタジオ管理画面**: 生徒・クラス・出席・請求・メッセージを管理
- **保護者ポータル**: 出席確認・月謝支払い・教室からのお知らせ受信

---

## 採用技術

### フロントエンド

| 技術 | バージョン | 用途 |
|------|-----------|------|
| [Next.js](https://nextjs.org/) | 16.1.7 | App Router / Server Actions / API Routes |
| [React](https://react.dev/) | 19.2.3 | UI コンポーネント |
| [TypeScript](https://www.typescriptlang.org/) | 5.x | 型安全な開発 |
| [Tailwind CSS](https://tailwindcss.com/) | 4.x | ユーティリティファーストの CSS |
| [Radix UI](https://www.radix-ui.com/) | 最新 | アクセシブルな UI プリミティブ（Dialog / Select / Toast） |
| [Lucide React](https://lucide.dev/) | 最新 | アイコン |
| [clsx](https://github.com/lukeed/clsx) | 最新 | 条件付きクラス名生成 |

### バックエンド

| 技術 | 用途 |
|------|------|
| Next.js App Router (Server Actions) | フォーム処理・DB 操作のサーバーサイドロジック |
| Next.js API Routes | Webhook 受信・外部サービス連携 |
| Next.js Middleware | 認証・ルートガード |

### データベース / 認証

| 技術 | 用途 |
|------|------|
| [Supabase](https://supabase.com/) | PostgreSQL データベース・認証（Auth）・Row Level Security |
| `@supabase/ssr` | サーバーサイドでのセッション管理 |
| `@supabase/supabase-js` | クライアントサイドの Supabase 操作 |

### 決済

| 技術 | 用途 |
|------|------|
| [PAY.JP](https://pay.jp/) | クレジットカード決済・月謝サブスクリプション・臨時請求 |
| PAY.JP Webhook | 決済イベント（成功 / 失敗）のリアルタイム処理 |

### メール

| 技術 | 用途 |
|------|------|
| [Resend](https://resend.com/) | トランザクションメール送信（招待・支払い催促・お知らせ通知） |

### インフラ / デプロイ

| 技術 | 用途 |
|------|------|
| [CoreServer](https://www.coreserver.jp/) | 共有ホスティングサーバー |
| [PM2](https://pm2.keymetrics.io/) | Node.js プロセス管理・自動再起動 |
| Apache + mod_proxy | リバースプロキシ（80/443 → Node.js port 3000） |
| rsync | ビルド成果物のサーバー転送 |
| GitHub Actions | CI/CD（ビルド・デプロイの自動化） |
| Node.js | 24.x |

### テスト

| 技術 | 用途 |
|------|------|
| [Vitest](https://vitest.dev/) | ユニットテスト |

---

## アーキテクチャ

```
┌─────────────────────────────────┐
│         Next.js App Router       │
│                                  │
│  ┌──────────┐  ┌──────────────┐ │
│  │  Studio  │  │   Portal     │ │
│  │  管理画面 │  │  保護者ポータル│ │
│  └──────────┘  └──────────────┘ │
│                                  │
│  ┌──────────────────────────┐   │
│  │      Middleware           │   │
│  │  認証チェック / ルートガード │   │
│  └──────────────────────────┘   │
│                                  │
│  ┌──────────┐  ┌─────────────┐  │
│  │  Server  │  │  API Routes │  │
│  │  Actions │  │  /api/*     │  │
│  └──────────┘  └─────────────┘  │
└──────────┬──────────────────────┘
           │
    ┌──────┴──────────────────┐
    │                         │
┌───┴────┐   ┌────────┐  ┌───┴────┐
│Supabase│   │PAY.JP  │  │Resend  │
│DB / Auth│  │決済    │  │メール  │
└────────┘   └────────┘  └────────┘
```

---

## 主要機能

### スタジオ管理画面

#### 生徒管理
- 生徒の登録・編集・在籍ステータス管理（在籍 / 休会 / 退会）
- 保護者情報の管理（メール・電話・続柄）
- 保護者ポータルへの招待メール送信（7日間有効のトークン付き URL）

#### クラス管理
- クラスの作成・編集・削除
- 曜日・時間・定員・月謝・カラーの設定
- 生徒の複数クラスへの登録

#### 出席管理
- レッスンごとの出席記録（出席 / 欠席 / 振替 / 未記録）
- 一括出席記録
- 振替申請の承認・却下
- 出席率の自動計算

#### 請求管理
- 月謝の一括生成（PAY.JP サブスクリプション対応）
- 臨時請求（発表会費・教材費など）の即時課金
- 未払い請求への催促メール送信
- 請求ステータス管理（未払い / 支払済 / 失敗 / キャンセル）

#### メッセージ
- 全生徒・クラス別・個別へのお知らせ送信
- 送信時に保護者へメール通知
- 既読管理

#### 設定
- PAY.JP API キーの設定（スタジオごとの個別キー）

### 保護者ポータル

- 出席記録の確認
- 月謝のクレジットカード決済
- 振替申請
- 教室からのお知らせ確認

---

## データモデル

```
Studio（教室）
  └── StudioUser（スタッフ: owner / teacher）
  └── Class（クラス）
        └── ClassEnrollment（受講登録）
        └── Lesson（授業）
              └── Attendance（出席記録）
                    └── RescheduleRequest（振替申請）
  └── Student（生徒）
        └── Guardian（保護者）
              └── Invoice（請求書）
  └── Message（お知らせ）
        └── MessageRead（既読記録）
  └── BillingPeriod（請求期間）
```

---

## ディレクトリ構成

```
src/
├── app/
│   ├── (studio)/          # スタジオ管理画面
│   │   ├── login/
│   │   └── signup/
│   ├── api/               # API Routes
│   │   ├── billing/       # 請求生成・催促
│   │   ├── guardians/     # 保護者招待
│   │   ├── messages/      # メール通知
│   │   ├── payjp/         # PAY.JP 連携・Webhook
│   │   └── setup-studio/  # 初期設定
│   ├── portal/            # 保護者ポータル
│   ├── attendance/        # 出席管理
│   ├── billing/           # 請求管理
│   ├── classes/           # クラス管理
│   ├── messages/          # メッセージ
│   ├── settings/          # 設定
│   └── students/          # 生徒管理
├── actions/               # Server Actions
│   ├── attendance.ts
│   ├── classes.ts
│   ├── messages.ts
│   ├── reschedule.ts
│   └── students.ts
├── components/            # UI コンポーネント
├── lib/
│   ├── email/             # メールテンプレート・送信
│   ├── supabase/          # Supabase クライアント
│   ├── payjp.ts           # PAY.JP ヘルパー
│   └── utils.ts           # 汎用ユーティリティ
├── types/
│   └── index.ts           # 型定義
└── middleware.ts           # 認証ミドルウェア
```

---

## セットアップ

### 必要条件

- Node.js 24.x
- npm

### 環境変数

`.env.local` を作成して以下を設定してください。

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SECRET_KEY=
RESEND_API_KEY=
NEXT_PUBLIC_APP_URL=
PAYJP_WEBHOOK_SECRET=
CRON_SECRET=
```

### 開発サーバーの起動

```bash
npm install
npm run dev
```

[http://localhost:3000](http://localhost:3000) で動作します。

### ビルド

```bash
npm run build
npm run start
```

---

## テスト

```bash
# 一回実行
npm test

# ウォッチモード
npm run test:watch

# カバレッジ付き
npm run test:coverage
```

---

## CI/CD

`main` ブランチへの push をトリガーに GitHub Actions が以下を実行します。

1. Node.js 24 環境でビルド
2. rsync でビルド成果物を CoreServer へ転送
3. SSH でサーバー上の依存関係をインストール
4. PM2 でアプリケーションを再起動

---

## ライセンス

Private
