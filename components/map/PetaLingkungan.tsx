"use client";

import { useMemo } from "react";
import {
  SITEPLAN_ROWS,
  SITEPLAN_DIMS,
  TIPE_COLORS,
  SITEPLAN_SCALE,
  getLotWidth,
  getRowHeight,
  getCanvasSize,
  getGangLeft,
  getNhtStart,
  getMaxRowWidth,
  rowY,
  getLotX,
  formatBlok,
  getLotsForDeret,
  normalizeBlokKey,
  type SiteplanRow,
} from "@/lib/constants/cluster-layout";
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

const STATUS_LEGEND = [
  { label: "Lunas", fill: "#0a2a1f", stroke: "#00d4aa" },
  { label: "Belum Bayar", fill: "#2a0a0a", stroke: "#ef4444" },
  { label: "Kontrak", fill: "#2a1a06", stroke: "#f97316" },
  { label: "Kosong", fill: "#1e2235", stroke: "#3a3f55" },
];

function getHouseStyle(warga?: WargaWithIuran): { fill: string; stroke: string } {
  if (!warga || warga.status_hunian === "Kosong") {
    return { fill: "#1e2235", stroke: "#3a3f55" };
  }
  if (warga.status_hunian === "Kontrak") {
    return { fill: "#2a1a06", stroke: "#f97316" };
  }
  if (warga.iuran_lunas) {
    return { fill: "#0a2a1f", stroke: "#00d4aa" };
  }
  return { fill: "#2a0a0a", stroke: "#ef4444" };
}

function getIuranLabel(warga?: WargaWithIuran): string {
  if (!warga || warga.status_hunian === "Kosong") return "Kosong";
  return warga.iuran_lunas ? "Lunas" : "Belum Bayar";
}

type LotRectProps = {
  x: number;
  y: number;
  width: number;
  height: number;
  lotNum: number;
  blokKey: string;
  warga?: WargaWithIuran;
  onHouseClick: (blok: string, warga?: WargaWithIuran) => void;
};

function LotRect({ x, y, width, height, lotNum, blokKey, warga, onHouseClick }: LotRectProps) {
  const style = getHouseStyle(warga);
  const showNum = width >= 10 * SITEPLAN_SCALE;
  const fontSize = Math.min(8, Math.max(5, width / 3.5)) * SITEPLAN_SCALE;

  function handleActivate() {
    onHouseClick(blokKey, warga);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleActivate();
    }
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <g
          tabIndex={0}
          role="button"
          aria-label={`Kavling ${blokKey}`}
          className="cursor-pointer outline-none focus:opacity-80"
          onClick={handleActivate}
          onKeyDown={handleKeyDown}
        >
          <rect
            x={x}
            y={y + 1}
            width={width}
            height={height - 2}
            rx={2}
            fill={style.fill}
            stroke={style.stroke}
            strokeWidth={1}
            className="transition-opacity hover:opacity-80"
          />
          {showNum && (
            <text
              x={x + width / 2}
              y={y + height / 2 + 1}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="rgba(255,255,255,0.45)"
              fontSize={fontSize}
              pointerEvents="none"
            >
              {lotNum}
            </text>
          )}
        </g>
      </TooltipTrigger>
      <TooltipContent side="top">
        <p className="font-semibold text-teal">{blokKey}</p>
        {warga ? (
          <>
            <p className="mt-0.5 text-slate-200">{warga.nama}</p>
            <p className="text-slate-400">
              {warga.status_hunian} · Iuran {getIuranLabel(warga)}
            </p>
          </>
        ) : (
          <p className="mt-0.5 text-slate-400">Kosong</p>
        )}
      </TooltipContent>
    </Tooltip>
  );
}

