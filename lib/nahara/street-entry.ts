import type { Point } from "./provisional-lots";
import type { WalkNetwork } from "./walk-network";

/** Find an entry on the EXISTING road mask; never alter roads to accommodate a spawn. */
export function nearestRoadEntry(network: WalkNetwork, near: Point) {
  let point: Point | null = null, best = Infinity;
  for (let i = 0; i < network.mask.length; i++) {
    if (!network.mask[i]) continue;
    const p = network.point(i), distance = Math.hypot(p[0] - near[0], p[1] - near[1]);
    if (distance < best) { best = distance; point = p; }
  }
  if (!point) return null;
  let yaw = 0, longest = -1;
  // Face the longest unobstructed direction along the local public corridor.
  for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 16) {
    let length = 0;
    for (let d = 0.1; d <= 6; d += 0.1) {
      if (!network.canWalk(point[0] - Math.sin(angle) * d, point[1] - Math.cos(angle) * d)) break;
      length = d;
    }
    if (length > longest) { longest = length; yaw = angle; }
  }
  return { point, yaw };
}
