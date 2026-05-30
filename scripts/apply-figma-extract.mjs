/**
 * Tulis lib/constants/kavling-paths.ts dari output JSON use_figma.
 * Usage: node scripts/apply-figma-extract.mjs figma-output.json
 */
import { readFileSync, writeFileSync } from "fs";

const jsonPath = process.argv[2];
if (!jsonPath) {
  console.error("Usage: node scripts/apply-figma-extract.mjs <figma-output.json>");
  process.exit(1);
}

const data = JSON.parse(readFileSync(jsonPath, "utf8"));
const { viewBox, paths } = data;

if (!viewBox?.width || !viewBox?.height || !paths) {
  console.error("JSON harus berisi viewBox { width, height } dan paths { ... }");
  process.exit(1);
}

const entries = Object.entries(paths)
  .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
  .map(([key, v]) => {
    const d = v.d.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
    return `  "${key}": { d: "${d}", label: "${v.label}" },`;
  })
  .join("\n");

const content = `/**
 * Path SVG kavling — diekstrak dari Figma (Nahara Site Plan).
 * Regenerate: use_figma + scripts/figma-extract-paths.js → apply-figma-extract.mjs
 */
export const SITEPLAN_VIEWBOX = { width: ${viewBox.width}, height: ${viewBox.height} } as const;

export const KAVLING_PATHS: Record<string, { d: string; label: string }> = {
${entries}
};
`;

writeFileSync(new URL("../lib/constants/kavling-paths.ts", import.meta.url), content);
console.log(`Wrote ${Object.keys(paths).length} paths → lib/constants/kavling-paths.ts`);
