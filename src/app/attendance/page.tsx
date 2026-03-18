"use client";

import { ChevronLeft, ChevronRight, Check, X, ArrowLeftRight, Minus } from "lucide-react";

const students = [
  { id: 1, name: "田中 さくら" },
  { id: 2, name: "鈴木 翔太" },
  { id: 3, name: "伊藤 蓮" },
  { id: 4, name: "山本 大翔" },
  { id: 5, name: "松本 結衣" },
  { id: 6, name: "小林 颯" },
];

// 出席(present), 欠席(absent), 振替(reschedule), 未入力(-)
const attendance: Record<number, "present" | "absent" | "reschedule" | "none"> = {
  1: "present",
  2: "absent",
  3: "present",
  4: "reschedule",
  5: "present",
  6: "none",
};

const statusConfig = {
  present: { label: "出席", icon: Check, class: "bg-emerald-100 text-emerald-600 border-emerald-200" },
  absent: { label: "欠席", icon: X, class: "bg-red-50 text-red-500 border-red-200" },
  reschedule: { label: "振替", icon: ArrowLeftRight, class: "bg-amber-50 text-amber-600 border-amber-200" },
  none: { label: "未入力", icon: Minus, class: "bg-slate-50 text-slate-400 border-slate-200" },
};

const classes = [
  { id: 1, time: "15:00", name: "初級ピアノ A", studentCount: 6 },
  { id: 2, time: "16:00", name: "初級ピアノ B", studentCount: 8 },
  { id: 3, time: "17:00", name: "中級ピアノ", studentCount: 5 },
  { id: 4, time: "18:30", name: "上級ピアノ", studentCount: 4 },
];

export default function AttendancePage() {
  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">出欠管理</h1>
          <p className="text-slate-400 text-sm mt-1">日次の出欠を記録します</p>
        </div>
      </div>

      {/* Date navigation */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg overflow-hidden">
          <button className="p-2.5 hover:bg-slate-50 text-slate-500 transition-colors">
            <ChevronLeft size={18} />
          </button>
          <span className="px-4 py-2.5 text-sm font-semibold text-slate-800 border-x border-slate-200">
            2026年3月17日（火）
          </span>
          <button className="p-2.5 hover:bg-slate-50 text-slate-500 transition-colors">
            <ChevronRight size={18} />
          </button>
        </div>
        <button className="px-4 py-2.5 text-sm text-indigo-600 font-medium bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors">
          今日
        </button>
      </div>

      {/* Class tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {classes.map((c, i) => (
          <button
            key={c.id}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors border ${
              i === 0
                ? "bg-indigo-600 text-white border-indigo-600"
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
            }`}
          >
            <span className="font-mono">{c.time}</span>
            <span>{c.name}</span>
          </button>
        ))}
      </div>

      {/* Attendance table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="font-semibold text-slate-800">初級ピアノ A</h2>
            <p className="text-xs text-slate-400 mt-0.5">15:00 〜 15:45 ／ 6名</p>
          </div>
          <div className="flex gap-4 text-sm">
            <span className="flex items-center gap-1.5 text-emerald-600">
              <Check size={14} /> <span className="font-semibold">4</span> 出席
            </span>
            <span className="flex items-center gap-1.5 text-red-500">
              <X size={14} /> <span className="font-semibold">1</span> 欠席
            </span>
            <span className="flex items-center gap-1.5 text-amber-600">
              <ArrowLeftRight size={14} /> <span className="font-semibold">1</span> 振替
            </span>
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {students.map((s) => {
            const status = attendance[s.id];
            return (
              <div key={s.id} className="flex items-center px-6 py-4 gap-4">
                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm shrink-0">
                  {s.name[0]}
                </div>
                <p className="flex-1 text-sm font-medium text-slate-800">{s.name}</p>
                <div className="flex gap-2">
                  {(["present", "absent", "reschedule"] as const).map((key) => {
                    const cfg = statusConfig[key];
                    const active = status === key;
                    return (
                      <button
                        key={key}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                          active ? cfg.class : "bg-white text-slate-400 border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <cfg.icon size={12} />
                        {cfg.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
            保存する
          </button>
        </div>
      </div>
    </div>
  );
}
