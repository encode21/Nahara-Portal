/**
 * Generate lib/constants/kavling-paths.ts from cluster-layout geometry.
 * Run: node scripts/generate-kavling-paths.mjs
 */
import { writeFileSync } from "fs";
import {
  SITEPLAN_ROWS,
  SITEPLAN_DIMS,
  formatBlok,
  getLotWidth,
  getRowHeight,
  rowY,
  getLotX,
  getCanvasSize,
  getMaxRowWidth,
  getNhtStart,
} from "../lib/constants/cluster-layout.ts";

function rectToPath(x, y, w, h) {
  const x2 = x + w;
  const y2 = y + h;
  return `M ${round(x)} ${round(y)} L ${round(x2)} ${round(y)} L ${round(x2)} ${round(y2)} L ${round(x)} ${round(y2)} Z`;
}

function round(n) {
  return Math.round(n * 10) / 10;
}

const paths = {};

for (const row of SITEPLAN_ROWS) {
  const lw = getLotWidth(row.tipe);
  const y = rowY(row.rowNum);
  const deretH = SITEPLAN_DIMS.LOT_H;
  const innerH = SITEPLAN_DIMS.INNER_H;
  const oddCt = Math.ceil(row.units / 2);
  const evnCt = Math.floor(row.units / 2);

  for (let k = 0; k < oddCt; k++) {
    const num = k * 2 + 1;
    const lx = getLotX(row.side, k, lw);
    const key = formatBlok(row.id, num);
    paths[key] = { d: rectToPath(lx, y + 1, lw, deretH - 2), label: key };
  }
  for (let k = 0; k < evnCt; k++) {
    const num = k * 2 + 2;
    const lx = getLotX(row.side, k, lw);
    const ly = y + deretH + innerH;
    const key = formatBlok(row.id, num);
    paths[key] = { d: rectToPath(lx, ly + 1, lw, deretH - 2), label: key };
  }
}

const nhtStart = getNhtStart();
const maxRowW = getMaxRowWidth();
const rcX = nhtStart + maxRowW + 6;
const rowH = getRowHeight();

paths["RC-1"] = { d: rectToPath(rcX, rowY(5), 48, rowH), label: "RC-1" };
paths["RC-2"] = { d: rectToPath(rcX, rowY(3), 48, SITEPLAN_DIMS.LOT_H), label: "RC-2" };
paths["RC-3"] = {
  d: rectToPath(rcX, rowY(3) + SITEPLAN_DIMS.LOT_H + SITEPLAN_DIMS.INNER_H, 48, SITEPLAN_DIMS.LOT_H),
  label: "RC-3",
};
paths["RC-4"] = {
  d: rectToPath(rcX, rowY(7) - 8, 52, rowH * 2 + SITEPLAN_DIMS.ROW_SEP),
  label: "RC-4",
};

const { width, height } = getCanvasSize();

const entries = Object.entries(paths)
  .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
  .map(([key, v]) => `  "${key}": { d: "${v.d}", label: "${v.label}" },`)
  .join("\n");

const content = `/**
 * Path SVG kavling — dihasilkan dari geometri siteplan (cluster-layout).
 * Regenerate: node scripts/generate-kavling-paths.mjs
 * Setelah tracing Figma siap, ganti dengan ekstrak \`vectorPaths\` dari Figma (scripts/figma-extract-paths.js).
 */
export const SITEPLAN_VIEWBOX = { width: ${round(width)}, height: ${round(height)} } as const;

export const KAVLING_PATHS: Record<string, { d: string; label: string }> = {
${entries}
};
`;

writeFileSync(new URL("../lib/constants/kavling-paths.ts", import.meta.url), content);
console.log(`Wrote ${Object.keys(paths).length} paths → lib/constants/kavling-paths.ts`);
