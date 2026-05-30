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
