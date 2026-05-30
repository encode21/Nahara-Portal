/**
 * Siteplan Nahara — orientasi utara di atas peta.
 * NHB (Barat) = kiri gang · NHT (Timur) = kanan gang
 * Setiap Row = 2 deret: genap (atas) + ganjil (bawah), dipisah jalan internal.
 * Penomoran dari Timur (kanan/1) ke Barat; tanpa angka 4, 13, dan rentang 40–49.
 * Row 8 = utara (atas) · Row 1 = selatan (bawah)
 */

export type KavlingTipe = "t5" | "t7" | "t9";
export type ClusterSide = "NHB" | "NHT";

export type SiteplanRow = {
  /** Label baris, e.g. NHB-8 */
  id: string;
  side: ClusterSide;
  rowNum: number;
  tipe: KavlingTipe;
  units: number;
  /** Nomor kavling tertinggi di baris ini (mis. NHT-8 → 56, NHB-8 → 30). */
  maxLotNo: number;
};

export const SITEPLAN_ROWS: SiteplanRow[] = [
  { id: "NHB-8", side: "NHB", rowNum: 8, tipe: "t7", units: 30, maxLotNo: 30 },
  { id: "NHB-7", side: "NHB", rowNum: 7, tipe: "t9", units: 23, maxLotNo: 23 },
  { id: "NHB-6", side: "NHB", rowNum: 6, tipe: "t9", units: 36, maxLotNo: 36 },
  { id: "NHB-5", side: "NHB", rowNum: 5, tipe: "t5", units: 27, maxLotNo: 32 },
  { id: "NHB-4", side: "NHB", rowNum: 4, tipe: "t5", units: 27, maxLotNo: 27 },
  { id: "NHB-3", side: "NHB", rowNum: 3, tipe: "t7", units: 45, maxLotNo: 45 },
  { id: "NHB-2", side: "NHB", rowNum: 2, tipe: "t5", units: 33, maxLotNo: 33 },
  { id: "NHB-1", side: "NHB", rowNum: 1, tipe: "t5", units: 25, maxLotNo: 25 },

  { id: "NHT-8", side: "NHT", rowNum: 8, tipe: "t7", units: 56, maxLotNo: 56 },
  { id: "NHT-7", side: "NHT", rowNum: 7, tipe: "t9", units: 16, maxLotNo: 35 },
  { id: "NHT-6", side: "NHT", rowNum: 6, tipe: "t9", units: 36, maxLotNo: 36 },
  { id: "NHT-5", side: "NHT", rowNum: 5, tipe: "t5", units: 22, maxLotNo: 38 },
  { id: "NHT-4", side: "NHT", rowNum: 4, tipe: "t5", units: 22, maxLotNo: 21 },
  { id: "NHT-3", side: "NHT", rowNum: 3, tipe: "t7", units: 45, maxLotNo: 45 },
  { id: "NHT-2", side: "NHT", rowNum: 2, tipe: "t5", units: 27, maxLotNo: 27 },
  { id: "NHT-1", side: "NHT", rowNum: 1, tipe: "t5", units: 25, maxLotNo: 19 },
];

export const TIPE_COLORS = {
  t5: { bg: "#0d1a2e", border: "#4a8fd4", label: "Tipe 5" },
  t7: { bg: "#0d1e0d", border: "#4a9e3a", label: "Tipe 7" },
  t9: { bg: "#1e140a", border: "#b47a2a", label: "Tipe 9" },
} as const;

export const SITEPLAN_SCALE = 1.2;

const LOT_W_BASE = { t5: 14, t7: 19, t9: 25 } as const;

export function getLotWidth(tipe: KavlingTipe): number {
  return LOT_W_BASE[tipe] * SITEPLAN_SCALE;
}

export const SITEPLAN_DIMS = {
  LOT_H: 20 * SITEPLAN_SCALE,
  GAP: 2 * SITEPLAN_SCALE,
  INNER_H: 10 * SITEPLAN_SCALE,
  ROW_SEP: 14 * SITEPLAN_SCALE,
  GANG_W: 28 * SITEPLAN_SCALE,
  LABEL_COL: 72 * SITEPLAN_SCALE,
  TOP_PAD: 26 * SITEPLAN_SCALE,
  BOT_PAD: 20 * SITEPLAN_SCALE,
} as const;

export function getRowHeight(): number {
  return SITEPLAN_DIMS.LOT_H * 2 + SITEPLAN_DIMS.INNER_H;
}

