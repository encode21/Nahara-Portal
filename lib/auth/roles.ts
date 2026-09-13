import type { User } from "@supabase/supabase-js";
import type { AppSurface } from "@/lib/host";

export type PortalRole =
  | "admin"
  | "estate"
  | "rtrw"
  | "ketua"
  | "it"
  | "sekretaris";

const REGISTRY_ROLES = new Set<PortalRole>([
  "admin",
  "ketua",
  "it",
  "sekretaris",
]);

/** Dedicated admin manage routes (finance / kegiatan). */
export const ADMIN_ONLY_ROUTE_PREFIXES = [
  "/activities",
  "/kas",
  "/iuran",
  "/keuangan",
] as const;

/** Routes staff (estate/rtrw) may use on ops host. */
export const STAFF_ALLOWED_PREFIXES = [
  "/pengumuman",
  "/pengaduan",
  "/kegiatan",
  "/situasi",
  "/panduan",
  "/login",
  "/offline",
] as const;

/** Routes registry roles (ketua/it/sekretaris) may use on ops — no finance. */
export const REGISTRY_ALLOWED_PREFIXES = [
  "/info-warga",
  "/data-warga",
  "/aktivitas-warga",
  "/jasa",
  "/dashboard",
  "/panduan",
  "/login",
  "/offline",
] as const;

export function getPortalRole(
  user: User | null | undefined
): PortalRole | null {
  const role = user?.app_metadata?.role;
  if (
    role === "admin" ||
    role === "estate" ||
    role === "rtrw" ||
    role === "ketua" ||
    role === "it" ||
    role === "sekretaris"
  ) {
    return role;
  }
  return null;
}

export function isPortalAdmin(user: User | null | undefined): boolean {
  return getPortalRole(user) === "admin";
}

export function isPortalStaff(user: User | null | undefined): boolean {
  const role = getPortalRole(user);
  return role === "estate" || role === "rtrw";
}

/** Ketua / IT / Sekretaris / Admin — kelola warga registry + vendor. */
export function isWargaRegistry(user: User | null | undefined): boolean {
  const role = getPortalRole(user);
  return role != null && REGISTRY_ROLES.has(role);
}

/** Registry-only roles (not full admin). */
export function isRegistryOnly(user: User | null | undefined): boolean {
  const role = getPortalRole(user);
  return role === "ketua" || role === "it" || role === "sekretaris";
}

/** Logged-in staff who must not see keuangan menus/pages. */
export function isFinanceRestricted(user: User | null | undefined): boolean {
  return (
    (isPortalStaff(user) || isRegistryOnly(user)) && !isPortalAdmin(user)
  );
}

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

export function isStaffAllowedPath(pathname: string): boolean {
  if (pathname === "/") return false;
  return STAFF_ALLOWED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

export function isRegistryAllowedPath(pathname: string): boolean {
  if (pathname === "/") return false;
  return REGISTRY_ALLOWED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

/** Default landing after login. */
export function postLoginPath(user: User | null | undefined): string {
  if (isPortalAdmin(user)) return "/dashboard";
  if (isRegistryOnly(user)) return "/data-warga";
  if (isPortalStaff(user)) return "/pengumuman";
  // Auth without JWT role (e.g. security_users) — dashboard; login page may override to Info Security
  return "/dashboard";
}

/**
 * Resolve redirect target after login on ops.
 * Staff / registry cannot land on admin/finance paths.
 */
export function resolveOpsPostLoginRedirect(
  user: User | null | undefined,
  requested: string | null | undefined
): string {
  const fallback = postLoginPath(user);
  const next = safeInternalPath(requested, fallback);
  if (isPortalAdmin(user)) return next;
  if (isRegistryOnly(user)) {
    return isRegistryAllowedPath(next) ? next : "/data-warga";
  }
  if (isPortalStaff(user)) {
    return isStaffAllowedPath(next) ? next : "/pengumuman";
  }
  return fallback;
}

export type NavAudience = {
  surface: AppSurface;
  isAdmin: boolean;
  isStaff: boolean;
};
