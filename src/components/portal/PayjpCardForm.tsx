"use client";

import { useEffect, useRef, useState } from "react";
import { CreditCard, CheckCircle2, Loader2 } from "lucide-react";

declare global {
  interface Window {
    Payjp?: {
      (key: string): {
        createToken(element: unknown): Promise<{ error?: { message: string }; id?: string }>;
      };
      setPublicKey: (key: string) => void;
    };
    payjp?: unknown;
  }
}

interface PayjpCardFormProps {
  publicKey: string;
  onSuccess?: (tokenId: string) => void;
}

export function PayjpCardForm({ publicKey, onSuccess }: PayjpCardFormProps) {
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const payjpRef = useRef<ReturnType<NonNullable<typeof window.Payjp>> | null>(null);
  const elementRef = useRef<HTMLDivElement>(null);
  const [payjpElement, setPayjpElement] = useState<unknown>(null);

  useEffect(() => {
    if (!publicKey || typeof window === "undefined") return;

    // PAY.JP の js.pay.jp を動的ロード
    const script = document.createElement("script");
    script.src = "https://js.pay.jp/v2/pay.js";
    script.onload = () => {
      if (!window.Payjp) return;
      const payjp = window.Payjp(publicKey);
      payjpRef.current = payjp;

      // カード要素をマウント
      const elements = (payjp as unknown as {
        elements: () => { create: (type: string, opts: object) => { mount: (el: HTMLDivElement) => void } };
      }).elements();
      const cardEl = elements.create("card", {
        style: {
          base: {
            fontSize: "14px",
            color: "#1e293b",
            "::placeholder": { color: "#94a3b8" },
          },
        },
      });
      if (elementRef.current) {
        cardEl.mount(elementRef.current);
        setPayjpElement(cardEl);
      }
    };
    document.head.appendChild(script);
    return () => { document.head.removeChild(script); };
  }, [publicKey]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payjpRef.current || !payjpElement) return;

    setLoading(true);
    setError("");

    const result = await payjpRef.current.createToken(payjpElement);

    if (result.error) {
      setError(result.error.message ?? "カード情報の取得に失敗しました");
      setLoading(false);
      return;
    }

    if (result.id) {
      // トークンをサーバーに送って Customer に登録
      const res = await fetch("/api/payjp/register-card", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tokenId: result.id }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "カード登録に失敗しました");
        setLoading(false);
        return;
      }

      setSaved(true);
      onSuccess?.(result.id);
    }

    setLoading(false);
  };

  if (saved) {
    return (
      <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-2xl border border-emerald-200">
        <CheckCircle2 size={20} className="text-emerald-600 shrink-0" />
        <p className="text-sm font-semibold text-emerald-800">カードを登録しました</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-xs font-semibold text-slate-500 block mb-2 flex items-center gap-1.5">
          <CreditCard size={13} />
          クレジットカード情報
        </label>
        {/* PAY.JP の Hosted Fields がここにマウントされる */}
        <div
          ref={elementRef}
          className="border border-slate-200 rounded-xl px-4 py-3.5 min-h-[46px] bg-white"
        />
        <p className="text-xs text-slate-400 mt-1.5">
          Visa / MasterCard / JCB / AMEX / Diners 対応
        </p>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading || !payjpElement}
        className="w-full bg-indigo-600 text-white py-3 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading ? (
          <><Loader2 size={14} className="animate-spin" />登録中...</>
        ) : (
          <>カードを登録する</>
        )}
      </button>

      <p className="text-xs text-slate-400 text-center">
        カード情報は PAY.JP が安全に管理します。当サービスはカード番号を保持しません。
      </p>
    </form>
  );
}
