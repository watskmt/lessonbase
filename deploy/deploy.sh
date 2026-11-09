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

echo "=== 依存パッケージインストール・ビルド ==="
npm ci
npm run build
npm prune --omit=dev

echo "=== PM2 で起動/再起動 ==="
pm2 delete lessonbase 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 save
# 初回デプロイ時のみ pm2 startup を実行してください

echo "=== デプロイ完了 ==="
pm2 status
