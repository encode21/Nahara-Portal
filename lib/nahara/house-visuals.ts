import type { HouseType } from "./types";

/** Visual templates only. Local +Z is the frontage; placement remains locked. */
export const HOUSE_VISUALS: Record<HouseType, {
  windowSections: number; parkingBays: number; balcony: boolean; roofHeight: number;
}> = {
  5: { windowSections: 2, parkingBays: 1, balcony: false, roofHeight: 1.35 },
  7: { windowSections: 3, parkingBays: 2, balcony: false, roofHeight: 1.55 },
  9: { windowSections: 3, parkingBays: 3, balcony: true, roofHeight: 1.8 },
};
