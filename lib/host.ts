export type AppSurface = "portal" | "ops";

function stripPort(host: string): string {
  return host.split(":")[0]?.toLowerCase() ?? "";
}

function cleanHostEnv(value: string | undefined, fallback: string): string {
  return (
    value?.replace(/^https?:\/\//, "").replace(/\/$/, "").toLowerCase() ||
    fallback
  );
}

export function getPortalHost(): string {
  return cleanHostEnv(process.env.NEXT_PUBLIC_PORTAL_HOST, "portal.nahara.id");
}

export function getOpsHost(): string {
  return cleanHostEnv(process.env.NEXT_PUBLIC_OPS_HOST, "nahara.id");
}

function originForHost(host: string): string {
  if (host.includes("localhost") || host.startsWith("127.")) {
    const withPort = process.env.NEXT_PUBLIC_DEV_PORTAL_ORIGIN;
    if (host === stripPort(getPortalHost()) && withPort) return withPort.replace(/\/$/, "");
    const opsOrigin = process.env.NEXT_PUBLIC_DEV_OPS_ORIGIN;
    if (host === stripPort(getOpsHost()) && opsOrigin) return opsOrigin.replace(/\/$/, "");
    return `http://${host}`;
  }
  return `https://${host}`;
}

/** Absolute origin for portal warga (no trailing slash). */
export function getPortalOrigin(): string {
  return originForHost(getPortalHost());
}

/** Absolute origin for ops (no trailing slash). */
export function getOpsOrigin(): string {
  return originForHost(getOpsHost());
}

/**
 * Resolve app surface from Host header.
 * - portal.nahara.id → portal
 * - nahara.id / www.nahara.id → ops
 * - localhost / preview → NEXT_PUBLIC_APP_SURFACE or portal
 */
export function getAppSurface(hostHeader: string | null | undefined): AppSurface {
  const host = stripPort(hostHeader ?? "");
  const portalHost = stripPort(getPortalHost());
  const opsHost = stripPort(getOpsHost());

  if (host === portalHost || host.startsWith("portal.")) {
    return "portal";
  }
  if (host === opsHost || host === `www.${opsHost}`) {
    return "ops";
  }

  const forced = process.env.NEXT_PUBLIC_APP_SURFACE;
  if (forced === "portal" || forced === "ops") {
    return forced;
  }

  return "portal";
}

export function buildPortalUrl(pathname: string, search = ""): string {
  const path = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return `${getPortalOrigin()}${path}${search}`;
}

export function buildOpsUrl(pathname: string, search = ""): string {
  const path = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return `${getOpsOrigin()}${path}${search}`;
}

/** Paths that stay on ops without login (staff entry). */
export function isOpsPublicPath(pathname: string): boolean {
  return pathname === "/login" || pathname.startsWith("/login/");
}
