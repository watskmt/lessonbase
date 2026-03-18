import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const { pathname } = req.nextUrl;

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            req.cookies.set(name, value);
            res.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  // ============================================================
  // 保護者ポータル (/portal/*) の認証
  // ============================================================
  if (pathname.startsWith("/portal") && !pathname.startsWith("/portal/login")) {
    if (!user) {
      return NextResponse.redirect(new URL("/portal/login", req.url));
    }
    // 保護者ユーザーかチェック
    const { data: guardian } = await supabase
      .from("guardians")
      .select("id")
      .eq("auth_id", user.id)
      .maybeSingle();

    if (!guardian) {
      return NextResponse.redirect(new URL("/portal/login", req.url));
    }
  }

  // ============================================================
  // スタジオ管理画面 (/ 以下) の認証
  // ============================================================
  const studioRoutes = ["/", "/students", "/classes", "/attendance", "/billing", "/messages", "/settings"];
  const isStudioRoute = studioRoutes.some(r => pathname === r || pathname.startsWith(r + "/"));

  if (isStudioRoute) {
    if (!user) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    const { data: studioUser } = await supabase
      .from("studio_users")
      .select("id")
      .eq("auth_id", user.id)
      .maybeSingle();

    if (!studioUser) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  // ログイン済みでログイン画面に来たらリダイレクト
  if (user && (pathname === "/login" || pathname === "/signup")) {
    return NextResponse.redirect(new URL("/", req.url));
  }
  if (user && pathname === "/portal/login") {
    const { data: guardian } = await supabase
      .from("guardians")
      .select("id")
      .eq("auth_id", user.id)
      .maybeSingle();
    if (guardian) {
      return NextResponse.redirect(new URL("/portal", req.url));
    }
  }

  return res;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/payjp/webhook).*)",
  ],
};
