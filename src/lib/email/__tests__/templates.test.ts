import { describe, it, expect } from "vitest";
import {
  guardianInviteEmail,
  paymentReminderEmail,
  messageNotificationEmail,
} from "../templates";

describe("guardianInviteEmail", () => {
  const params = {
    guardianName: "山田 太郎",
    studentName: "山田 花子",
    studioName: "テストスタジオ",
    inviteUrl: "https://example.com/invite/abc123",
  };

  it("件名にスタジオ名が含まれる", () => {
    const { subject } = guardianInviteEmail(params);
    expect(subject).toContain("テストスタジオ");
  });

  it("HTMLに保護者名が含まれる", () => {
    const { html } = guardianInviteEmail(params);
    expect(html).toContain("山田 太郎");
  });

  it("HTMLに生徒名が含まれる", () => {
    const { html } = guardianInviteEmail(params);
    expect(html).toContain("山田 花子");
  });

  it("HTMLに招待URLが含まれる", () => {
    const { html } = guardianInviteEmail(params);
    expect(html).toContain("https://example.com/invite/abc123");
  });

  it("有効なHTML構造を持つ", () => {
    const { html } = guardianInviteEmail(params);
    expect(html).toMatch(/^<!DOCTYPE html>/);
    expect(html).toContain("</html>");
  });
});

describe("paymentReminderEmail", () => {
  const params = {
    guardianName: "佐藤 次郎",
    studentName: "佐藤 一郎",
    amount: 8000,
    month: "2025年4月",
    dueDate: "2025年4月30日",
    portalUrl: "https://example.com/portal",
  };

  it("件名に対象月と金額が含まれる", () => {
    const { subject } = paymentReminderEmail(params);
    expect(subject).toContain("2025年4月");
    expect(subject).toContain("8,000");
  });

  it("HTMLに保護者名が含まれる", () => {
    const { html } = paymentReminderEmail(params);
    expect(html).toContain("佐藤 次郎");
  });

  it("HTMLに生徒名が含まれる", () => {
    const { html } = paymentReminderEmail(params);
    expect(html).toContain("佐藤 一郎");
  });

  it("HTMLに金額が含まれる", () => {
    const { html } = paymentReminderEmail(params);
    expect(html).toContain("8,000");
  });

  it("HTMLにポータルURLが含まれる", () => {
    const { html } = paymentReminderEmail(params);
    expect(html).toContain("https://example.com/portal");
  });

  it("HTMLに期日が含まれる", () => {
    const { html } = paymentReminderEmail(params);
    expect(html).toContain("2025年4月30日");
  });
});

describe("messageNotificationEmail", () => {
  const params = {
    guardianName: "鈴木 三郎",
    studioName: "ミュージックスクール",
    messageTitle: "発表会のご案内",
    messagePreview: "今年の発表会は12月に開催します。",
    portalUrl: "https://example.com/portal",
  };

  it("件名にスタジオ名とタイトルが含まれる", () => {
    const { subject } = messageNotificationEmail(params);
    expect(subject).toContain("ミュージックスクール");
    expect(subject).toContain("発表会のご案内");
  });

  it("HTMLに保護者名が含まれる", () => {
    const { html } = messageNotificationEmail(params);
    expect(html).toContain("鈴木 三郎");
  });

  it("HTMLにメッセージタイトルが含まれる", () => {
    const { html } = messageNotificationEmail(params);
    expect(html).toContain("発表会のご案内");
  });

  it("HTMLにプレビューテキストが含まれる", () => {
    const { html } = messageNotificationEmail(params);
    expect(html).toContain("今年の発表会は12月に開催します。");
  });

  it("HTMLにポータルURLが含まれる", () => {
    const { html } = messageNotificationEmail(params);
    expect(html).toContain("https://example.com/portal");
  });
});
