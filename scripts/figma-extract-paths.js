/**
 * Jalankan via MCP `use_figma` pada file:
 * https://www.figma.com/design/8lWWuUzmjjaHrkNtqC2EKQ/Nahara-Site-Plan
 *
 * Prasyarat: setiap kavling = layer VECTOR (atau BOOLEAN) bernama
 *   NHB-1/01, NHT-4/05, RC-1, dll.
 * Koordinat path relatif ke layer screenshot referensi (node 1:2).
 *
 * Setelah run, salin JSON `paths` + `viewBox` lalu:
 *   node scripts/apply-figma-extract.mjs path/to/figma-output.json
 */
// @ts-nocheck

figma.skipInvisibleInstanceChildren = true;

const LOT_NAME = /^(NHB|NHT)-\d+\/\d{2}$|^RC-\d+$/i;
const SCREENSHOT_NODE_ID = "1:2";

function parseSvgPaths(svg) {
  const paths = [];
  const re = /<path[^>]*\sd="([^"]+)"/g;
  let m;
  while ((m = re.exec(svg))) paths.push(m[1]);
  return paths;
}

/** Offset path commands to root frame (screenshot) space. */
function offsetPathD(d, ox, oy) {
  const tokens = d.match(/[MLHVCSQTAZmlhvcsqtaz]|-?\d*\.?\d+(?:e[-+]?\d+)?/gi);
  if (!tokens) return d;

  const out = [];
  let i = 0;
  while (i < tokens.length) {
    const cmd = tokens[i++];
    const upper = cmd.toUpperCase();
    const rel = cmd !== upper;
    out.push(cmd);

    if (upper === "Z") continue;

    const nums = [];
    while (i < tokens.length && !/[MLHVCSQTAZ]/i.test(tokens[i])) {
      nums.push(parseFloat(tokens[i++]));
    }

    if (upper === "H") {
      for (const n of nums) out.push(String(rel ? n : n + ox));
      continue;
    }
    if (upper === "V") {
      for (const n of nums) out.push(String(rel ? n : n + oy));
      continue;
    }

    for (let j = 0; j < nums.length; j += 2) {
      const x = nums[j];
      const y = nums[j + 1];
      if (y === undefined) {
        out.push(String(x));
        break;
      }
      out.push(String(rel ? x : x + ox));
      out.push(String(rel ? y : y + oy));
    }
  }
  return out.join(" ");
}

function round(n) {
  return Math.round(n * 10) / 10;
}

const screenshot = await figma.getNodeByIdAsync(SCREENSHOT_NODE_ID);
if (!screenshot) {
  throw new Error(
    `Screenshot referensi ${SCREENSHOT_NODE_ID} tidak ditemukan. Gunakan layer gambar siteplan sebagai anchor.`
  );
}

const rootX = screenshot.x;
const rootY = screenshot.y;
const viewBox = {
  width: round(screenshot.width),
  height: round(screenshot.height),
};

const paths = {};
const skipped = [];

const nodes = figma.currentPage.findAll(
  (n) => n.type === "VECTOR" || n.type === "BOOLEAN_OPERATION"
);

for (const node of nodes) {
  if (node.id === SCREENSHOT_NODE_ID) continue;

  const ox = node.x - rootX;
  const oy = node.y - rootY;

  let svg;
  try {
    svg = await node.exportAsync({ format: "SVG_STRING" });
  } catch (e) {
    skipped.push({ name: node.name, id: node.id, reason: String(e) });
    continue;
  }

  const ds = parseSvgPaths(svg);
  if (!ds.length) {
    skipped.push({ name: node.name, id: node.id, reason: "no paths in SVG" });
    continue;
  }

  if (LOT_NAME.test(node.name)) {
    if (ds.length === 1) {
      paths[node.name] = {
        d: offsetPathD(ds[0], ox, oy),
        label: node.name,
      };
    } else {
      ds.forEach((d, idx) => {
        const key = `${node.name}#${idx + 1}`;
        paths[key] = { d: offsetPathD(d, ox, oy), label: key };
      });
    }
  } else {
    skipped.push({
      name: node.name,
      id: node.id,
      reason: "name tidak match NHB|NHT-xx/yy atau RC-n",
      subpathCount: ds.length,
    });
  }
}

return {
  viewBox,
  rootFrame: { id: screenshot.id, name: screenshot.name },
  pathCount: Object.keys(paths).length,
  paths,
  skipped,
};
