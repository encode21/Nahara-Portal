import type { WargaWithIuran } from "../types";

export type HouseType = 5 | 7 | 9;
export type LotStatus = "lunas" | "belum_bayar" | "kontrak" | "kosong";
export type SvgPoint = { x: number; y: number };
export type SvgViewBox = SvgPoint & { width: number; height: number };

/** Proposed canonical model. Populate only from an audited semantic SVG. */
export interface NaharaLot {
  id: string; // e.g. NHB-6-12; independent of DOM order and coordinates
  dbBlok: string; // existing normalized database address, e.g. NHB-6/12
  block: "NHB" | "NHT";
  row: number;
  number: number;
  houseType: HouseType | null; // unmapped rows require confirmation
  /** Null means no authoritative status record; it does not mean vacant. */
  status: LotStatus | null;
  resident?: WargaWithIuran;
  geometry: {
    /** Source path/polygon/rect, used directly for fill and interactions. */
    elementId: string;
    /** Hash of the entire source asset, preventing stale path associations. */
    sourceSha256: string;
  };
  /** Derived from transformed source geometry, never hand-positioned. */
  metrics?: {
    centroid: SvgPoint;
    bounds: SvgViewBox;
    /** Reviewed primary road-facing edge, including corner-lot decisions. */
    frontage: [SvgPoint, SvgPoint];
    frontageWidth: number;
    depth: number;
    /** Three.js yaw radians, with the model front along local +Z. */
    rotation: number;
  };
}
