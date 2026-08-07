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
  { href: "/info-security", label: "Info Security", icon: Shield, mobileLabel: "Security" },
  { href: "/donasi", label: "Donasi", icon: HeartHandshake },
  { href: "/pengaduan", label: "Pengaduan", icon: Megaphone },
  { href: "/cctv", label: "CCTV", icon: Camera },
];

const STAFF_NAV_HREFS = new Set(["/pengumuman", "/kegiatan", "/pengaduan"]);

const FINANCE_HREFS = new Set(["/iuran", "/keuangan"]);

export function getNavItemsForAccess(opts: {
  surface: AppSurface;
  isAdmin: boolean;
  isStaff: boolean;
}): NavItem[] {
  const { surface, isAdmin, isStaff } = opts;

  if (surface === "landing") {
    return [];
  }

  if (surface === "ops" && isStaff && !isAdmin) {
    return portalNavItems.filter((item) => STAFF_NAV_HREFS.has(item.href));
  }

  if (surface === "ops" && isAdmin) {
    return portalNavItems;
  }

  if (surface === "portal") {
    return portalNavItems;
  }

  return portalNavItems.filter((item) => !FINANCE_HREFS.has(item.href));
}
