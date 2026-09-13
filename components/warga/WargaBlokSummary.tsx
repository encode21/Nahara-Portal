"use client";

import { useMemo } from "react";
import type { Warga } from "@/lib/types";
import { buildBlokHunianSummary } from "@/lib/warga/blok-summary";
import { cn } from "@/lib/utils";

type Props = {
  wargaList: Pick<Warga, "blok_row" | "status_hunian">[];
  /** Saat diisi, klik blok mengaktifkan filter */
  activeBlok?: string;
  onSelectBlok?: (blokRow: string) => void;
};

export function WargaBlokSummary({
  wargaList,
  activeBlok = "",
  onSelectBlok,
}: Props) {
  const rows = useMemo(() => buildBlokHunianSummary(wargaList), [wargaList]);

  const totals = useMemo(() => {
    return rows.reduce(
      (acc, r) => {
        acc.units += r.units;
        acc.terdaftar += r.terdaftar;
        acc.tinggal += r.tinggal;
        acc.kosong += r.kosong;
        return acc;
      },
      { units: 0, terdaftar: 0, tinggal: 0, kosong: 0 },
    );
  }, [rows]);

  const nht = rows.filter((r) => r.side === "NHT");
  const nhb = rows.filter((r) => r.side === "NHB");

  return (
    <section className="glass-card space-y-3 !p-3.5 sm:!p-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-ink">Ringkasan blok</h2>
          <p className="mt-0.5 text-[11px] text-ink-faint">
            Tinggal = Tetap + Kontrak · Terdaftar = entri registry · Unit =
            kavling siteplan
          </p>
        </div>
        <p className="text-[11px] tabular-nums text-ink-soft">
          <span className="font-semibold text-ink">{totals.tinggal}</span> tinggal
          <span className="mx-1.5 text-sand-300">·</span>
          <span className="font-semibold text-ink">{totals.terdaftar}</span>{" "}
          terdaftar
          <span className="mx-1.5 text-sand-300">·</span>
          {totals.units} unit
        </p>
      </div>

      <SideStrip
        label="NHT · Nahara Timur"
        rows={nht}
        activeBlok={activeBlok}
        onSelectBlok={onSelectBlok}
      />
      <SideStrip
        label="NHB · Nahara Barat"
        rows={nhb}
        activeBlok={activeBlok}
        onSelectBlok={onSelectBlok}
      />
    </section>
  );
}

function SideStrip({
  label,
  rows,
  activeBlok,
  onSelectBlok,
}: {
  label: string;
  rows: ReturnType<typeof buildBlokHunianSummary>;
  activeBlok: string;
  onSelectBlok?: (blokRow: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
        {label}
      </p>
      <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-6">
        {rows.map((r) => {
          const active = activeBlok === r.blokRow;
          const clickable = !!onSelectBlok;
          const fill =
            r.units > 0 ? Math.min(100, Math.round((r.tinggal / r.units) * 100)) : 0;
          const Tag = clickable ? "button" : "div";
          return (
            <Tag
              key={r.blokRow}
              type={clickable ? "button" : undefined}
              onClick={
                clickable
                  ? () =>
                      onSelectBlok!(
                        activeBlok === r.blokRow ? "" : r.blokRow,
                      )
                  : undefined
              }
              className={cn(
                "relative overflow-hidden rounded-lg border px-1.5 py-1.5 text-left transition-colors",
                active
                  ? "border-gold/50 bg-gold/10"
                  : "border-sand-200 bg-white/80",
                clickable && "hover:border-gold/40 hover:bg-sand-50",
              )}
              title={`${r.blokRow}: ${r.tinggal} tinggal, ${r.terdaftar} terdaftar, ${r.units} unit`}
            >
              <span
                className="pointer-events-none absolute inset-x-0 bottom-0 h-0.5 bg-gold/70"
                style={{ width: `${fill}%` }}
                aria-hidden
              />
              <span className="block text-[10px] font-semibold text-ink">
                {r.rowNum}
              </span>
              <span className="mt-0.5 block text-[11px] font-semibold tabular-nums leading-none text-ink">
                {r.tinggal}
                <span className="font-normal text-ink-faint">/{r.units}</span>
              </span>
              <span className="mt-0.5 block text-[9px] tabular-nums text-ink-faint">
                {r.terdaftar} daftar
              </span>
            </Tag>
          );
        })}
      </div>
    </div>
  );
}
