#!/usr/bin/env bash
# ============================================================
# Lessonbase ローカル開発環境 起動スクリプト
# 使い方: ./dev.sh
# ============================================================

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

log()  { echo -e "${CYAN}[lessonbase]${NC} $*"; }
ok()   { echo -e "${GREEN}[✓]${NC} $*"; }
warn() { echo -e "${YELLOW}[!]${NC} $*"; }
err()  { echo -e "${RED}[✗]${NC} $*"; }

# ============================================================
# 1. .env.local の存在確認・ガイド
# ============================================================
if [ ! -f ".env.local" ]; then
  warn ".env.local が見つかりません。テンプレートからコピーします..."
  cp .env.local.example .env.local
  echo ""
  echo -e "${BOLD}━━━ 初回セットアップが必要です ━━━${NC}"
  echo ""
  echo "  .env.local を編集して以下の値を設定してください:"
  echo ""
  echo -e "  ${CYAN}NEXT_PUBLIC_SUPABASE_URL${NC}       → Supabase プロジェクト URL"
  echo -e "  ${CYAN}NEXT_PUBLIC_SUPABASE_ANON_KEY${NC}  → Supabase anon key"
  echo -e "  ${CYAN}SUPABASE_SERVICE_ROLE_KEY${NC}      → Supabase service role key"
  echo -e "  ${CYAN}PAYJP_WEBHOOK_SECRET${NC}           → PAY.JP Webhook シークレット"
  echo -e "  ${CYAN}RESEND_API_KEY${NC}                 → Resend API キー (re_...)"
  echo -e "  ${CYAN}CRON_SECRET${NC}                    → 任意の文字列 (例: dev-secret-123)"
  echo ""
  echo -e "  ※ PAY.JP の API キーは教室設定画面 ${GREEN}/settings/payjp${NC} から登録します"
  echo ""
  echo "  設定後、もう一度 ./dev.sh を実行してください。"
  echo ""
  exit 0
fi

ok ".env.local を確認しました"

# ============================================================
# 2. 必須環境変数チェック
# ============================================================
check_env() {
  local key="$1"
  local val
  val=$(grep -E "^${key}=" .env.local 2>/dev/null | cut -d= -f2- | tr -d '"' | tr -d "'")
  if [ -z "$val" ] || [[ "$val" == *"your-"* ]] || [[ "$val" == *"..."* ]]; then
    return 1
  fi
  return 0
}

MISSING=()
for key in \
  NEXT_PUBLIC_SUPABASE_URL \
  NEXT_PUBLIC_SUPABASE_ANON_KEY \
  SUPABASE_SERVICE_ROLE_KEY; do
  check_env "$key" || MISSING+=("$key")
done

if [ ${#MISSING[@]} -gt 0 ]; then
  err "以下の環境変数が未設定です:"
  for k in "${MISSING[@]}"; do
    echo "  - $k"
  done
  echo ""
  echo "  .env.local を編集して値を設定してください。"
  exit 1
fi

ok "必須環境変数を確認しました"

# ============================================================
# 3. node_modules チェック
# ============================================================
if [ ! -d "node_modules" ]; then
  log "依存関係をインストールしています..."
  npm install
fi

ok "node_modules を確認しました"

# ============================================================
# 4. ポート確認
# ============================================================
if lsof -ti:13000 &>/dev/null; then
  warn "ポート 13000 がすでに使われています。"
  read -r -p "  プロセスを終了しますか？ [y/N] " ans
  if [[ "$ans" =~ ^[Yy]$ ]]; then
    lsof -ti:13000 | xargs kill -9
    ok "ポート 13000 を解放しました"
  else
    err "ポート 13000 を解放できませんでした。別のポートをお使いください。"
    exit 1
  fi
fi

# ============================================================
# 5. 起動
# ============================================================
echo ""
echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "  🎓 ${BOLD}Lessonbase 開発環境を起動します${NC}"
echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "  App:    ${GREEN}http://localhost:3000${NC}"
echo -e "  Portal: ${GREEN}http://localhost:3000/portal${NC}"
echo -e "  決済設定: ${GREEN}http://localhost:3000/settings/payjp${NC}"
echo ""

# 終了時にすべての子プロセスを止める
cleanup() {
  echo ""
  log "プロセスを終了しています..."
  kill $(jobs -p) 2>/dev/null || true
  wait 2>/dev/null
  log "終了しました。"
}
trap cleanup SIGINT SIGTERM EXIT

# Next.js 起動
log "Next.js を起動しています..."
npm run dev &
NEXT_PID=$!

# ============================================================
# 6. 起動完了メッセージ
# ============================================================
sleep 3
echo ""
echo -e "${BOLD}━━━ 起動完了 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "  🏠 教室管理画面    ${GREEN}http://localhost:3000${NC}"
echo -e "  👨‍👩‍👧 保護者ポータル  ${GREEN}http://localhost:3000/portal${NC}"
echo -e "  🔑 新規登録        ${GREEN}http://localhost:3000/signup${NC}"
echo -e "  💳 PAY.JP設定      ${GREEN}http://localhost:3000/settings/payjp${NC}"
echo ""
echo -e "  ${YELLOW}Ctrl+C${NC} で終了"
echo ""

# ============================================================
# 7. PAY.JP Webhook ローカルテスト案内
# ============================================================
echo -e "${BOLD}━━━ PAY.JP Webhook のローカルテスト ━━━━━━━━━${NC}"
echo ""
echo "  PAY.JP は公式 CLI がないため、ngrok を使って外部公開する方法が一般的です:"
echo ""
echo -e "  ${CYAN}ngrok http 3000${NC}"
echo ""
echo "  取得した URL を PAY.JP ダッシュボード → Webhook に登録:"
echo -e "  ${CYAN}https://xxxxxx.ngrok.io/api/payjp/webhook${NC}"
echo ""

# 待機
wait $NEXT_PID
