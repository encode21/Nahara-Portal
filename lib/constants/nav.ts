import {
  LayoutDashboard,
  Wallet,
  CreditCard,
  Users,
  HeartHandshake,
  Megaphone,
  Camera,
  CalendarDays,
  Bell,
  Shield,
  FolderLock,
  Wrench,
  Activity,
  type LucideIcon,
} from "lucide-react";
import type { AppSurface } from "@/lib/host";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  mobileLabel?: string;
};

export const portalNavItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/pengumuman", label: "Pengumuman", icon: Bell },
  { href: "/kegiatan", label: "Kegiatan", icon: CalendarDays },
  { href: "/iuran", label: "Iuran", icon: Wallet },
  { href: "/keuangan", label: "Keuangan", icon: CreditCard },
  { href: "/info-warga", label: "Info Warga", icon: Users, mobileLabel: "Warga" },
  { href: "/jasa", label: "Jasa", icon: Wrench },
  { href: "/info-security", label: "Info Security", icon: Shield, mobileLabel: "Security" },
  { href: "/donasi", label: "Donasi", icon: HeartHandshake },
  { href: "/pengaduan", label: "Pengaduan", icon: Megaphone },
  { href: "/cctv", label: "CCTV", icon: Camera },
];

const dataWargaNavItem: NavItem = {
  href: "/data-warga",
  label: "Data Warga",
  icon: FolderLock,
  mobileLabel: "Data",
};

const aktivitasWargaNavItem: NavItem = {
  href: "/aktivitas-warga",
  label: "Aktivitas",
  icon: Activity,
  mobileLabel: "Aktif",
};

const STAFF_NAV_HREFS = new Set(["/pengumuman", "/kegiatan", "/pengaduan"]);

const REGISTRY_NAV_HREFS = new Set([
  "/dashboard",
  "/info-warga",
  "/data-warga",
  "/aktivitas-warga",
  "/jasa",
]);

const FINANCE_HREFS = new Set(["/iuran", "/keuangan"]);

export function getNavItemsForAccess(opts: {
  surface: AppSurface;
  isAdmin: boolean;
  isStaff: boolean;
  isRegistryOnly?: boolean;
}): NavItem[] {
  const { surface, isAdmin, isStaff, isRegistryOnly = false } = opts;

  if (surface === "landing") {
    return [];
  }

  if (surface === "ops" && isRegistryOnly && !isAdmin) {
    const base = portalNavItems.filter((item) =>
      REGISTRY_NAV_HREFS.has(item.href)
    );
    return [...base, dataWargaNavItem, aktivitasWargaNavItem];
  }

  if (surface === "ops" && isStaff && !isAdmin) {
    return portalNavItems.filter((item) => STAFF_NAV_HREFS.has(item.href));
  }

  if (surface === "ops" && isAdmin) {
    const items = [...portalNavItems];
    const infoIdx = items.findIndex((i) => i.href === "/info-warga");
    const extras = [dataWargaNavItem, aktivitasWargaNavItem];
    if (infoIdx >= 0) {
      items.splice(infoIdx + 1, 0, ...extras);
    } else {
      items.push(...extras);
    }
    return items;
  }

  if (surface === "portal") {
    return portalNavItems;
  }

  return portalNavItems.filter((item) => !FINANCE_HREFS.has(item.href));
}
