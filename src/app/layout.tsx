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
  return (
    <html lang="ja">
      <body className="bg-slate-50">
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
