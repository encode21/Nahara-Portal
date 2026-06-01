import {
  SITEPLAN_UNIT_OVERRIDES,
} from "@/lib/constants/siteplan-unit-overrides";
import {
  SITEPLAN_UNIT_RECTS,
  type UnitRect,
} from "@/lib/constants/siteplan-unit-rects";

export type LotRect = {
  blokKey: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

function applyOverrides(blokKey: string, rect: UnitRect): UnitRect {
  const patch = SITEPLAN_UNIT_OVERRIDES[blokKey];
  if (!patch) return rect;
  return { ...rect, ...patch };
}

/** Semua kavling dari ekstrak siteplan.jpg */
export function getAllLotRects(): LotRect[] {
  return Object.entries(SITEPLAN_UNIT_RECTS).map(([blokKey, rect]) => ({
    blokKey,
    ...applyOverrides(blokKey, rect),
  }));
}

export function boundsToRect(bounds: UnitRect, key: string): LotRect {
  return {
    blokKey: key,
    ...bounds,
  };
}
