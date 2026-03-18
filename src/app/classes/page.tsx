import { Plus, Clock, Users, MoreHorizontal } from "lucide-react";

const days = ["月", "火", "水", "木", "金", "土", "日"];

const classes = [
  { id: 1, name: "初級ピアノ A", day: "火", time: "15:00〜15:45", capacity: 8, enrolled: 6, fee: 8000, color: "bg-indigo-100 text-indigo-700 border-indigo-200" },
  { id: 2, name: "初級ピアノ B", day: "火", time: "16:00〜16:45", capacity: 8, enrolled: 8, fee: 8000, color: "bg-indigo-100 text-indigo-700 border-indigo-200" },
  { id: 3, name: "中級ピアノ", day: "火", time: "17:00〜17:50", capacity: 6, enrolled: 5, fee: 10000, color: "bg-violet-100 text-violet-700 border-violet-200" },
  { id: 4, name: "上級ピアノ", day: "火", time: "18:30〜19:30", capacity: 5, enrolled: 4, fee: 12000, color: "bg-purple-100 text-purple-700 border-purple-200" },
  { id: 5, name: "初級ピアノ C", day: "木", time: "16:00〜16:45", capacity: 8, enrolled: 7, fee: 8000, color: "bg-indigo-100 text-indigo-700 border-indigo-200" },
  { id: 6, name: "中級ピアノ（木）", day: "木", time: "17:00〜17:50", capacity: 6, enrolled: 4, fee: 10000, color: "bg-violet-100 text-violet-700 border-violet-200" },
  { id: 7, name: "土曜上級", day: "土", time: "10:00〜11:00", capacity: 5, enrolled: 5, fee: 12000, color: "bg-purple-100 text-purple-700 border-purple-200" },
  { id: 8, name: "土曜初級", day: "土", time: "11:00〜11:45", capacity: 10, enrolled: 7, fee: 8000, color: "bg-indigo-100 text-indigo-700 border-indigo-200" },
];

const grouped = days.reduce<Record<string, typeof classes>>((acc, d) => {
  acc[d] = classes.filter((c) => c.day === d);
  return acc;
}, {});

export default function ClassesPage() {
  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">クラス管理</h1>
          <p className="text-slate-400 text-sm mt-1">全 {classes.length} クラス / 総定員 {classes.reduce((a, c) => a + c.capacity, 0)}名</p>
        </div>
        <button className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
          <Plus size={16} />
          クラスを追加
        </button>
      </div>

      <div className="space-y-6">
        {days.filter((d) => grouped[d]?.length > 0).map((d) => (
          <div key={d}>
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">{d}曜日</h2>
            <div className="grid grid-cols-2 gap-4">
              {grouped[d].map((c) => {
                const full = c.enrolled >= c.capacity;
                return (
                  <div key={c.id} className="bg-white rounded-xl border border-slate-200 p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${c.color}`}>
                          {c.name}
                        </span>
                      </div>
                      <button className="text-slate-400 hover:text-slate-600 p-1">
                        <MoreHorizontal size={16} />
                      </button>
                    </div>

                    <div className="flex items-center gap-4 mb-4">
                      <div className="flex items-center gap-1.5 text-sm text-slate-600">
                        <Clock size={14} className="text-slate-400" />
                        {c.time}
                      </div>
                      <div className="flex items-center gap-1.5 text-sm text-slate-600">
                        <Users size={14} className="text-slate-400" />
                        {c.enrolled} / {c.capacity}名
                      </div>
                    </div>

                    {/* Capacity bar */}
                    <div className="mb-4">
                      <div className="flex justify-between text-xs text-slate-400 mb-1">
                        <span>定員</span>
                        <span className={full ? "text-red-500 font-medium" : ""}>{full ? "満員" : `空き${c.capacity - c.enrolled}名`}</span>
                      </div>
                      <div className="bg-slate-100 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${full ? "bg-red-400" : "bg-indigo-500"}`}
                          style={{ width: `${(c.enrolled / c.capacity) * 100}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-slate-800">¥{c.fee.toLocaleString()}<span className="text-xs font-normal text-slate-400">/月</span></span>
                      <button className="text-xs text-indigo-600 font-medium hover:underline">詳細・生徒一覧</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
