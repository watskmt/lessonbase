import { describe, it, expect } from "vitest";
import {
  generateInviteToken,
  formatJpy,
  formatDate,
  getDayLabel,
  getAttendanceRate,
  getCurrentYearMonth,
} from "../utils";

describe("generateInviteToken", () => {
  it("64文字の16進数文字列を返す", () => {
    const token = generateInviteToken();
    expect(token).toHaveLength(64);
    expect(token).toMatch(/^[0-9a-f]{64}$/);
  });

  it("呼び出すたびに異なる値を返す", () => {
    const token1 = generateInviteToken();
    const token2 = generateInviteToken();
    expect(token1).not.toBe(token2);
  });
});

describe("formatJpy", () => {
  it("金額を¥表記でフォーマットする", () => {
    expect(formatJpy(5000)).toBe("¥5,000");
  });

  it("0円を正しくフォーマットする", () => {
    expect(formatJpy(0)).toBe("¥0");
  });

  it("大きい金額にカンマが入る", () => {
    expect(formatJpy(1000000)).toBe("¥1,000,000");
  });
});

describe("formatDate", () => {
  it("日本語形式の日付文字列を返す", () => {
    const result = formatDate("2025-04-01");
    expect(result).toMatch(/2025年/);
    expect(result).toMatch(/4月/);
    expect(result).toMatch(/1日/);
  });

  it("12月31日を正しくフォーマットする", () => {
    const result = formatDate("2025-12-31");
    expect(result).toMatch(/2025年/);
    expect(result).toMatch(/12月/);
    expect(result).toMatch(/31日/);
  });
});

describe("getDayLabel", () => {
  it.each([
    [0, "日"],
    [1, "月"],
    [2, "火"],
    [3, "水"],
    [4, "木"],
    [5, "金"],
    [6, "土"],
  ])("dayOfWeek=%i は %s を返す", (day, expected) => {
    expect(getDayLabel(day)).toBe(expected);
  });

  it("範囲外の値は — を返す", () => {
    expect(getDayLabel(7)).toBe("—");
    expect(getDayLabel(-1)).toBe("—");
  });
});

describe("getAttendanceRate", () => {
  it("出席率をパーセントで返す", () => {
    expect(getAttendanceRate(3, 4)).toBe(75);
  });

  it("全出席は100を返す", () => {
    expect(getAttendanceRate(10, 10)).toBe(100);
  });

  it("全欠席は0を返す", () => {
    expect(getAttendanceRate(0, 10)).toBe(0);
  });

  it("合計0のとき0を返す（ゼロ除算を防ぐ）", () => {
    expect(getAttendanceRate(0, 0)).toBe(0);
  });

  it("小数点以下を四捨五入する", () => {
    expect(getAttendanceRate(1, 3)).toBe(33);
    expect(getAttendanceRate(2, 3)).toBe(67);
  });
});

describe("getCurrentYearMonth", () => {
  it("yearとmonthを持つオブジェクトを返す", () => {
    const { year, month } = getCurrentYearMonth();
    expect(year).toBeTypeOf("number");
    expect(month).toBeTypeOf("number");
  });

  it("monthは1〜12の範囲内", () => {
    const { month } = getCurrentYearMonth();
    expect(month).toBeGreaterThanOrEqual(1);
    expect(month).toBeLessThanOrEqual(12);
  });

  it("yearは現在年と一致する", () => {
    const { year } = getCurrentYearMonth();
    expect(year).toBe(new Date().getFullYear());
  });
});
