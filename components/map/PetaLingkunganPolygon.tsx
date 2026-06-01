"use client";

import { useMemo } from "react";
import { normalizeBlokKey } from "@/lib/constants/cluster-layout";
import { SITEPLAN_IMAGE, SITEPLAN_RC_BOUNDS } from "@/lib/constants/siteplan-blocks";
import type { WargaWithIuran } from "@/lib/types";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export interface PetaLingkunganProps {
  wargaData: WargaWithIuran[];
  onHouseClick: (blok: string, warga?: WargaWithIuran) => void;
}

type Point = [number, number];
type LotPoly = { blokKey: string; unit: string; points: Point[]; isRC?: boolean };
type RowDef = {
  blok: string;
  units: string[];
  tl: Point;
  tr: Point;
  br: Point;
  bl: Point;
};

const STATUS_LEGEND = [
  { label: "Lunas", fill: "#0a2a1f", stroke: "#00d4aa" },
  { label: "Belum Bayar", fill: "#2a0a0a", stroke: "#ef4444" },
  { label: "Kontrak", fill: "#2a1a06", stroke: "#f97316" },
  { label: "Kosong", fill: "#1e2235", stroke: "#3a3f55" },
];

// Coordinate system mengikuti file siteplan asli: viewBox 0 0 1236 1188.
// Setiap unit dibuat sebagai POLYGON, bukan bounding box rect.
// Untuk baris miring/melengkung, titik kiri-kanan row dibuat trapezoid supaya overlay ikut bentuk kavling.
const ROWS: RowDef[] = [
  // Top boulevard rows
  { blok: "NAHARA BARAT 8", units: ["30","28","26","22","20","18","16","12","10","8","2"], tl: [58, 18], tr: [502, 18], br: [502, 91], bl: [58, 91] },
  { blok: "NAHARA TIMUR 8", units: ["56","52","50","38","36","32","30","28","26","20","18","16","16","10","8","6","2"], tl: [520, 18], tr: [1170, 18], br: [1170, 92], bl: [520, 92] },

  // Barat 8 / Timur 8 inner rows
  { blok: "NAHARA BARAT 8", units: ["23","21","19","17","15","11","9","7","5","1"], tl: [72, 127], tr: [498, 127], br: [498, 212], bl: [72, 212] },
  { blok: "NAHARA BARAT 8", units: ["20","18","16","12","10","8","6","2"], tl: [72, 212], tr: [498, 212], br: [498, 289], bl: [72, 289] },
  { blok: "NAHARA TIMUR 8", units: ["35","33","31","29","27","25","23","21","19","17","15","11","9","7","5","3","1"], tl: [525, 127], tr: [1145, 127], br: [1145, 212], bl: [525, 212] },
  { blok: "NAHARA TIMUR 8", units: ["32","30","28","26","22","20","18","16","12","10","8","6","2"], tl: [525, 212], tr: [1145, 212], br: [1145, 289], bl: [525, 289] },

  // Barat 7 / Timur 7
  { blok: "NAHARA BARAT 7", units: ["17","15","11","9","7","5","3","1"], tl: [80, 322], tr: [500, 322], br: [500, 408], bl: [80, 408] },
  { blok: "NAHARA BARAT 7", units: ["20","18","16","12","10","8","6","2"], tl: [80, 408], tr: [500, 408], br: [500, 486], bl: [80, 486] },
  { blok: "NAHARA TIMUR 7", units: ["21","19","17","15","11","9","7","5","1"], tl: [525, 322], tr: [1098, 322], br: [1098, 408], bl: [525, 408] },
  { blok: "NAHARA TIMUR 7", units: ["26","22","20","18","16","12","10","8","2"], tl: [525, 408], tr: [1098, 408], br: [1098, 487], bl: [525, 487] },

  // Barat 6 / Timur 6
  { blok: "NAHARA BARAT 6", units: ["17","15","11","9","7","5","3","1"], tl: [81, 520], tr: [500, 520], br: [500, 604], bl: [82, 604] },
  { blok: "NAHARA BARAT 6", units: ["28","26","22","20","18","16","12","10","8","2"], tl: [82, 604], tr: [500, 604], br: [500, 682], bl: [86, 682] },
  { blok: "NAHARA TIMUR 6", units: ["25","23","21","19","17","15","11","9","5"], tl: [525, 520], tr: [1090, 520], br: [1090, 604], bl: [525, 604] },
  { blok: "NAHARA TIMUR 6", units: ["50","38","36","32","30","28","26","20","18","16","12","10","8","2"], tl: [525, 604], tr: [1090, 604], br: [1090, 683], bl: [525, 683] },

  // Barat 3 / Timur 3
  { blok: "NAHARA BARAT 3", units: ["21","19","17","15","11","9","5","3","1"], tl: [105, 715], tr: [500, 715], br: [500, 793], bl: [115, 793] },
  { blok: "NAHARA BARAT 3", units: ["32","38","26","22","20","18","16","12","10","8","2"], tl: [115, 793], tr: [500, 793], br: [500, 870], bl: [140, 870] },
  { blok: "NAHARA TIMUR 3", units: ["23","21","19","17","15","11","9","7","5"], tl: [525, 715], tr: [985, 715], br: [985, 793], bl: [525, 793] },
  { blok: "NAHARA TIMUR 3", units: ["36","32","30","28","26","22","20","18","16","12","10","8","2"], tl: [525, 793], tr: [1140, 793], br: [1140, 870], bl: [525, 870] },

  // Barat 2 / Timur 2
  { blok: "NAHARA BARAT 2", units: ["23","21","19","15","11","9","7","5","3"], tl: [158, 904], tr: [505, 904], br: [505, 984], bl: [177, 984] },
  { blok: "NAHARA BARAT 2", units: ["28","26","22","20","18","16","12","10","8","2"], tl: [177, 984], tr: [505, 984], br: [505, 1062], bl: [193, 1062] },
  { blok: "NAHARA TIMUR 2", units: ["19","17","15","11","9","7","5","3"], tl: [525, 904], tr: [850, 904], br: [825, 984], bl: [525, 984] },
  { blok: "NAHARA TIMUR 2", units: ["22","20","18","16","12","10","8","6"], tl: [525, 984], tr: [825, 984], br: [800, 1062], bl: [525, 1062] },

  // Barat 1 / Timur 1 visible bottom rows
  { blok: "NAHARA BARAT 1", units: ["23","21","19","17","15","11","3","5","3"], tl: [198, 1098], tr: [506, 1098], br: [506, 1180], bl: [214, 1180] },
  { blok: "NAHARA TIMUR 1", units: ["19","17","15","11","9","7","5","3"], tl: [525, 1098], tr: [805, 1098], br: [792, 1180], bl: [525, 1180] },
];

