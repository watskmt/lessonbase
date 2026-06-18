// ログイン処理のコアロジック。
// React コンポーネントから切り離してユニットテスト可能にしている。

/** signInWithPassword だけを使う最小限のクライアント型 */
export type AuthClient = {
  auth: {
    signInWithPassword: (credentials: {
      email: string;
      password: string;
    }) => Promise<{ error: { message: string } | null }>;
  };
};

export type SignInResult = { ok: true } | { ok: false; message: string };

export const LOGIN_ERROR_MESSAGES = {
  emailNotConfirmed:
    "メールアドレスの確認が完了していません。登録時に送信した確認メールのリンクをクリックしてからログインしてください。",
  invalidCredentials: "メールアドレスまたはパスワードが正しくありません",
} as const;

/**
 * メール＋パスワードでログインし、結果を表示用メッセージに正規化して返す。
 * 成功なら { ok: true }、失敗なら日本語メッセージ付き { ok: false }。
 */
export async function signInWithEmail(
  client: AuthClient,
  email: string,
  password: string
): Promise<SignInResult> {
  const { error } = await client.auth.signInWithPassword({ email, password });

  if (error) {
    if (error.message === "Email not confirmed") {
      return { ok: false, message: LOGIN_ERROR_MESSAGES.emailNotConfirmed };
    }
    return { ok: false, message: LOGIN_ERROR_MESSAGES.invalidCredentials };
  }

  return { ok: true };
}

/**
 * デモ用の資格情報を解決する。両方揃っているときだけ有効。
 * （NEXT_PUBLIC_* はビルド時に文字列へ置換されるため、呼び出し側で
 *  process.env.NEXT_PUBLIC_DEMO_EMAIL 等をそのまま渡すこと）
 */
export function resolveDemoCredentials(
  email: string | undefined,
  password: string | undefined
): { email: string; password: string } | null {
  if (email && password) {
    return { email, password };
  }
  return null;
}
