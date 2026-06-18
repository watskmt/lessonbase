import { describe, it, expect, vi } from "vitest";
import {
  signInWithEmail,
  resolveDemoCredentials,
  LOGIN_ERROR_MESSAGES,
  type AuthClient,
} from "../auth";

/** signInWithPassword をモックした AuthClient を作る */
function mockClient(error: { message: string } | null) {
  const signInWithPassword = vi.fn().mockResolvedValue({ error });
  const client: AuthClient = { auth: { signInWithPassword } };
  return { client, signInWithPassword };
}

describe("signInWithEmail", () => {
  it("認証成功時は ok:true を返す", async () => {
    const { client, signInWithPassword } = mockClient(null);

    const result = await signInWithEmail(client, "demo@example.com", "secret");

    expect(result).toEqual({ ok: true });
    expect(signInWithPassword).toHaveBeenCalledWith({
      email: "demo@example.com",
      password: "secret",
    });
  });

  it("入力したメール・パスワードをそのままクライアントへ渡す", async () => {
    const { client, signInWithPassword } = mockClient(null);

    await signInWithEmail(client, "user@test.jp", "p@ss w0rd");

    expect(signInWithPassword).toHaveBeenCalledTimes(1);
    expect(signInWithPassword).toHaveBeenCalledWith({
      email: "user@test.jp",
      password: "p@ss w0rd",
    });
  });

  it("メール未確認エラーは専用メッセージを返す", async () => {
    const { client } = mockClient({ message: "Email not confirmed" });

    const result = await signInWithEmail(client, "demo@example.com", "secret");

    expect(result).toEqual({
      ok: false,
      message: LOGIN_ERROR_MESSAGES.emailNotConfirmed,
    });
  });

  it("その他の認証エラーは汎用メッセージにまとめる", async () => {
    const { client } = mockClient({ message: "Invalid login credentials" });

    const result = await signInWithEmail(client, "demo@example.com", "wrong");

    expect(result).toEqual({
      ok: false,
      message: LOGIN_ERROR_MESSAGES.invalidCredentials,
    });
  });

  it("未知のエラーメッセージでも生のメッセージを露出しない", async () => {
    const { client } = mockClient({ message: "rate limit exceeded" });

    const result = await signInWithEmail(client, "demo@example.com", "secret");

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toBe(LOGIN_ERROR_MESSAGES.invalidCredentials);
      expect(result.message).not.toContain("rate limit");
    }
  });
});

describe("resolveDemoCredentials", () => {
  it("メールとパスワードが揃っていれば資格情報を返す", () => {
    expect(
      resolveDemoCredentials("demo@example.com", "demo-password")
    ).toEqual({ email: "demo@example.com", password: "demo-password" });
  });

  it("メールが未設定なら null", () => {
    expect(resolveDemoCredentials(undefined, "demo-password")).toBeNull();
  });

  it("パスワードが未設定なら null", () => {
    expect(resolveDemoCredentials("demo@example.com", undefined)).toBeNull();
  });

  it("両方未設定なら null", () => {
    expect(resolveDemoCredentials(undefined, undefined)).toBeNull();
  });

  it("空文字は未設定として扱い null", () => {
    expect(resolveDemoCredentials("", "")).toBeNull();
    expect(resolveDemoCredentials("demo@example.com", "")).toBeNull();
  });
});