const RC_POLYS: LotPoly[] = [
  { blokKey: "RC-TIMUR-6", unit: "RC", isRC: true, points: [[950, 520], [1090, 520], [1090, 604], [950, 604]] },
  { blokKey: "RC-TIMUR-3-A", unit: "RC", isRC: true, points: [[930, 715], [985, 715], [985, 793], [930, 793]] },
  { blokKey: "RC-TIMUR-3-B", unit: "RC", isRC: true, points: [[875, 793], [1140, 793], [1140, 870], [875, 870]] },
  { blokKey: "ROW-12", unit: "ROW 12", isRC: true, points: [[1210, 155], [1280, 155], [1280, 490], [1210, 490]] },
  { blokKey: "ROW-9", unit: "ROW 9", isRC: true, points: [[1210, 625], [1280, 625], [1280, 728], [1210, 728]] },
];

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function interp(a: Point, b: Point, t: number): Point {
  return [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];
}

function rowToLots(row: RowDef): LotPoly[] {
  const n = row.units.length;
  return row.units.map((unit, index) => {
    const a = index / n;
    const b = (index + 1) / n;
    return {
      blokKey: `${row.blok} ${unit}`,
      unit,
      points: [
        interp(row.tl, row.tr, a),
        interp(row.tl, row.tr, b),
        interp(row.bl, row.br, b),
        interp(row.bl, row.br, a),
      ],
    };
  });
}

const SITEPLAN_LOT_POLYGONS: LotPoly[] = [...ROWS.flatMap(rowToLots), ...RC_POLYS];

function pointsToString(points: Point[]) {
  return points.map(([x, y]) => `${x},${y}`).join(" ");
}