function SiteplanRowGroup({
  row,
  wargaMap,
  onHouseClick,
}: {
  row: SiteplanRow;
  wargaMap: Map<string, WargaWithIuran>;
  onHouseClick: (blok: string, warga?: WargaWithIuran) => void;
}) {
  const lw = getLotWidth(row.tipe);
  const y = rowY(row.rowNum);
  const deretH = SITEPLAN_DIMS.LOT_H;
  const innerH = SITEPLAN_DIMS.INNER_H;
  const rowH = getRowHeight();
  const gap = SITEPLAN_DIMS.GAP;
  const ganjilLots = getLotsForDeret(row.side, row.maxLotNo, "ganjil");
  const genapLots = getLotsForDeret(row.side, row.maxLotNo, "genap");
  const rowSlotCount = Math.max(ganjilLots.length, genapLots.length);
  const unitCount = ganjilLots.length + genapLots.length;
  const rowW = rowSlotCount * (lw + gap) - gap;
  const xStart = row.side === "NHB" ? getGangLeft() - rowW : getNhtStart();
  const tipeColor = TIPE_COLORS[row.tipe];

  const lots = [
    ...genapLots.map((lot) => ({ ...lot, deret: "genap" as const })),
    ...ganjilLots.map((lot) => ({ ...lot, deret: "ganjil" as const })),
  ];

  return (
    <g>
      {/* Tipe accent background */}
      <rect x={xStart} y={y} width={rowW} height={rowH} fill={tipeColor.bg} fillOpacity={0.27} />

      {/* Jalan internal */}
      <rect
        x={xStart}
        y={y + deretH}
        width={rowW}
        height={innerH}
        fill="#16120a"
        stroke="#2a2010"
        strokeWidth={0.5}
      />

      {/* Jalan antar-row */}
      {row.rowNum > 1 && (
        <rect
          x={xStart}
          y={y + rowH}
          width={rowW}
          height={SITEPLAN_DIMS.ROW_SEP}
          fill="#130f08"
        />
      )}

      {lots.map(({ num, positionIndex, deret }) => {
        const lx = getLotX(row.side, positionIndex, lw);
        const ly = deret === "genap" ? y : y + deretH + innerH;
        const blokKey = formatBlok(row.id, num);
        const warga = wargaMap.get(blokKey);
        return (
          <LotRect
            key={blokKey}
            x={lx}
            y={ly}
            width={lw}
            height={deretH}
            lotNum={num}
            blokKey={blokKey}
            warga={warga}
            onHouseClick={onHouseClick}
          />
        );
      })}

      {/* Row label */}
      {row.side === "NHB" ? (
        <>
          <text
            x={xStart - 4}
            y={y + rowH / 2 - 4}
            textAnchor="end"
            fill="#666"
            fontSize={9 * SITEPLAN_SCALE}
            fontWeight={600}
          >
            {row.id}
          </text>
          <text
            x={xStart - 4}
            y={y + rowH / 2 + 8}
            textAnchor="end"
            fill={tipeColor.border}
            fontSize={8 * SITEPLAN_SCALE}
          >
            {tipeColor.label} · {unitCount} unit
          </text>
        </>
      ) : (
        <>
          <text
            x={xStart + rowW + 4}
            y={y + rowH / 2 - 4}
            textAnchor="start"
            fill="#666"
            fontSize={9 * SITEPLAN_SCALE}
            fontWeight={600}
          >
            {row.id}
          </text>
          <text
            x={xStart + rowW + 4}
            y={y + rowH / 2 + 8}
            textAnchor="start"
            fill={tipeColor.border}
            fontSize={8 * SITEPLAN_SCALE}
          >
            {tipeColor.label} · {unitCount} unit
          </text>
        </>
      )}
    </g>
  );
}

