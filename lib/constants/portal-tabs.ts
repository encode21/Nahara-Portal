import {
  Bell,
  CalendarDays,
  Grid2x2,
  Home,
  UserRound,
  type LucideIcon,
} from "lucide-react";

export type PortalPrimaryTab = {
  href: string;
  label: string;
  icon: LucideIcon;
  match: (pathname: string) => boolean;
};

/** Shared primary destinations for portal mobile bottom nav + desktop header. */
export const PORTAL_PRIMARY_TABS: PortalPrimaryTab[] = [
  {
    href: "/dashboard",
    label: "Beranda",
    icon: Home,
    match: (p) => p === "/dashboard" || p === "/",
  },
  {
    href: "/kegiatan",
    label: "Aktivitas",
    icon: CalendarDays,
    match: (p) => p.startsWith("/kegiatan"),
  },
  {
    href: "/layanan",
    label: "Layanan",
    icon: Grid2x2,
    match: (p) =>
      p === "/layanan" ||
      p.startsWith("/layanan/") ||
      // highlight when browsing a module that isn't a primary tab
      [
        "/iuran",
        "/keuangan",
        "/info-warga",
        "/jasa",
        "/info-security",
        "/donasi",
        "/pengaduan",
        "/cctv",
        "/darurat",
        "/panduan",
      ].some((h) => p === h || p.startsWith(`${h}/`)),
  },
  {
    href: "/notifikasi",
    label: "Notifikasi",
    icon: Bell,
    match: (p) => p.startsWith("/notifikasi"),
  },
  {
    href: "/profil",
    label: "Profil",
    icon: UserRound,
    match: (p) => p === "/profil" || p.startsWith("/profil/"),
  },
];
