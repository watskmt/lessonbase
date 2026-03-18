"use client";

import { useState } from "react";
import { Search, Plus, Filter, CheckCircle2, Clock, XCircle } from "lucide-react";
import StudentModal from "@/components/StudentModal";

const students = [
  { id: 1, name: "田中 さくら", kana: "タナカ サクラ", age: 8, classes: ["初級ピアノ A"], status: "在籍", payStatus: "未払い", since: "2024/04" },
  { id: 2, name: "鈴木 翔太", kana: "スズキ ショウタ", age: 10, classes: ["中級ピアノ"], status: "在籍", payStatus: "支払済", since: "2023/09" },
  { id: 3, name: "佐藤 陽菜", kana: "サトウ ヒナ", age: 7, classes: ["初級ピアノ B"], status: "在籍", payStatus: "失敗", since: "2025/01" },
  { id: 4, name: "高橋 美咲", kana: "タカハシ ミサキ", age: 12, classes: ["中級ピアノ", "初級ピアノ B"], status: "在籍", payStatus: "支払済", since: "2022/04" },
  { id: 5, name: "伊藤 蓮", kana: "イトウ レン", age: 9, classes: ["初級ピアノ A"], status: "在籍", payStatus: "支払済", since: "2024/10" },
  { id: 6, name: "渡辺 杏", kana: "ワタナベ アン", age: 11, classes: ["上級ピアノ"], status: "休会", payStatus: "—", since: "2021/06" },
  { id: 7, name: "山本 大翔", kana: "ヤマモト ヒロト", age: 6, classes: ["初級ピアノ A"], status: "在籍", payStatus: "支払済", since: "2025/09" },
  { id: 8, name: "中村 葵", kana: "ナカムラ アオイ", age: 13, classes: ["上級ピアノ"], status: "在籍", payStatus: "支払済", since: "2020/04" },
];

type Student = typeof students[number];

const payBadge: Record<string, { label: string; class: string; icon: React.ElementType }> = {
  "支払済": { label: "支払済", class: "bg-emerald-50 text-emerald-600", icon: CheckCircle2 },
  "未払い": { label: "未払い", class: "bg-red-50 text-red-500", icon: Clock },
  "失敗":   { label: "引落失敗", class: "bg-red-100 text-red-700", icon: XCircle },
  "—":      { label: "—", class: "bg-slate-50 text-slate-400", icon: () => <span>—</span> },
};

const statusBadge: Record<string, string> = {
  "在籍": "bg-indigo-50 text-indigo-600",
  "休会": "bg-amber-50 text-amber-600",
  "退会": "bg-slate-100 text-slate-400",
};

export default function StudentsPage() {
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  return (
    <>
      <div className="p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">生徒管理</h1>
            <p className="text-slate-400 text-sm mt-1">在籍 42名 / 休会 3名</p>
          </div>
          <button className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
            <Plus size={16} />
            生徒を追加
          </button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="生徒名・フリガナで検索..."
              className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-600 bg-white hover:bg-slate-50">
            <Filter size={16} />
            絞り込み
          </button>
          <div className="flex border border-slate-200 rounded-lg overflow-hidden bg-white text-sm">
            {["すべて", "在籍", "休会", "退会"].map((f, i) => (
              <button
                key={f}
                className={`px-4 py-2.5 ${i === 0 ? "bg-indigo-600 text-white" : "text-slate-600 hover:bg-slate-50"}`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">生徒名</th>
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">年齢</th>
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">クラス</th>
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">ステータス</th>
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">3月分月謝</th>
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">入会日</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {students.map((s) => {
                const pay = payBadge[s.payStatus];
                const PayIcon = pay.icon;
                return (
                  <tr
                    key={s.id}
                    className="hover:bg-slate-50 transition-colors cursor-pointer"
                    onClick={() => setSelectedStudent(s)}
                  >
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-slate-800">{s.name}</p>
                      <p className="text-xs text-slate-400">{s.kana}</p>
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-600">{s.age}歳</td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-1">
                        {s.classes.map((c) => (
                          <span key={c} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">{c}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusBadge[s.status]}`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full w-fit ${pay.class}`}>
                        <PayIcon size={12} />
                        {pay.label}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-500">{s.since}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {selectedStudent && (
        <StudentModal
          student={selectedStudent}
          onClose={() => setSelectedStudent(null)}
        />
      )}
    </>
  );
}
