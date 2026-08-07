import type { User } from "@supabase/supabase-js";

/** Dedicated admin manage routes (middleware-gated). */
export const ADMIN_ONLY_ROUTE_PREFIXES = ["/activities", "/kas"] as const;

export function isPortalAdmin(user: User | null | undefined): boolean {
  return user?.app_metadata?.role === "admin";
}

/**
 * Only same-origin relative paths. Blocks //evil.com, https://..., etc.
 */
export function safeInternalPath(
  path: string | null | undefined,
  fallback = "/dashboard"
): string {
  if (!path) return fallback;
  if (!path.startsWith("/")) return fallback;
  if (path.startsWith("//")) return fallback;
  if (path.includes("://")) return fallback;
  if (path.includes("\\")) return fallback;
  return path;
}

export function isAdminOnlyPath(pathname: string): boolean {
  return ADMIN_ONLY_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}
