"use client";

import { useState } from "react";
import { CalendarDays, ChevronRight, CheckCircle2, ArrowLeftRight } from "lucide-react";

const upcomingLessons = [
  { id: "1", date: "2026/3/24（火）", time: "15:00〜15:45", class: "初級ピアノ A" },
  { id: "2", date: "2026/3/31（火）", time: "15:00〜15:45", class: "初級ピアノ A" },
  { id: "3", date: "2026/4/7（火）", time: "15:00〜15:45", class: "初級ピアノ A" },
];

const rescheduleSlots = [
  { id: "r1", date: "3/22（土）", time: "10:00〜10:45", class: "土曜補講" },
  { id: "r2", date: "3/25（火）", time: "17:00〜17:45", class: "初級ピアノ B 振替枠" },
];

type Step = "select" | "reason" | "reschedule" | "done";

export default function PortalAttendancePage() {
  const [step, setStep] = useState<Step>("select");
  const [selectedLesson, setSelectedLesson] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [wantReschedule, setWantReschedule] = useState<boolean | null>(null);

  if (step === "done") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-4">
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
          <CheckCircle2 size={32} className="text-emerald-600" />
        </div>
        <div>
          <p className="text-xl font-bold text-slate-800">連絡が完了しました</p>
          <p className="text-slate-400 text-sm mt-1">
            {wantReschedule ? "振替申請も送信しました。先生の承認をお待ちください。" : "欠席連絡を送信しました。"}
          </p>
        </div>
        <button
          onClick={() => { setStep("select"); setSelectedLesson(null); setReason(""); setSelectedSlot(null); setWantReschedule(null); }}
          className="mt-4 text-sm text-indigo-600 font-medium underline"
        >
          トップに戻る
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-800">欠席連絡</h1>
        <p className="text-slate-400 text-sm mt-0.5">お休みする授業を選択してください</p>
      </div>

      {/* Step 1: 授業を選ぶ */}
      {step === "select" && (
        <div className="space-y-3">
          {upcomingLessons.map((lesson) => (
            <button
              key={lesson.id}
              onClick={() => { setSelectedLesson(lesson.id); setStep("reason"); }}
              className={`w-full bg-white rounded-2xl border p-4 flex items-center gap-4 text-left transition-colors hover:border-indigo-300 ${selectedLesson === lesson.id ? "border-indigo-500" : "border-slate-200"}`}
            >
              <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center shrink-0">
                <CalendarDays size={18} className="text-indigo-600" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-slate-800 text-sm">{lesson.date}</p>
                <p className="text-xs text-slate-400 mt-0.5">{lesson.class}　{lesson.time}</p>
              </div>
              <ChevronRight size={16} className="text-slate-400" />
            </button>
          ))}
        </div>
      )}

      {/* Step 2: 理由を入力 */}
      {step === "reason" && (
        <div className="space-y-4">
          <div className="bg-indigo-50 rounded-xl px-4 py-3">
            <p className="text-xs text-indigo-500">選択した授業</p>
            <p className="text-sm font-semibold text-indigo-800 mt-0.5">
              {upcomingLessons.find(l => l.id === selectedLesson)?.date}
              {upcomingLessons.find(l => l.id === selectedLesson)?.class}
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-2">欠席理由</label>
              <div className="grid grid-cols-2 gap-2">
                {["体調不良", "学校行事", "家庭の事情", "その他"].map((r) => (
                  <button
                    key={r}
                    onClick={() => setReason(r)}
                    className={`py-2.5 rounded-xl text-sm font-medium border transition-colors ${reason === r ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-slate-600 border-slate-200 hover:border-indigo-300"}`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-2">備考（任意）</label>
              <textarea
                rows={3}
                placeholder="詳細があればご記入ください..."
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-2">振替授業を希望しますか？</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => { setWantReschedule(true); setStep("reschedule"); }}
                  className="py-3 rounded-xl text-sm font-medium border border-slate-200 text-slate-700 hover:border-indigo-300 flex items-center justify-center gap-2"
                >
                  <ArrowLeftRight size={14} />
                  希望する
                </button>
                <button
                  onClick={() => { setWantReschedule(false); setStep("done"); }}
                  className="py-3 rounded-xl text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 flex items-center justify-center gap-2"
                >
                  欠席のみ連絡
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: 振替コマを選ぶ */}
      {step === "reschedule" && (
        <div className="space-y-4">
          <div>
            <h2 className="text-base font-bold text-slate-800">振替授業を選択</h2>
            <p className="text-xs text-slate-400 mt-0.5">振替可能なコマを選んでください</p>
          </div>

          {rescheduleSlots.map((slot) => (
            <button
              key={slot.id}
              onClick={() => setSelectedSlot(slot.id)}
              className={`w-full bg-white rounded-2xl border p-4 flex items-center gap-4 text-left transition-colors ${selectedSlot === slot.id ? "border-indigo-500 bg-indigo-50" : "border-slate-200 hover:border-indigo-300"}`}
            >
              <div className={`w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center ${selectedSlot === slot.id ? "border-indigo-600 bg-indigo-600" : "border-slate-300"}`}>
                {selectedSlot === slot.id && <div className="w-2 h-2 bg-white rounded-full" />}
              </div>
              <div>
                <p className="font-semibold text-slate-800 text-sm">{slot.date}　{slot.time}</p>
                <p className="text-xs text-slate-400 mt-0.5">{slot.class}</p>
              </div>
            </button>
          ))}

          <button
            disabled={!selectedSlot}
            onClick={() => setStep("done")}
            className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-indigo-700 transition-colors"
          >
            振替申請を送信する
          </button>
        </div>
      )}
    </div>
  );
}
