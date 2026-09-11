import Link from "next/link";
import {
  AlertTriangle,
  Bell,
  CalendarDays,
  CloudRain,
  Megaphone,
  type LucideIcon,
} from "lucide-react";
import { formatShortDate } from "@/lib/utils";

export type HariIniItem = {
  id: string;
  href: string;
  title: string;
  meta: string;
  kind: "emergency" | "warning" | "pengumuman" | "kegiatan" | "pengaduan" | "info";
};

const kindIcon: Record<HariIniItem["kind"], LucideIcon> = {
  emergency: AlertTriangle,
  warning: CloudRain,
  pengumuman: Bell,
  kegiatan: CalendarDays,
  pengaduan: Megaphone,
  info: Bell,
};

const kindTone: Record<HariIniItem["kind"], string> = {
  emergency: "bg-red-50 text-red-600",
  warning: "bg-amber-50 text-amber-800",
  pengumuman: "bg-gold-light text-gold-dark",
  kegiatan: "bg-violet-50 text-violet-700",
  pengaduan: "bg-sky-50 text-sky-700",
  info: "bg-sand-100 text-ink-soft",
};

type Props = {
  items: HariIniItem[];
};

export function HariIniFeed({ items }: Props) {
  return (
    <section>
      <div className="mb-3 flex items-end justify-between gap-3">
        <h2 className="section-title mb-0">Hari ini di Nahara</h2>
        <Link
          href="/pengumuman"
          className="text-xs font-medium text-gold-dark hover:underline"
        >
          Lihat semua
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-sand-200 bg-sand-50/80 px-4 py-6 text-center">
          <p className="text-sm text-ink-soft">
            Belum ada item prioritas untuk hari ini.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => {
            const Icon = kindIcon[item.kind];
            const external = item.href.startsWith("http");
            const className =
              "flex items-start gap-3 rounded-2xl border border-sand-200 bg-white px-3.5 py-3 shadow-soft transition hover:border-gold/35";
            const body = (
              <>
                <span
                  className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${kindTone[item.kind]}`}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-ink">
                    {item.title}
                  </span>
                  <span className="mt-0.5 block text-xs text-ink-faint">
                    {item.meta}
                  </span>
                </span>
              </>
            );
            return (
              <li key={item.id}>
                {external ? (
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={className}
                  >
                    {body}
                  </a>
                ) : (
                  <Link href={item.href} className={className}>
                    {body}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

export function formatFeedDate(iso: string): string {
  return formatShortDate(iso);
}
