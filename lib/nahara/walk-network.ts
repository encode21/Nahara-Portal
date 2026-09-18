import type { PreviewPlacement } from "./provisional-3d";
import type { Point } from "./provisional-lots";

export const WALK_CELL = 0.2;
export const WALK_CLEARANCE = 0.14;
const ROAD_REACH = 2;

export function distanceToSegment(p: Point, a: Point, b: Point) {
  const dx = b[0] - a[0], dz = b[1] - a[1];
  const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dz) / (dx * dx + dz * dz || 1)));
  return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dz);
}

export function insidePolygon(p: Point, polygon: Point[]) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[i], b = polygon[j];
    if ((a[1] > p[1]) !== (b[1] > p[1]) && p[0] < (b[0] - a[0]) * (p[1] - a[1]) / (b[1] - a[1]) + a[0]) inside = !inside;
  }
  return inside;
}

/** A provisional corridor mask around existing lots, never an authoritative road survey. */
export function createWalkNetwork(placements: PreviewPlacement[]) {
  const all = placements.flatMap((p) => p.points);
  const minX = Math.min(...all.map((p) => p[0])) - ROAD_REACH;
  const minZ = Math.min(...all.map((p) => p[1])) - ROAD_REACH;
  const width = Math.ceil((Math.max(...all.map((p) => p[0])) + ROAD_REACH - minX) / WALK_CELL);
  const height = Math.ceil((Math.max(...all.map((p) => p[1])) + ROAD_REACH - minZ) / WALK_CELL);
  const mask = new Uint8Array(width * height);
  // Spatial bins avoid testing every parcel against every road cell.
  const bins = new Map<string, PreviewPlacement[]>(), binSize = 4;
  placements.forEach((p) => {
    const xs = p.points.map((v) => v[0]), zs = p.points.map((v) => v[1]);
    for (let x = Math.floor((Math.min(...xs) - ROAD_REACH) / binSize); x <= Math.floor((Math.max(...xs) + ROAD_REACH) / binSize); x++) {
      for (let z = Math.floor((Math.min(...zs) - ROAD_REACH) / binSize); z <= Math.floor((Math.max(...zs) + ROAD_REACH) / binSize); z++) {
        const key = `${x},${z}`;
        const list = bins.get(key) ?? [];
        list.push(p); bins.set(key, list);
      }
    }
  });
  const point = (index: number): Point => [minX + (index % width + 0.5) * WALK_CELL, minZ + (Math.floor(index / width) + 0.5) * WALK_CELL];
  for (let index = 0; index < mask.length; index++) {
    const p = point(index);
    let near = Infinity, blocked = false;
    for (const lot of bins.get(`${Math.floor(p[0] / binSize)},${Math.floor(p[1] / binSize)}`) ?? []) {
      if (insidePolygon(p, lot.points)) { blocked = true; break; }
      lot.points.forEach((a, i) => { near = Math.min(near, distanceToSegment(p, a, lot.points[(i + 1) % lot.points.length])); });
    }
    // Cell diagonal clearance guarantees the entire visible cell avoids private lots.
    if (!blocked && near > WALK_CLEARANCE + WALK_CELL * Math.SQRT2 / 2 && near < ROAD_REACH) mask[index] = 1;
  }
  // Keep the largest connected public corridor: no isolated spawn islands.
  const visited = new Uint8Array(mask.length);
  let largest: number[] = [];
  for (let start = 0; start < mask.length; start++) {
    if (!mask[start] || visited[start]) continue;
    const queue = [start]; visited[start] = 1;
    for (let i = 0; i < queue.length; i++) {
      const id = queue[i], x = id % width;
      for (const next of [x > 0 ? id - 1 : -1, x < width - 1 ? id + 1 : -1, id - width, id + width]) {
        if (next >= 0 && next < mask.length && mask[next] && !visited[next]) { visited[next] = 1; queue.push(next); }
      }
    }
    if (queue.length > largest.length) largest = queue;
  }
  mask.fill(0); largest.forEach((id) => { mask[id] = 1; });
  const canWalk = (x: number, z: number) => {
    const col = Math.floor((x - minX) / WALK_CELL), row = Math.floor((z - minZ) / WALK_CELL);
    return col >= 0 && col < width && row >= 0 && row < height && mask[row * width + col] === 1;
  };
  const scales = placements.filter((p) => p.type).map((p) => p.box.depth / 17).sort((a, b) => a - b);
  const bodyScale = scales[Math.floor(scales.length / 2)] ?? 0.3;
  return { mask, width, height, minX, minZ, point, canWalk, bodyScale, eyeHeight: bodyScale * 1.65 };
}

export type WalkNetwork = ReturnType<typeof createWalkNetwork>;

export function streetSpawn(network: WalkNetwork, lot: PreviewPlacement): Point | null {
  if (lot.lot.isRC) return null;
  const front: Point = [Math.sin(lot.rotation), Math.cos(lot.rotation)];
  const edge = Number(lot.lot.unit) % 2 === 0 ? [lot.points[2], lot.points[3]] : [lot.points[0], lot.points[1]];
  const target: Point = [(edge[0][0] + edge[1][0]) / 2 + front[0] * 0.65, (edge[0][1] + edge[1][1]) / 2 + front[1] * 0.65];
  let best: Point | null = null, distance = 3;
  for (let i = 0; i < network.mask.length; i++) {
    if (!network.mask[i]) continue;
    const p = network.point(i);
    if ((p[0] - lot.position.x) * front[0] + (p[1] - lot.position.z) * front[1] <= 0) continue;
    const d = Math.hypot(p[0] - target[0], p[1] - target[1]);
    if (d < distance) { distance = d; best = p; }
  }
  return best;
}

export function moveOnRoad(network: WalkNetwork, start: Point, dx: number, dz: number): Point {
  let [x, z] = start;
  // Substeps prevent tunneling, including at low frame rates and sprint speed.
  const steps = Math.max(1, Math.ceil(Math.hypot(dx, dz) / (WALK_CELL / 3)));
  for (let i = 0; i < steps; i++) {
    if (network.canWalk(x + dx / steps, z)) x += dx / steps;
    if (network.canWalk(x, z + dz / steps)) z += dz / steps;
  }
  return [x, z];
}
