#!/bin/bash
# デプロイスクリプト（VPS 上で実行）
# 実行: bash deploy.sh

set -e

APP_DIR="/var/www/lessonbase"
REPO_URL="https://github.com/watskmt/lessonbase.git"  # 必要に応じて変更

echo "=== コードを取得 ==="
if [ -d "$APP_DIR/.git" ]; then
    cd "$APP_DIR"
    git pull origin main
else
    git clone "$REPO_URL" "$APP_DIR"
    cd "$APP_DIR"
fi

echo "=== 依存パッケージインストール ==="
npm ci --omit=dev

echo "=== ビルド ==="
npm run build

echo "=== PM2 で起動/再起動 ==="
if pm2 describe lessonbase > /dev/null 2>&1; then
    pm2 reload ecosystem.config.js --update-env
else
    pm2 start ecosystem.config.js
    pm2 save
    pm2 startup | tail -1 | bash  # OS 起動時に自動起動
fi

echo "=== デプロイ完了 ==="
pm2 status