export function getMaxRowWidth(): number {
  const lw = getLotWidth("t7");
  const gap = SITEPLAN_DIMS.GAP;
  return 28 * (lw + gap) + 50;
}

export function getCanvasSize(): { width: number; height: number } {
  const maxRowW = getMaxRowWidth();
  const rowH = getRowHeight();
  const { LABEL_COL, GANG_W, TOP_PAD, BOT_PAD, ROW_SEP } = SITEPLAN_DIMS;
  const width = LABEL_COL + maxRowW + GANG_W + maxRowW + LABEL_COL + 20;
  const height = TOP_PAD + 8 * (rowH + ROW_SEP) - ROW_SEP + BOT_PAD;
  return { width, height };
}

export function getGangLeft(): number {
  return SITEPLAN_DIMS.LABEL_COL + getMaxRowWidth();
}

export function getNhtStart(): number {
  return getGangLeft() + SITEPLAN_DIMS.GANG_W;
}

export function rowY(rowNum: number): number {
  const idx = 8 - rowNum;
  return SITEPLAN_DIMS.TOP_PAD + idx * (getRowHeight() + SITEPLAN_DIMS.ROW_SEP);
}

export function getLotX(side: ClusterSide, k: number, lw: number): number {
  const gangLeft = getGangLeft();
  const nhtStart = getNhtStart();
  const gap = SITEPLAN_DIMS.GAP;
  if (side === "NHB") {
    return gangLeft - (k + 1) * (lw + gap) + gap;
  }
  return nhtStart + k * (lw + gap);
}

export const BLOK_ROWS = SITEPLAN_ROWS.map((r) => r.id);

/** @deprecated use SITEPLAN_ROWS */
export const CLUSTER_LAYOUT = {
  NHT: {
    label: "Nahara Timur",
    rows: SITEPLAN_ROWS.filter((r) => r.side === "NHT")
      .sort((a, b) => a.rowNum - b.rowNum)
      .map((r) => r.id),
    lotsPerRow: 0,
  },
  NHB: {
    label: "Nahara Barat",
    rows: SITEPLAN_ROWS.filter((r) => r.side === "NHB")
      .sort((a, b) => a.rowNum - b.rowNum)
      .map((r) => r.id),
    lotsPerRow: 0,
  },
};

/** Nomor unit yang diizinkan — tanpa digit 4, tanpa 13, tanpa rentang 40–49. */
export function isAllowedLotNumber(n: number): boolean {
  if (n === 13) return false;
  if (n >= 40 && n <= 49) return false;
  return !String(n).includes("4");
}

/** Semua nomor ganjil/genap valid dari awal sampai `maxLotNo` (naik). */
export function generateLotNumbersUpTo(maxLotNo: number, parity: 1 | 2): number[] {
  const out: number[] = [];
  for (let n = parity; n <= maxLotNo; n += 2) {
    if (isAllowedLotNumber(n)) out.push(n);
  }
  return out;
}

/**
 * Kavling bernomor valid per deret, dengan indeks posisi grid (0 = timur).
 */
export function getLotsForDeret(
  side: ClusterSide,
  maxLotNo: number,
  deret: "ganjil" | "genap"
): { num: number; positionIndex: number }[] {
  const seq = generateLotNumbersUpTo(maxLotNo, deret === "ganjil" ? 1 : 2);
  return seq.map((num, i) => ({
    num,
    positionIndex: side === "NHB" ? i : seq.length - 1 - i,
  }));
}

/** @deprecated gunakan getLotsForDeret */
export function getLotNumberForSlot(
  side: ClusterSide,
  k: number,
  slotCount: number,
  deret: "ganjil" | "genap",
  maxLotNo: number
): number | undefined {
  const seq = generateLotNumbersUpTo(maxLotNo, deret === "ganjil" ? 1 : 2);
  const idx = side === "NHB" ? k : slotCount - 1 - k;
  return seq[idx];
}

export function formatBlok(rowId: string, lotNumber: number): string {
  return `${rowId}/${String(lotNumber).padStart(2, "0")}`;
}

export function parseBlok(blok: string): { rowId: string; lotNumber: number } | null {
  const match = blok.match(/^(NHT|NHB)-(\d+)\/(\d+)$/);
  if (!match) return null;
  return {
    rowId: `${match[1]}-${match[2]}`,
    lotNumber: parseInt(match[3], 10),
  };
}

export function normalizeBlokKey(blok: string): string {
  const parsed = parseBlok(blok);
  if (!parsed) return blok;
  return formatBlok(parsed.rowId, parsed.lotNumber);
}
