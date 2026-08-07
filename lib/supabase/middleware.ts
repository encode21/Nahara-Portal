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
  buildPortalUrl,
  getAppSurface,
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

  // --- Ops host ---
  if (surface === "ops") {
    // Anon: hard-redirect to portal except /login
    if (!user && !isOpsPublicPath(pathname)) {
      return NextResponse.redirect(buildPortalUrl(pathname, search));
    }

    // Already logged in on /login → role home
    if (pathname === "/login" && user) {
      const url = request.nextUrl.clone();
      url.pathname = postLoginPath(user);
      url.search = "";
      return NextResponse.redirect(url);
    }

    // Staff: only allowlisted paths
    if (user && isFinanceRestricted(user) && !isStaffAllowedPath(pathname)) {
      const url = request.nextUrl.clone();
      url.pathname = "/pengumuman";
      url.search = "";
      return NextResponse.redirect(url);
    }

    // Admin-only manage/finance paths
    if (isAdminOnlyPath(pathname) && !admin) {
      const url = request.nextUrl.clone();
      if (!user) {
        url.pathname = "/login";
        url.searchParams.set("redirect", safeInternalPath(pathname));
      } else if (staff) {
        url.pathname = "/pengumuman";
        url.search = "";
      } else {
        url.pathname = "/login";
        url.searchParams.set("redirect", safeInternalPath(pathname));
      }
      return NextResponse.redirect(url);
    }

    return supabaseResponse;
  }

  // --- Portal host ---
  // Optional: staff/admin hitting portal /login → send to ops login via page link; keep portal open
  if (pathname === "/login" && user) {
    const url = request.nextUrl.clone();
    url.pathname = postLoginPath(user);
    url.search = "";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
