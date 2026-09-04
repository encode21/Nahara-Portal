import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  isAdminOnlyPath,
  isFinanceRestricted,
  isPortalAdmin,
  isPortalStaff,
  isStaffAllowedPath,
  postLoginPath,
  safeInternalPath,
} from "@/lib/auth/roles";
import {
  buildOpsUrl,
  buildPortalUrl,
  getAppSurface,
  isAppHopPath,
  isLandingPath,
  isLegacySpamPath,
  isOpsPublicPath,
} from "@/lib/host";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const search = request.nextUrl.search;
  const surface = getAppSurface(request.headers.get("host"));
  const admin = isPortalAdmin(user);
  const staff = isPortalStaff(user);

  // --- Landing: nahara.id ---
  if (surface === "landing") {
    // Jejak spam/PHP lama — 410 Gone (bukan redirect ke portal)
    if (isLegacySpamPath(pathname)) {
      return new NextResponse("Gone", {
        status: 410,
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    }
    if (pathname === "/login" || pathname.startsWith("/login/")) {
      return NextResponse.redirect(buildOpsUrl("/login", search));
    }
    // Landing: form buat tetap tidak dibuka di sini (hindari spam publik)
    // List + detail/thread boleh di nahara.id tanpa hop ke portal
    if (pathname === "/pengaduan/baru" || pathname.startsWith("/pengaduan/baru/")) {
      const url = request.nextUrl.clone();
      url.pathname = "/pengaduan";
      url.search = "";
      return NextResponse.redirect(url);
    }
    if (isLandingPath(pathname)) {
      return supabaseResponse;
    }
    if (isAppHopPath(pathname)) {
      return NextResponse.redirect(buildPortalUrl(pathname, search));
    }
    return new NextResponse("Gone", {
      status: 410,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  // --- Ops: ops.nahara.id ---
  if (surface === "ops") {
    if (!user && !isOpsPublicPath(pathname)) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      if (pathname !== "/") {
        url.searchParams.set("redirect", safeInternalPath(pathname));
      } else {
        url.search = "";
      }
      return NextResponse.redirect(url);
    }

    if (pathname === "/login" && user) {
      const url = request.nextUrl.clone();
      url.pathname = postLoginPath(user);
      url.search = "";
      return NextResponse.redirect(url);
    }

    if (user && isFinanceRestricted(user) && !isStaffAllowedPath(pathname)) {
      const url = request.nextUrl.clone();
      url.pathname = "/pengumuman";
      url.search = "";
      return NextResponse.redirect(url);
    }

    if (isAdminOnlyPath(pathname) && !admin) {
      const url = request.nextUrl.clone();
      if (!user) {
        url.pathname = "/login";
        url.searchParams.set("redirect", safeInternalPath(pathname));
      } else if (staff) {
        url.pathname = "/pengumuman";
        url.search = "";
      } else {
        // Authenticated non-admin (e.g. security) — don't bounce to login
        url.pathname = "/info-security";
        url.search = "";
      }
      return NextResponse.redirect(url);
    }

    return supabaseResponse;
  }

  // --- Portal: portal.nahara.id ---
  if (pathname === "/login" || pathname.startsWith("/login/")) {
    return NextResponse.redirect(buildOpsUrl("/login", search));
  }

  return supabaseResponse;
}
