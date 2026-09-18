import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";

const hash = (value) => createHash("sha256").update(value).digest("hex");
const source = readFileSync(new URL("../public/siteplan.svg", import.meta.url), "utf8");
const original = readFileSync(new URL("../assets/file.svg", import.meta.url), "utf8");
// Inventory the existing export only; this is not an SVG geometry parser.
const elements = [...source.matchAll(/<(path|polygon|rect|circle|ellipse|polyline|line)\b([^>]*)>/g)]
  .map(([raw, tag, attributes], index) => {
    const attrs = Object.fromEntries([...attributes.matchAll(/([\w:-]+)="([^"]*)"/g)]
      .map(([, key, value]) => [key, value]));
    return {
      index,
      tag,
      id: attrs.id ?? null,
      lotId: attrs["data-lot-id"] ?? null,
      elementSha256: hash(raw),
    };
  });
const assigned = elements.filter((element) => element.lotId !== null);
const counts = new Map();
for (const element of assigned) counts.set(element.lotId, (counts.get(element.lotId) ?? 0) + 1);
const report = {
  source: "public/siteplan.svg",
  sourceSha256: hash(source),
  identicalToAssetsFile: source === original,
  viewBox: source.match(/viewBox="([^"]+)"/)?.[1] ?? null,
  geometryElements: elements.length,
  semanticLotElements: assigned.length,
  textElements: [...source.matchAll(/<text\b/g)].length,
  duplicateLotIds: [...counts].filter(([, count]) => count > 1).map(([id]) => id),
  unassignedGeometryElements: elements.length - assigned.length,
  note: "Unassigned paths include labels, roads and artwork; they are not a lot count. Path-to-lot ownership requires validation against the authoritative plan.",
  ...(process.argv.includes("--elements") ? { elements } : {}),
};
console.log(JSON.stringify(report, null, 2));
