export type AppSurface = "landing" | "portal" | "ops";

function stripPort(host: string): string {
  return host.split(":")[0]?.toLowerCase() ?? "";
}

function cleanHostEnv(value: string | undefined, fallback: string): string {
  return (
    value?.replace(/^https?:\/\//, "").replace(/\/$/, "").toLowerCase() ||
    fallback
  );
}

export function getLandingHost(): string {
  return cleanHostEnv(process.env.NEXT_PUBLIC_LANDING_HOST, "nahara.id");
}

export function getPortalHost(): string {
  return cleanHostEnv(process.env.NEXT_PUBLIC_PORTAL_HOST, "portal.nahara.id");
}

export function getOpsHost(): string {
  return cleanHostEnv(process.env.NEXT_PUBLIC_OPS_HOST, "ops.nahara.id");
}

function originForHost(host: string): string {
  if (host.includes("localhost") || host.startsWith("127.")) {
    const landingOrigin = process.env.NEXT_PUBLIC_DEV_LANDING_ORIGIN;
    if (host === stripPort(getLandingHost()) && landingOrigin) {
      return landingOrigin.replace(/\/$/, "");
    }
    const portalOrigin = process.env.NEXT_PUBLIC_DEV_PORTAL_ORIGIN;
    if (host === stripPort(getPortalHost()) && portalOrigin) {
      return portalOrigin.replace(/\/$/, "");
    }
    const opsOrigin = process.env.NEXT_PUBLIC_DEV_OPS_ORIGIN;
    if (host === stripPort(getOpsHost()) && opsOrigin) {
      return opsOrigin.replace(/\/$/, "");
    }
    return `http://${host}`;
  }
  return `https://${host}`;
}

export function getLandingOrigin(): string {
  return originForHost(getLandingHost());
}

export function getPortalOrigin(): string {
  return originForHost(getPortalHost());
}

export function getOpsOrigin(): string {
  return originForHost(getOpsHost());
}

/**
 * - nahara.id / www → landing
 * - portal.nahara.id → portal
 * - ops.nahara.id → ops
 * - localhost / preview → NEXT_PUBLIC_APP_SURFACE or portal
 */
export function getAppSurface(hostHeader: string | null | undefined): AppSurface {
  const host = stripPort(hostHeader ?? "");
  const landingHost = stripPort(getLandingHost());
  const portalHost = stripPort(getPortalHost());
  const opsHost = stripPort(getOpsHost());

  if (host === portalHost || host.startsWith("portal.")) {
    return "portal";
  }
  if (host === opsHost || host.startsWith("ops.")) {
    return "ops";
  }
  if (host === landingHost || host === `www.${landingHost}`) {
    return "landing";
  }

  const forced = process.env.NEXT_PUBLIC_APP_SURFACE;
  if (forced === "landing" || forced === "portal" || forced === "ops") {
    return forced;
  }

  return "portal";
}

export function buildLandingUrl(pathname = "/", search = ""): string {
  const path = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return `${getLandingOrigin()}${path}${search}`;
}

export function buildPortalUrl(pathname: string, search = ""): string {
  const path = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return `${getPortalOrigin()}${path}${search}`;
}

export function buildOpsUrl(pathname: string, search = ""): string {
  const path = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return `${getOpsOrigin()}${path}${search}`;
}

function pathHasPrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

/** Paths that stay on ops without session. */
export function isOpsPublicPath(pathname: string): boolean {
  return pathname === "/login" || pathname.startsWith("/login/");
}

/** Paths allowed on landing host without hop to portal. */
export function isLandingPath(pathname: string): boolean {
  if (pathname === "/" || pathname === "") return true;
  // SEO crawlers — jangan redirect ke portal
  if (
    pathname === "/sitemap.xml" ||
    pathname === "/robots.txt" ||
    pathname === "/manifest.webmanifest" ||
    pathname === "/manifest"
  ) {
    return true;
  }
  // Single-page hub Agustusan (tanpa shell portal warga)
  if (pathname === "/agustusan" || pathname.startsWith("/agustusan/")) return true;
  // Baca saja — buat/edit tetap di portal/ops
  if (pathname === "/pengumuman" || pathname.startsWith("/pengumuman/")) return true;
  // Pengaduan: list + detail/thread (bukan /pengaduan/baru)
  if (pathname === "/pengaduan") return true;
  if (/^\/pengaduan\/[^/]+$/.test(pathname) && !pathname.startsWith("/pengaduan/baru")) {
    return true;
  }
  return false;
}

/**
 * Deep links on nahara.id that should still hop to portal/ops apps.
 * Unknown paths must not 307 — that amplified scanners (e.g. /shopdetail/id).
 */
const APP_HOP_PREFIXES = [
  "/dashboard",
  "/kegiatan",
  "/iuran",
  "/keuangan",
  "/info-warga",
  "/info-security",
  "/donasi",
  "/cctv",
  "/panduan",
  "/activities",
  "/kas",
  "/contests",
  "/offline",
  "/register",
  "/api",
] as const;

export function isAppHopPath(pathname: string): boolean {
  return APP_HOP_PREFIXES.some((prefix) => pathHasPrefix(pathname, prefix));
}

/**
 * Jejak situs PHP / SEO spam / scanner e-commerce lama di domain.
 * Harus 410 di landing — jangan di-redirect ke portal.
 */
export function isLegacySpamPath(pathname: string): boolean {
  const p = pathname.toLowerCase();
  if (p.endsWith(".php") || p.includes(".php/")) return true;
  if (p === "/saiga" || p.startsWith("/saiga/")) return true;
  if (p === "/shopdetail" || p.startsWith("/shopdetail/")) return true;
  if (
    p.startsWith("/wp-") ||
    p === "/xmlrpc.php" ||
    p === "/wlwmanifest.xml" ||
    p === "/xmlrpc" ||
    p.startsWith("/xmlrpc/")
  ) {
    return true;
  }
  if (
    p.startsWith("/phpmyadmin") ||
    p.startsWith("/pma") ||
    p.startsWith("/cgi-bin") ||
    p.startsWith("/vendor/") ||
    p === "/vendor" ||
    p.startsWith("/wordpress") ||
    p.startsWith("/administrator") ||
    p.startsWith("/.env") ||
    p.startsWith("/.git")
  ) {
    return true;
  }
  return false;
}
