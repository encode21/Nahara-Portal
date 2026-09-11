import Link from "next/link";
import { Siren, type LucideIcon } from "lucide-react";
import { portalNavItems } from "@/lib/constants/nav";

type Group = {
  title: string;
  items: { href: string; label: string; icon?: LucideIcon }[];
};

function buildGroups(): Group[] {
  const byHref = new Map(portalNavItems.map((i) => [i.href, i]));
  const pick = (href: string) => {
    const item = byHref.get(href);
    if (!item) return null;
    return { href: item.href, label: item.label, icon: item.icon };
  };

  return [
    {
      title: "Informasi",
      items: ["/pengumuman", "/info-warga", "/info-security"]
        .map(pick)
        .filter(Boolean) as Group["items"],
    },
    {
      title: "Komunitas",
      items: ["/kegiatan", "/jasa", "/donasi"]
        .map(pick)
        .filter(Boolean) as Group["items"],
    },
    {
      title: "Administrasi",
      items: ["/iuran", "/keuangan"].map(pick).filter(Boolean) as Group["items"],
    },
    {
      title: "Keamanan & laporan",
      items: [
        ...(["/pengaduan", "/cctv"].map(pick).filter(Boolean) as Group["items"]),
        { href: "/darurat", label: "Darurat", icon: Siren },
      ],
    },
  ];
}

export function AllServicesGrid({
  showTitle = true,
  showBrowseLink = true,
}: {
  showTitle?: boolean;
  showBrowseLink?: boolean;
}) {
  const groups = buildGroups();

  return (
    <section>
      {(showTitle || showBrowseLink) && (
        <div className="mb-3 flex items-end justify-between gap-3">
          {showTitle ? (
            <h2 className="section-title mb-0">Layanan warga</h2>
          ) : (
            <span />
          )}
          {showBrowseLink && (
            <Link
              href="/layanan"
              className="text-xs font-medium text-gold-dark hover:underline"
            >
              Semua layanan
            </Link>
          )}
        </div>
      )}

      <div className="space-y-5">
        {groups.map((group) => (
          <div key={group.title}>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-faint">
              {group.title}
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="surface-tile flex items-center gap-2.5 px-3 py-3"
                  >
                    <span
                      className={
                        item.href === "/darurat"
                          ? "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600"
                          : "icon-badge h-9 w-9"
                      }
                    >
                      {Icon && <Icon className="h-4 w-4" />}
                    </span>
                    <span className="truncate text-sm font-medium text-ink">
                      {item.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
