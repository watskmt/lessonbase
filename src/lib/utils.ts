import { randomBytes } from "crypto";

export function generateInviteToken(): string {
  return randomBytes(32).toString("hex");
}

export function formatJpy(amount: number): string {
  return `¥${amount.toLocaleString("ja-JP")}`;
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function getDayLabel(dayOfWeek: number): string {
  return ["日", "月", "火", "水", "木", "金", "土"][dayOfWeek] ?? "—";
}

export function getAttendanceRate(present: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((present / total) * 100);
}

export function getCurrentYearMonth(): { year: number; month: number } {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
}
