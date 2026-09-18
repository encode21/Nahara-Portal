"use client";

import { Html } from "@react-three/drei";
import type { PreviewPlacement } from "@/lib/nahara/provisional-3d";
import type { ResidentPresentation } from "@/lib/nahara/resident-presentation";

export type HouseBubble = { placement: PreviewPlacement; resident: ResidentPresentation };

/** Only the bounded active set is mounted, not a DOM label for every parcel.
 * Screen-facing Html stays legible at both aerial and human-eye distances. */
export function ResidentBubbles({ bubbles }: { bubbles: HouseBubble[] }) {
  return <group>{bubbles.map(({ placement: p, resident }) => <Html key={p.lot.lotId}
    position={[p.position.x, p.box.height + 0.65, p.position.z]} center
    zIndexRange={[20, 10]} style={{ pointerEvents: "none" }}>
    <div data-resident-bubble={p.lot.lotId} className="nahara-enter w-max max-w-40 rounded-xl border border-white/80 bg-slate-900/90 px-3 py-2 text-center text-xs text-white shadow-md">
      <p className="font-semibold">{resident.address}</p>
      {resident.name && <p className="max-w-36 truncate" title={resident.name}>{resident.name}</p>}
      {resident.status && <p>{resident.status}</p>}
      <div className="absolute -bottom-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 bg-slate-900/90" />
    </div>
  </Html>)}</group>;
}
