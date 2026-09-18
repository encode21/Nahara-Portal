import type { LotPoly, Point } from "./provisional-lots";
import { approximateType } from "./preview-status";
import { createCoordinateSystem } from "./coordinates";
import { SITEPLAN_IMAGE } from "../constants/siteplan-blocks";

/** Display units only. Not calibrated metres; source is the approximate JPG preview. */
export const PREVIEW_COORDINATES = createCoordinateSystem(
  { x: 0, y: 0, width: SITEPLAN_IMAGE.width, height: SITEPLAN_IMAGE.height }, 0.1,
);

export function polygonCentroid(points: Point[]): Point {
  let area2 = 0, x = 0, y = 0;
  points.forEach((a, i) => {
    const b = points[(i + 1) % points.length];
    const cross = a[0] * b[1] - b[0] * a[1];
    area2 += cross;
    x += (a[0] + b[0]) * cross;
    y += (a[1] + b[1]) * cross;
  });
  if (Math.abs(area2) < 1e-8) throw new Error("Degenerate preview polygon");
  return [x / (3 * area2), y / (3 * area2)];
}

export function previewPlacement(lot: LotPoly) {
  const centroid = polygonCentroid(lot.points);
  const position = PREVIEW_COORDINATES.svgToWorld({ x: centroid[0], y: centroid[1] });
  const points = lot.points.map(([x, y]) => {
    const p = PREVIEW_COORDINATES.svgToWorld({ x, y });
    return [p.x, p.z] as Point;
  });
  // Existing quads are TL, TR, BR, BL. Even lots face the bottom edge,
  // odd lots the top. This is a provisional legacy convention, NOT road analysis.
  const edge = Number(lot.unit) % 2 === 0 ? [lot.points[2], lot.points[3]] : [lot.points[0], lot.points[1]];
  const rotation = lot.isRC ? 0 : PREVIEW_COORDINATES.frontageYaw(
    { x: centroid[0], y: centroid[1] },
    { x: (edge[0][0] + edge[1][0]) / 2, y: (edge[0][1] + edge[1][1]) / 2 },
  );
  const type = approximateType(lot);
  // Brochure dimensions supply only width/depth ratios. Uniformly shrink
  // that template to lie inside every half-plane of these convex legacy quads.
  const halfWidth = (type ?? 5) / 2, halfDepth = 17 / 2;
  const right: Point = [Math.cos(rotation), -Math.sin(rotation)];
  const front: Point = [Math.sin(rotation), Math.cos(rotation)];
  let scale = Infinity;
  points.forEach((a, i) => {
    const b = points[(i + 1) % points.length];
    const length = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const nx = -(b[1] - a[1]) / length, nz = (b[0] - a[0]) / length;
    const distance = Math.abs(nx * (position.x - a[0]) + nz * (position.z - a[1]));
    const extent = halfWidth * Math.abs(nx * right[0] + nz * right[1]) +
      halfDepth * Math.abs(nx * front[0] + nz * front[1]);
    scale = Math.min(scale, distance / extent);
  });
  scale *= 0.72;
  return {
    lot, centroid, position, points, rotation, type,
    validationState: "provisional" as const,
    box: { width: halfWidth * 2 * scale, depth: halfDepth * 2 * scale, height: 7 * scale },
  };
}

export type PreviewPlacement = ReturnType<typeof previewPlacement>;
