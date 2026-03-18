"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  ClipboardCheck,
  CreditCard,
  Bell,
  Settings,
  GraduationCap,
} from "lucide-react";
import clsx from "clsx";

const nav = [
  { href: "/", label: "ダッシュボード", icon: LayoutDashboard },
  { href: "/students", label: "生徒管理", icon: Users },
  { href: "/classes", label: "クラス管理", icon: CalendarDays },
  { href: "/attendance", label: "出欠管理", icon: ClipboardCheck },
  { href: "/billing", label: "請求・決済", icon: CreditCard },
  { href: "/messages", label: "連絡", icon: Bell },
  { href: "/settings", label: "設定", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-60 min-h-screen bg-white border-r border-slate-200 flex flex-col">
      {/* Logo */}
      <div className="flex items-center gap-2 px-6 py-5 border-b border-slate-200">
        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
          <GraduationCap size={18} className="text-white" />
        </div>
        <span className="font-bold text-slate-800 text-lg">Lessonbase</span>
      </div>

      {/* Studio name */}
      <div className="px-6 py-3 border-b border-slate-100">
        <p className="text-xs text-slate-400">教室</p>
        <p className="text-sm font-medium text-slate-700 truncate">山田ピアノ教室</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                active
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-800"
              )}
            >
              <Icon size={18} className={active ? "text-indigo-600" : "text-slate-400"} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className="px-4 py-4 border-t border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm">
            山
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-700 truncate">山田 花子</p>
            <p className="text-xs text-slate-400 truncate">オーナー</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
