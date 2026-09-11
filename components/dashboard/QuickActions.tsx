import Link from "next/link";
import {
  Bell,
  CalendarDays,
  Megaphone,
  Shield,
  Wallet,
  type LucideIcon,
} from "lucide-react";

type QuickAction = {
  href: string;
  label: string;
  icon: LucideIcon;
  tone?: "gold" | "danger";
};

/**
 * Pintasan ke modul yang SUDAH ADA — tidak membuat modul baru.
 */
const actions: QuickAction[] = [
  { href: "/pengumuman", label: "Pengumuman", icon: Bell },
  { href: "/kegiatan", label: "Kegiatan", icon: CalendarDays },
  { href: "/iuran", label: "Iuran", icon: Wallet },
  { href: "/pengaduan", label: "Pengaduan", icon: Megaphone },
  { href: "/info-security", label: "Security", icon: Shield, tone: "danger" },
];

export function QuickActions() {
  return (
    <section>
      <h2 className="section-title">Aksi cepat</h2>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 sm:gap-3">
        {actions.map(({ href, label, icon: Icon, tone }) => (
          <Link
            key={href}
            href={href}
            className="surface-tile flex flex-col items-center gap-2 px-2 py-3 text-center"
          >
            <span
              className={
                tone === "danger"
                  ? "flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600"
                  : "icon-badge"
              }
            >
              <Icon className="h-5 w-5" />
            </span>
            <span className="text-xs font-medium text-ink-soft">{label}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