function getHouseStyle(warga?: WargaWithIuran): { fill: string; stroke: string } {
  if (!warga || warga.status_hunian === "Kosong") return { fill: "#1e2235", stroke: "#3a3f55" };
  if (warga.status_hunian === "Kontrak") return { fill: "#2a1a06", stroke: "#f97316" };
  if (warga.iuran_lunas) return { fill: "#0a2a1f", stroke: "#00d4aa" };
  return { fill: "#2a0a0a", stroke: "#ef4444" };
}

function getIuranLabel(warga?: WargaWithIuran): string {
  if (!warga || warga.status_hunian === "Kosong") return "Kosong";
  return warga.iuran_lunas ? "Lunas" : "Belum Bayar";
}

type LotPolygonProps = LotPoly & {
  warga?: WargaWithIuran;
  onHouseClick: (blok: string, warga?: WargaWithIuran) => void;
};

function LotPolygon({ blokKey, points, warga, isRC, onHouseClick }: LotPolygonProps) {
  const colors = isRC ? { fill: "rgba(6, 95, 70, 0.45)", stroke: "#34d399" } : getHouseStyle(warga);

  function handleActivate() {
    onHouseClick(blokKey, warga);
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <polygon
          points={pointsToString(points)}
          fill={colors.fill}
          fillOpacity={isRC ? 1 : 0.64}
          stroke={colors.stroke}
          strokeWidth={1.2}
          vectorEffect="non-scaling-stroke"
          className="cursor-pointer outline-none transition-opacity hover:fill-opacity-90"
          onClick={handleActivate}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              handleActivate();
            }
          }}
          tabIndex={0}
          role="button"
          aria-label={isRC ? `Fasilitas ${blokKey}` : `Kavling ${blokKey}`}
        />
      </TooltipTrigger>
      <TooltipContent side="top">
        <p className="font-semibold text-teal">{blokKey}</p>
        {isRC ? (
          <p className="mt-0.5 text-slate-400">Fasilitas umum / green zone</p>
        ) : warga ? (
          <>
            <p className="mt-0.5 text-slate-200">{warga.nama}</p>
            <p className="text-slate-400">{warga.status_hunian} · Iuran {getIuranLabel(warga)}</p>
          </>
        ) : (
          <p className="mt-0.5 text-slate-400">Kosong</p>
        )}
      </TooltipContent>
    </Tooltip>
  );
}

export default function PetaLingkungan({ wargaData, onHouseClick }: PetaLingkunganProps) {
  const wargaMap = useMemo(() => {
    const m = new Map<string, WargaWithIuran>();
    wargaData.forEach((w) => m.set(normalizeBlokKey(w.blok), w));
    return m;
  }, [wargaData]);

  const { width, height } = SITEPLAN_IMAGE;

  return (
    <TooltipProvider delayDuration={200}>
      <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
        {STATUS_LEGEND.map((item) => (
          <span key={item.label} className="flex items-center gap-1.5 text-slate-500">
            <span className="inline-block h-3.5 w-3.5 rounded-sm border-[1.5px]" style={{ backgroundColor: item.fill, borderColor: item.stroke }} />
            {item.label}
          </span>
        ))}
      </div>

      <div className="overflow-x-auto overflow-y-auto rounded-lg border border-slate-200 bg-[#f5f5f5] p-2">
        <div className="relative mx-auto w-full leading-[0]" style={{ maxWidth: width }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={SITEPLAN_IMAGE.src}
            alt="Siteplan perumahan Nahara"
            width={width}
            height={height}
            className="block h-auto w-full select-none"
            draggable={false}
          />
          <svg viewBox={`0 0 ${width} ${height}`} className="absolute inset-0 h-full w-full" aria-label="Kavling interaktif">
            {SITEPLAN_LOT_POLYGONS.map((lot) => {
              const warga = lot.isRC ? undefined : wargaMap.get(normalizeBlokKey(lot.blokKey));
              return <LotPolygon key={lot.blokKey} {...lot} warga={warga} onHouseClick={onHouseClick} />;
            })}
          </svg>
        </div>
      </div>

      <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
        Siteplan JPG + polygon overlay per kavling. Edit koordinat di <code className="text-slate-600">ROWS</code> jika perlu fine-tuning pixel.
      </p>
    </TooltipProvider>
  );
}

export { PetaLingkungan, SITEPLAN_LOT_POLYGONS };
