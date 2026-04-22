#!/bin/bash
# WebArena VPS (Rocky Linux) 初回セットアップスクリプト
# 実行: sudo bash setup.sh

set -e

APP_DIR="/var/www/lessonbase"
DOMAIN="lessonbase.amtech-service.com"

echo "=== Node.js 22 インストール ==="
curl -fsSL https://rpm.nodesource.com/setup_22.x | bash -
dnf install -y nodejs

echo "=== PM2 インストール ==="
npm install -g pm2

echo "=== Nginx インストール ==="
dnf install -y nginx
systemctl enable nginx
systemctl start nginx

echo "=== Certbot インストール ==="
dnf install -y epel-release
dnf install -y certbot python3-certbot-nginx

echo "=== ファイアウォール設定 ==="
firewall-cmd --permanent --add-service=http
firewall-cmd --permanent --add-service=https
firewall-cmd --reload

echo "=== アプリディレクトリ作成 ==="
mkdir -p "$APP_DIR"

echo "=== Nginx 設定配置 ==="
cp "$(dirname "$0")/nginx.conf" "/etc/nginx/conf.d/lessonbase.conf"
nginx -t && systemctl reload nginx

echo ""
echo "=== セットアップ完了 ==="
echo "次のステップ:"
echo "  1. DNS の A レコードが VPS IP を向いていることを確認"
echo "  2. deploy.sh を実行してアプリをデプロイ"
echo "  3. certbot --nginx -d $DOMAIN  でSSL取得"
