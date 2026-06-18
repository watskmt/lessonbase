import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

export const metadata: Metadata = {
  title: "Lessonbase - 習い事教室管理",
  description: "習い事教室の出欠・月謝・連絡を一元管理",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isDemo = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

  return (
    <html lang="ja">
      <body className="bg-slate-50">
        {isDemo && (
          <div className="fixed top-0 left-0 z-[100] bg-amber-500 text-white text-xs font-bold px-3 py-1 rounded-br-lg shadow select-none pointer-events-none">
            DEMO版
          </div>
        )}
        <div className="flex min-h-screen flex-col">
          <div className="flex flex-1">
            <Sidebar />
            <main className="flex-1 overflow-auto">{children}</main>
          </div>
          <footer className="text-center text-xs text-slate-400 py-2 select-none">
            © {new Date().getFullYear()} AM Tech (Wataru Sakamoto)
          </footer>
        </div>
      </body>
    </html>
  );
}
