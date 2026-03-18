import type { Metadata } from "next";
import "../globals.css";
import { GraduationCap } from "lucide-react";

export const metadata: Metadata = {
  title: "保護者ポータル | Lessonbase",
  description: "習い事教室の保護者向けポータル",
};

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top nav */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center">
              <GraduationCap size={15} className="text-white" />
            </div>
            <span className="font-bold text-slate-800 text-base">Lessonbase</span>
            <span className="text-slate-300 mx-1">|</span>
            <span className="text-sm text-slate-500">山田ピアノ教室</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm">
              田
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-2xl mx-auto px-4 py-6">
        {children}
      </main>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200">
        <div className="max-w-2xl mx-auto flex">
          {[
            { href: "/portal", label: "ホーム", icon: "🏠" },
            { href: "/portal/attendance", label: "出欠連絡", icon: "📋" },
            { href: "/portal/billing", label: "支払い", icon: "💳" },
            { href: "/portal/messages", label: "お知らせ", icon: "🔔" },
          ].map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="flex-1 flex flex-col items-center gap-1 py-3 text-slate-500 hover:text-indigo-600 transition-colors"
            >
              <span className="text-xl">{item.icon}</span>
              <span className="text-xs">{item.label}</span>
            </a>
          ))}
        </div>
      </nav>

      {/* Bottom nav spacer */}
      <div className="h-20" />
    </div>
  );
}
