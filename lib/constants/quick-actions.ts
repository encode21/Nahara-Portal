import {
  Bell,
  CalendarDays,
  Megaphone,
  Siren,
  type LucideIcon,
} from "lucide-react";

export type QuickActionTone = "danger" | "gold" | "slate" | "blue";

export type QuickAction = {
  href: string;
  label: string;
  hint: string;
  icon: LucideIcon;
  tone: QuickActionTone;
};

/** Shortcuts only — open existing modules (except Darurat prototype). */
export const QUICK_ACTIONS: QuickAction[] = [
  {
    href: "/darurat",
    label: "Darurat",
    hint: "Bantuan cepat",
    icon: Siren,
    tone: "danger",
  },
  {
    href: "/pengumuman",
    label: "Pengumuman",
    hint: "Info warga",
    icon: Bell,
    tone: "gold",
  },
  {
    href: "/kegiatan",
    label: "Kegiatan",
    hint: "Agenda",
    icon: CalendarDays,
    tone: "slate",
  },
  {
    href: "/pengaduan",
    label: "Pengaduan",
    hint: "Lapor warga",
    icon: Megaphone,
    tone: "blue",
  },
];

export const QUICK_ACTION_TONE_CLASS: Record<QuickActionTone, string> = {
  danger: "bg-red-50 text-red-600 ring-red-100",
  gold: "bg-gold-light text-gold-dark ring-gold/20",
  slate: "bg-sand-100 text-ink-soft ring-sand-200",
  blue: "bg-sky-50 text-sky-700 ring-sky-100",
};
