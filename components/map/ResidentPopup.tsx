"use client";

import type { PreviewPlacement } from "@/lib/nahara/provisional-3d";
import type { ResidentAudience, ResidentPresentation } from "@/lib/nahara/resident-presentation";

export function ResidentPopup({ placement, resident, audience, onDetail, navigation }: {
  placement: PreviewPlacement; resident: ResidentPresentation; audience: ResidentAudience; onDetail: () => void;
  navigation?: { disabled: boolean; canExplore: boolean; onFocus: () => void; onExplore: () => void };
}) {
  return <section key={placement.lot.lotId} aria-label="Rumah terpilih" data-resident-audience={audience}
    className="nahara-enter mb-3 rounded-xl border border-sky-200 bg-white p-3 text-sm text-slate-700 shadow-sm">
    <div className="flex flex-wrap items-start justify-between gap-2">
      <div className="min-w-0">
        <p className="font-semibold">{resident.address} · Type {placement.type ?? "—"}</p>
        {resident.name && <p className="break-words">{resident.name}</p>}
        {audience !== "public" && !resident.name && <p>Data hunian belum tersedia</p>}
        {resident.occupancy && <p>Hunian: {resident.occupancy}</p>}
        {resident.status && <p>Status: {resident.status}</p>}
        <p className="text-xs text-amber-800">Belum terverifikasi · Validation: provisional</p>
      </div>
      <button type="button" className="min-h-11 rounded-lg border px-3 text-xs" onClick={onDetail}>Lihat Detail</button>
    </div>
    {navigation && <div className="mt-2 flex flex-wrap gap-2 text-xs">
      <button className="min-h-11 rounded-lg border px-3 disabled:opacity-40" disabled={navigation.disabled} onClick={navigation.onFocus}>Fokus Rumah</button>
      <button className="min-h-11 rounded-lg bg-slate-800 px-3 text-white disabled:opacity-40" disabled={navigation.disabled || !navigation.canExplore} onClick={navigation.onExplore}>Jelajahi Sekitar</button>
    </div>}
  </section>;
}
