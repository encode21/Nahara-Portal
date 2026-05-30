"use client";

import { useMemo, useState } from "react";
import { KAVLING_PATHS, SITEPLAN_VIEWBOX } from "@/lib/constants/kavling-paths";
import { normalizeBlokKey } from "@/lib/constants/cluster-layout";
import type { WargaWithIuran } from "@/lib/types";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export interface PetaLingkunganProps {
  wargaData: WargaWithIuran[];
  onHouseClick: (blok: string, warga?: WargaWithIuran) => void;
}

const LEGEND = [
  { label: "Tetap + Lunas", fill: "#0a2a1f", stroke: "#00d4aa" },
  { label: "Belum Bayar", fill: "#2a0a0a", stroke: "#ef4444" },
  { label: "Kontrak", fill: "#2a1f0a", stroke: "#f97316" },
  { label: "Kosong", fill: "#1e2235", stroke: "#3a3f55" },
];

function getHouseStyle(warga?: WargaWithIuran, isHovered?: boolean): { fill: string; stroke: string } {
  let base = { fill: "#1e2235", stroke: "#3a3f55" };

  if (warga) {
    if (warga.status_hunian === "Kontrak") {
      base = { fill: "#2a1f0a", stroke: "#f97316" };
    } else if (warga.iuran_lunas) {
      base = { fill: "#0a2a1f", stroke: "#00d4aa" };
    } else {
      base = { fill: "#2a0a0a", stroke: "#ef4444" };
    }
  }

  if (isHovered) {
    return {
      ...base,
      fill: base.fill === "#1e2235" ? "#282e48" : base.fill,
    };
  }
  return base;
}

function getIuranLabel(warga?: WargaWithIuran): string {
  if (!warga || warga.status_hunian === "Kosong") return "Kosong";
  return warga.iuran_lunas ? "Lunas" : "Belum Bayar";
}

export default function PetaLingkunganVector({ wargaData, onHouseClick }: PetaLingkunganProps) {
  const [hoveredBlok, setHoveredBlok] = useState<string | null>(null);

  const wargaMap = useMemo(() => {
    const m = new Map<string, WargaWithIuran>();
    wargaData.forEach((w) => m.set(normalizeBlokKey(w.blok), w));
    return m;
  }, [wargaData]);

  const { width, height } = SITEPLAN_VIEWBOX;

  return (
    <TooltipProvider delayDuration={150}>
      <div className="flex h-full w-full flex-col gap-4 rounded-xl border border-slate-800 bg-slate-950 p-4">
        <div className="flex flex-wrap items-center gap-6 border-b border-slate-800 pb-4 text-xs">
          {LEGEND.map((item) => (
            <span key={item.label} className="flex items-center gap-2 font-medium text-slate-300">
              <span
                className="inline-block h-4 w-6 rounded border transition-all duration-200"
                style={{
                  backgroundColor: item.fill,
                  borderColor: item.stroke,
                  boxShadow: `0 0 4px ${item.stroke}40`,
                }}
              />
              {item.label}
            </span>
          ))}
        </div>

        <div className="custom-scrollbar relative flex items-center justify-center overflow-x-auto rounded-lg bg-[#0b0f19] p-4">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="h-auto w-full max-w-full select-none transition-all"
            role="img"
            aria-label="Peta lingkungan perumahan Tahap 3"
          >
            <g id="Kavling-Perumahan">
              {Object.entries(KAVLING_PATHS).map(([blokKey, pathData]) => {
                const warga = wargaMap.get(blokKey);
                const isHovered = hoveredBlok === blokKey;
                const style = getHouseStyle(warga, isHovered);
                const isRC = blokKey.startsWith("RC");

                return (
                  <Tooltip key={blokKey}>
                    <TooltipTrigger asChild>
                      <path
                        d={pathData.d}
                        fill={isRC ? "#065f46" : style.fill}
                        stroke={isRC ? "#34d399" : style.stroke}
                        strokeWidth={isHovered ? 2.5 : 1.2}
                        className="cursor-pointer outline-none transition-all duration-150"
                        style={{
                          filter: isHovered
                            ? `drop-shadow(0px 0px 6px ${isRC ? "#34d399" : style.stroke}aa)`
                            : "none",
                        }}
                        onMouseEnter={() => setHoveredBlok(blokKey)}
                        onMouseLeave={() => setHoveredBlok(null)}
                        onClick={() => onHouseClick(blokKey, warga)}
                        tabIndex={0}
                        role="button"
                        aria-label={`Blok ${pathData.label}`}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            onHouseClick(blokKey, warga);
                          }
                        }}
                      />
                    </TooltipTrigger>

                    <TooltipContent
                      className="rounded-lg border border-slate-700 bg-slate-900 p-3 text-slate-100 shadow-xl"
                      side="top"
                    >
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-amber-400">{pathData.label}</p>
                        {isRC ? (
                          <p className="text-xs text-emerald-400">Fasilitas Umum / Green Zone</p>
                        ) : warga ? (
                          <>
                            <p className="text-xs font-medium text-slate-200">{warga.nama}</p>
                            <div className="mt-1 flex items-center gap-1.5 text-[11px]">
                              <span className="rounded border border-slate-700 bg-slate-800 px-1.5 py-0.5 text-slate-300">
                                {warga.status_hunian}
                              </span>
                              <span
                                className={`rounded border px-1.5 py-0.5 ${
                                  warga.iuran_lunas
                                    ? "border-emerald-800 bg-emerald-950/50 text-emerald-400"
                                    : "border-rose-800 bg-rose-950/50 text-rose-400"
                                }`}
                              >
                                Iuran: {getIuranLabel(warga)}
                              </span>
                            </div>
                          </>
                        ) : (
                          <p className="text-xs italic text-slate-400">Rumah Kosong / Belum Terdata</p>
                        )}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </g>
          </svg>
        </div>
      </div>
    </TooltipProvider>
  );
}

export { PetaLingkunganVector };
