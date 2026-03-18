"use client";

import { useState } from "react";
import { X, CheckCircle2, XCircle, ArrowLeftRight, Download, Send, Minus } from "lucide-react";

interface StudentModalProps {
  student: {
    id: number;
    name: string;
    kana: string;
    age: number;
    classes: string[];
    status: string;
    payStatus: string;
    since: string;
  };
  onClose: () => void;
}

const attendanceHistory = [
  { date: "3/17（火）", class: "初級ピアノ A", status: "present" },
  { date: "3/10（火）", class: "初級ピアノ A", status: "present" },
  { date: "3/3（火）", class: "初級ピアノ A", status: "absent" },
  { date: "2/24（火）", class: "初級ピアノ A", status: "reschedule" },
  { date: "2/17（火）", class: "初級ピアノ A", status: "present" },
  { date: "2/10（火）", class: "初級ピアノ A", status: "present" },
  { date: "2/3（火）", class: "初級ピアノ A", status: "present" },
  { date: "1/27（火）", class: "初級ピアノ A", status: "absent" },
];

const paymentHistory = [
  { month: "2026年3月", amount: 8000, status: "pending", date: "—" },
  { month: "2026年2月", amount: 8000, status: "paid", date: "2/1" },
  { month: "2026年1月", amount: 8000, status: "paid", date: "1/1" },
  { month: "2025年12月", amount: 8000, status: "paid", date: "12/1" },
  { month: "2025年11月", amount: 8000, status: "paid", date: "11/1" },
];

const attendanceCfg = {
  present: { label: "出席", icon: CheckCircle2, class: "text-emerald-600 bg-emerald-50" },
  absent: { label: "欠席", icon: XCircle, class: "text-red-500 bg-red-50" },
  reschedule: { label: "振替", icon: ArrowLeftRight, class: "text-amber-600 bg-amber-50" },
  none: { label: "未入力", icon: Minus, class: "text-slate-400 bg-slate-50" },
};

const paymentCfg = {
  paid: { label: "支払済", class: "text-emerald-600 bg-emerald-50" },
  pending: { label: "未払い", class: "text-red-500 bg-red-50" },
  failed: { label: "失敗", class: "text-red-700 bg-red-100" },
};

type Tab = "profile" | "attendance" | "billing";

export default function StudentModal({ student, onClose }: StudentModalProps) {
  const [tab, setTab] = useState<Tab>("profile");

  const presentCount = attendanceHistory.filter(a => a.status === "present").length;
  const totalCount = attendanceHistory.length;
  const attendanceRate = Math.round((presentCount / totalCount) * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-xl mx-4 max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
              {student.name[0]}
            </div>
            <div>
              <p className="font-bold text-slate-800">{student.name}</p>
              <p className="text-xs text-slate-400">{student.kana}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-100 bg-slate-50 px-6 pt-2">
          {([
            { key: "profile", label: "プロフィール" },
            { key: "attendance", label: "出席記録" },
            { key: "billing", label: "支払い履歴" },
          ] as { key: Tab; label: string }[]).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
                tab === key
                  ? "border-indigo-600 text-indigo-700"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1">
          {/* Profile */}
          {tab === "profile" && (
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "年齢", value: `${student.age}歳` },
                  { label: "在籍ステータス", value: student.status },
                  { label: "入会日", value: student.since },
                  { label: "クラス数", value: `${student.classes.length}クラス` },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-slate-50 rounded-xl p-4">
                    <p className="text-xs text-slate-400 mb-1">{label}</p>
                    <p className="font-semibold text-slate-800">{value}</p>
                  </div>
                ))}
              </div>

              <div>
                <p className="text-xs text-slate-400 mb-2">受講クラス</p>
                <div className="flex flex-wrap gap-2">
                  {student.classes.map(c => (
                    <span key={c} className="text-sm bg-indigo-50 text-indigo-700 font-medium px-3 py-1.5 rounded-lg">
                      {c}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs text-slate-400 mb-2">保護者情報</p>
                <div className="bg-slate-50 rounded-xl p-4 flex items-center gap-3">
                  <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center text-slate-600 font-bold text-sm">
                    田
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-800">田中 裕子（母）</p>
                    <p className="text-xs text-slate-400">hanako@example.com</p>
                  </div>
                  <span className="ml-auto text-xs bg-emerald-50 text-emerald-600 px-2 py-1 rounded-full">
                    招待済み
                  </span>
                </div>
              </div>

              <div>
                <p className="text-xs text-slate-400 mb-2">備考</p>
                <textarea
                  defaultValue="アレルギーなし。集中力が高く上達が早い。"
                  rows={3}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button className="flex-1 border border-slate-200 text-slate-600 py-2.5 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors">
                  招待メール再送
                </button>
                <button className="flex-1 bg-indigo-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors">
                  変更を保存
                </button>
              </div>
            </div>
          )}

          {/* Attendance */}
          {tab === "attendance" && (
            <div className="p-6 space-y-5">
              {/* Stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-emerald-50 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-emerald-700">{attendanceRate}%</p>
                  <p className="text-xs text-emerald-600 mt-1">出席率</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-slate-700">{presentCount}</p>
                  <p className="text-xs text-slate-500 mt-1">出席</p>
                </div>
                <div className="bg-red-50 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-red-600">
                    {attendanceHistory.filter(a => a.status === "absent").length}
                  </p>
                  <p className="text-xs text-red-500 mt-1">欠席</p>
                </div>
              </div>

              {/* History */}
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                {attendanceHistory.map((a, i) => {
                  const cfg = attendanceCfg[a.status as keyof typeof attendanceCfg];
                  return (
                    <div key={i} className="flex items-center px-4 py-3.5 gap-3 bg-white">
                      <p className="text-sm text-slate-500 w-24 shrink-0">{a.date}</p>
                      <p className="flex-1 text-sm text-slate-700">{a.class}</p>
                      <span className={`flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${cfg.class}`}>
                        <cfg.icon size={11} />
                        {cfg.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Billing */}
          {tab === "billing" && (
            <div className="p-6 space-y-5">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-500">今月の月謝</p>
                <p className="text-2xl font-bold text-slate-800">¥8,000</p>
              </div>

              <button className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors">
                <Send size={14} />
                リマインドを送信
              </button>

              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                {paymentHistory.map((p, i) => {
                  const cfg = paymentCfg[p.status as keyof typeof paymentCfg];
                  return (
                    <div key={i} className="flex items-center px-4 py-3.5 gap-3 bg-white">
                      <div className="flex-1">
                        <p className="text-sm text-slate-700">{p.month}</p>
                        <p className="text-xs text-slate-400">{p.date !== "—" ? `${p.date}支払済` : "支払待ち"}</p>
                      </div>
                      <p className="text-sm font-semibold text-slate-800">¥{p.amount.toLocaleString()}</p>
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${cfg.class}`}>
                        {cfg.label}
                      </span>
                      {p.status === "paid" && (
                        <button className="text-slate-400 hover:text-indigo-600">
                          <Download size={14} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
