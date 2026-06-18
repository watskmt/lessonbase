import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 上位ディレクトリの余計な lockfile（例: ~/package-lock.json）でワークスペース
  // ルートを誤認しないよう、このプロジェクトを明示的にルートに固定する
  turbopack: {
    root: __dirname,
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: "upgrade-insecure-requests",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
