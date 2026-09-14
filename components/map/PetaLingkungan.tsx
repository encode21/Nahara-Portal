"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { SITEPLAN_LOT_POLYGONS, type LotPoly, type Point } from "@/lib/nahara/provisional-lots";
import { getHouseStyle, statusLabel, approximateType } from "@/lib/nahara/preview-status";

import { BROCHURE_REFERENCE, BROCHURE_TYPE_LEGEND, provisionalIdentityWarning } from "@/lib/nahara/provisional-reference";
import {
  dbBlokToSiteplanLabel,
  normalizeBlokKey,
  siteplanLabelToDbBlok,
} from "@/lib/constants/cluster-layout";
import { SITEPLAN_IMAGE } from "@/lib/constants/siteplan-blocks";
import type { WargaWithIuran } from "@/lib/types";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { MapZoomViewport } from "@/components/map/MapZoomViewport";

const NaharaMap3D = dynamic(() => import("./NaharaMap3D"), {
  ssr: false,
  loading: () => <p className="p-6 text-sm text-slate-500">Memuat 3D · Belum terverifikasi…</p>,
});

export interface PetaLingkunganProps {
  wargaData: WargaWithIuran[];
  onHouseClick: (blok: string, warga?: WargaWithIuran) => void;
}

const STATUS_LEGEND = [
  { label: "Lunas", fill: "#10b981", stroke: "#047857" },
  { label: "Belum Bayar", fill: "#ef4444", stroke: "#b91c1c" },
  { label: "Kontrak", fill: "#f59e0b", stroke: "#b45309" },
  { label: "Kosong", fill: "#334155", stroke: "#475569" },
];

function pointsToString(points: Point[]) {
  return points.map(([x, y]) => `${x},${y}`).join(" ");
}

type LotPolygonProps = {
  lot: LotPoly;
  warga?: WargaWithIuran;
  selected: boolean;
  opacity: number;
  onSelect: () => void;
};

function LotPolygon({ lot, warga, selected, opacity, onSelect }: LotPolygonProps) {
  const address = lot.isRC ? lot.blokKey : siteplanLabelToDbBlok(lot.blokKey);
  const warning = provisionalIdentityWarning(address);
  const colors = lot.isRC
    ? { fill: "#a78bfa", stroke: "#7c3aed" }
    : getHouseStyle(warga);
  const type = approximateType(lot);
  const title = lot.isRC ? "RC · Rumah Contoh" : address;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <polygon
          data-preview-key={lot.lotId}
          data-geometry-verification="unverified"
          points={pointsToString(lot.points)}
          fill={colors.fill}
          fillOpacity={opacity}
          stroke={selected ? "#2563eb" : colors.stroke}
          strokeWidth={selected ? 2.5 : 1}
          strokeDasharray={warning ? "4 2" : undefined}
          vectorEffect="non-scaling-stroke"
          className="cursor-pointer outline-none hover:[fill-opacity:0.5] hover:!stroke-blue-600 focus-visible:!stroke-blue-600 focus-visible:!stroke-[3px]"
          onClick={onSelect}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              onSelect();
            }
          }}
          tabIndex={0}
          role="button"
          aria-pressed={selected}
          aria-label={`${title}, perkiraan belum terverifikasi${warning ? ", konflik penomoran" : ""}`}
        />
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs">
        <p className="font-semibold">{title}</p>
        {type && <p>Tipe {type} · berdasarkan baris, sementara</p>}
        {!lot.isRC && <p>{statusLabel(warga)}</p>}
        {warga && <><p>{warga.nama}</p><p>{warga.status_hunian} · Iuran {warga.iuran_lunas ? "Lunas" : "Belum Bayar"}</p></>}
        <p className="text-xs">Posisi & identitas belum terverifikasi</p>
        {warning && <p className="mt-1 text-amber-300">{warning}</p>}
      </TooltipContent>
    </Tooltip>
  );
}