export default function PetaLingkungan({ wargaData, onHouseClick }: PetaLingkunganProps) {
  const wargaMap = useMemo(() => {
    const m = new Map<string, WargaWithIuran>();
    wargaData.forEach((w) => m.set(normalizeBlokKey(w.blok), w));
    return m;
  }, [wargaData]);

  const { width: canvasW, height: canvasH } = getCanvasSize();
  const gangLeft = getGangLeft();
  const nhtStart = getNhtStart();
  const maxRowW = getMaxRowWidth();
  const labelCol = SITEPLAN_DIMS.LABEL_COL;

  return (
    <TooltipProvider delayDuration={200}>
      <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
        {STATUS_LEGEND.map((item) => (
          <span key={item.label} className="flex items-center gap-1.5 text-slate-500">
            <span
              className="inline-block h-3.5 w-3.5 rounded-sm border-[1.5px]"
              style={{ backgroundColor: item.fill, borderColor: item.stroke }}
            />
            {item.label}
          </span>
        ))}
        <span className="mx-1 text-slate-600">|</span>
        {(Object.keys(TIPE_COLORS) as Array<keyof typeof TIPE_COLORS>).map((t) => {
          const c = TIPE_COLORS[t];
          return (
            <span key={t} className="flex items-center gap-1.5 text-slate-500">
              <span
                className="inline-block h-3.5 w-3.5 rounded-sm border-[1.5px]"
                style={{ backgroundColor: c.bg, borderColor: c.border }}
              />
              {c.label}
            </span>
          );
        })}
      </div>

      <div className="overflow-x-auto overflow-y-auto rounded-lg border border-slate-200 bg-[#0d1117] p-2">
        <svg
          viewBox={`0 0 ${canvasW} ${canvasH}`}
          className="block min-w-[700px]"
          style={{ width: canvasW, height: canvasH }}
        >
          <rect width={canvasW} height={canvasH} fill="#0d1117" />

          {/* North arrow */}
          <text
            x={canvasW / 2}
            y={16 * SITEPLAN_SCALE}
            textAnchor="middle"
            fill="#444"
            fontSize={10 * SITEPLAN_SCALE}
            fontWeight="bold"
          >
            ↑ U
          </text>

          {/* Block labels */}
          <text
            x={gangLeft / 2 + labelCol / 4}
            y={14 * SITEPLAN_SCALE}
            textAnchor="middle"
            fill="#555"
            fontSize={10 * SITEPLAN_SCALE}
            fontWeight={600}
          >
            NAHARA BARAT
          </text>
          <text
            x={nhtStart + maxRowW / 2}
            y={14 * SITEPLAN_SCALE}
            textAnchor="middle"
            fill="#555"
            fontSize={10 * SITEPLAN_SCALE}
            fontWeight={600}
          >
            NAHARA TIMUR
          </text>

          {/* Gang utama */}
          <rect
            x={gangLeft}
            y={SITEPLAN_DIMS.TOP_PAD - 4}
            width={SITEPLAN_DIMS.GANG_W}
            height={canvasH - SITEPLAN_DIMS.TOP_PAD}
            fill="#16120a"
            stroke="#2a2010"
            strokeWidth={0.5}
            rx={3}
          />
          <text
            x={gangLeft + SITEPLAN_DIMS.GANG_W / 2}
            y={canvasH / 2}
            textAnchor="middle"
            fill="#3a3020"
            fontSize={8 * SITEPLAN_SCALE}
            transform={`rotate(-90 ${gangLeft + SITEPLAN_DIMS.GANG_W / 2} ${canvasH / 2})`}
          >
            GANG NAHARA
          </text>

          {SITEPLAN_ROWS.map((row) => (
            <SiteplanRowGroup
              key={row.id}
              row={row}
              wargaMap={wargaMap}
              onHouseClick={onHouseClick}
            />
          ))}
        </svg>
      </div>

      <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
        Deret atas = genap · deret bawah = ganjil · No. 1/2 di Timur · tanpa 4, 13, dan 40–49 · Row 8
        (utara) → Row 1 (selatan)
      </p>
    </TooltipProvider>
  );
}

export { PetaLingkungan };