export default function PetaLingkungan({ wargaData, onHouseClick }: PetaLingkunganProps) {
  const [mode, setMode] = useState<"2d" | "3d">("2d");
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [showOverlay, setShowOverlay] = useState(true);
  const [opacity, setOpacity] = useState(0.25);
  const wargaMap = useMemo(() => {
    const m = new Map<string, WargaWithIuran>();
    wargaData.forEach((w) => {
      m.set(normalizeBlokKey(w.blok), w);
      const label = dbBlokToSiteplanLabel(w.blok);
      if (label) m.set(label, w);
    });
    return m;
  }, [wargaData]);

  function lookupWarga(lot: LotPoly) {
    if (lot.isRC) return undefined;
    return wargaMap.get(lot.blokKey) ??
      wargaMap.get(normalizeBlokKey(siteplanLabelToDbBlok(lot.blokKey)));
  }

  function activateLot(lot: LotPoly) {
    setSelectedKey(lot.lotId);
    const address = lot.isRC ? lot.blokKey : siteplanLabelToDbBlok(lot.blokKey);
    onHouseClick(address, lookupWarga(lot));
  }

  const selected = SITEPLAN_LOT_POLYGONS.find((lot) => lot.lotId === selectedKey);
  const address = selected
    ? selected.isRC ? selected.blokKey : siteplanLabelToDbBlok(selected.blokKey)
    : "";
  const warning = provisionalIdentityWarning(address);
  const resident = selected ? lookupWarga(selected) : undefined;
  const { width, height } = SITEPLAN_IMAGE;

  return (
    <TooltipProvider delayDuration={200}>
      <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-950">
        <p className="font-semibold">Peta perkiraan · Belum terverifikasi</p>
        <p className="mt-1">Batas dan posisi overlay masih perkiraan. Nomor yang tampil berasal dari peta lama; konflik penomoran belum diselesaikan.</p>
      </div>
      <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-600">
        {STATUS_LEGEND.map((item) => (
          <span key={item.label} className="flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded-sm border" style={{ backgroundColor: item.fill, borderColor: item.stroke }} />
            {item.label}
          </span>
        ))}
        <span>Abu muda: data belum tersedia · Ungu: RC / Rumah Contoh</span>
      </div>
      <div className="mb-3 flex gap-2" role="group" aria-label="Tampilan peta">
        <button type="button" aria-pressed={mode === "2d"} onClick={() => setMode("2d")}
          className="min-h-10 rounded border px-4 text-sm aria-pressed:border-blue-600 aria-pressed:bg-blue-50">2D Map</button>
        <button type="button" aria-pressed={mode === "3d"} onClick={() => setMode("3d")}
          className="min-h-10 rounded border px-4 text-sm aria-pressed:border-blue-600 aria-pressed:bg-blue-50">3D Provisional</button>
      </div>
      {mode === "2d" && <div className="mb-3 flex flex-wrap items-center gap-4 text-xs text-slate-600">
        <label className="flex min-h-9 items-center gap-2">
          <input type="checkbox" checked={showOverlay} onChange={(e) => setShowOverlay(e.target.checked)} />
          Tampilkan overlay perkiraan
        </label>
        <label className="flex min-h-9 items-center gap-2">
          Opasitas
          <input aria-label="Opasitas overlay" type="range" min="10" max="60" step="5"
            value={Math.round(opacity * 100)} onChange={(e) => setOpacity(Number(e.target.value) / 100)}
            disabled={!showOverlay} className="w-24" />
          <span className="w-8 tabular-nums">{Math.round(opacity * 100)}%</span>
        </label>
      </div>}
      {mode === "3d" ? (
        <NaharaMap3D lots={SITEPLAN_LOT_POLYGONS} selectedKey={selectedKey}
          lookupWarga={lookupWarga} onSelect={activateLot} onBack={() => setMode("2d")} />
      ) : <MapZoomViewport>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="mx-auto block h-auto w-full"
          style={{ maxWidth: width }}
          aria-label="Peta Nahara dengan overlay perkiraan belum terverifikasi"
        >
          <image href={SITEPLAN_IMAGE.src} width={width} height={height} pointerEvents="none" />
          {showOverlay && SITEPLAN_LOT_POLYGONS.map((lot) => (
            <LotPolygon key={lot.lotId} lot={lot} warga={lookupWarga(lot)}
              selected={lot.lotId === selectedKey} opacity={opacity}
              onSelect={() => activateLot(lot)} />
          ))}
        </svg>
      </MapZoomViewport>}
      {selected && (
        <section aria-label="Pilihan peta sementara" aria-live="polite"
          className="mt-3 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-slate-700">
          <div className="flex items-center justify-between gap-3">
            <p className="font-semibold">{selected.isRC ? "RC · Rumah Contoh" : address}</p>
            <button type="button" className="min-h-10 px-2 text-xs underline" onClick={() => setSelectedKey(null)}>Tutup pilihan</button>
          </div>
          {!selected.isRC && <p>Tipe {approximateType(selected) ?? "belum diketahui"} · acuan baris sementara; Hoek belum dipastikan</p>}
          <p className="mt-1 text-xs">Posisi dan identitas bidang belum terverifikasi.</p>
          {selected.isRC ? (
            <p className="mt-1 text-xs">RC berarti Rumah Contoh pada legenda brosur. Batas area ini masih perkiraan, bukan konfirmasi fasilitas umum.</p>
          ) : (
            <>
              <p className="mt-2">{statusLabel(resident)}</p>
              {resident && <><p className="font-medium">{resident.nama}</p><p>{resident.status_hunian} · Iuran {resident.iuran_lunas ? "Lunas" : "Belum Bayar"}</p><p className="text-xs">Data alamat {resident.blok}; kecocokan dengan bidang peta belum dipastikan.</p></>}
              {warning && <p className="mt-2 rounded border border-amber-300 bg-amber-50 p-2 text-xs text-amber-950">{warning}</p>}
              <button type="button" onClick={() => onHouseClick(address, resident)}
                className="mt-3 min-h-10 rounded border border-blue-300 bg-white px-3 text-xs font-medium text-blue-800">
                Lihat data alamat {address}
              </button>
            </>
          )}
        </section>
      )}
      <details className="mt-3 rounded-lg border border-slate-200 p-3 text-xs text-slate-600">
        <summary className="cursor-pointer py-1 font-medium">Referensi brosur Tahap 1 · sementara</summary>
        <p className="mt-2">Warna berikut menunjukkan tipe rumah pada brosur, bukan status pembayaran. Nomor cetak hanya kandidat Tahap 1; tidak mengganti nomor peta lama.</p>
        <div className="mt-2 flex flex-wrap gap-3">
          {BROCHURE_TYPE_LEGEND.map((item) => (
            <span key={item.label} className="flex items-center gap-1">
              <span className="h-3 w-3 rounded-sm border border-slate-400" style={{ backgroundColor: item.color }} />{item.label}
            </span>
          ))}
        </div>
        <p className="mt-2">Hoek = kavling sudut · RC = Rumah Contoh. Penetapan Hoek per bidang belum diverifikasi.</p>
        <a href={BROCHURE_REFERENCE.url} target="_blank" rel="noreferrer" className="mt-2 inline-block min-h-9 py-2 text-blue-700 underline">Buka brosur halaman 7 (PDF)</a>
        <p>Konflik terbuka: NHT-8/16 ganda; NHB-2: 38 vs 30; penomoran baris 1; baris 4–5 pada daftar lama tidak tampak pada peta.</p>
      </details>
    </TooltipProvider>
  );
}

export { PetaLingkungan, SITEPLAN_LOT_POLYGONS };
