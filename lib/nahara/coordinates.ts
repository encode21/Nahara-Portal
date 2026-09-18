import type { SvgPoint, SvgViewBox } from "./types";

export type WorldPoint = { x: number; y: number; z: number };

/**
 * Uniform affine mapping: SVG +x -> world +X, SVG +y -> world +Z.
 * Apply each element's SVG transforms into root viewBox space before conversion.
 * The scale must be calibrated from a known source length before calling units
 * metres. Never normalize width and height independently (that distorts lots).
 */
export function createCoordinateSystem(
  viewBox: SvgViewBox,
  worldUnitsPerSvgUnit: number,
) {
  if (
    !Object.values(viewBox).every(Number.isFinite) ||
    viewBox.width <= 0 || viewBox.height <= 0 ||
    !Number.isFinite(worldUnitsPerSvgUnit) || worldUnitsPerSvgUnit <= 0
  ) {
    throw new Error("A finite positive viewBox and uniform scale are required");
  }
  const center = {
    x: viewBox.x + viewBox.width / 2,
    y: viewBox.y + viewBox.height / 2,
  };

  return {
    svgToWorld(point: SvgPoint, elevation = 0): WorldPoint {
      return {
        x: (point.x - center.x) * worldUnitsPerSvgUnit,
        y: elevation,
        z: (point.y - center.y) * worldUnitsPerSvgUnit,
      };
    },
    worldToSvg(point: WorldPoint): SvgPoint {
      return {
        x: point.x / worldUnitsPerSvgUnit + center.x,
        y: point.z / worldUnitsPerSvgUnit + center.y,
      };
    },
    /** Target must be on the verified primary frontage, not just any road. */
    frontageYaw(centroid: SvgPoint, frontageTarget: SvgPoint): number {
      const dx = frontageTarget.x - centroid.x;
      const dz = frontageTarget.y - centroid.y;
      if (!Number.isFinite(dx) || !Number.isFinite(dz) || (dx === 0 && dz === 0)) {
        throw new Error("Frontage direction must be finite and nonzero");
      }
      return Math.atan2(dx, dz);
    },
  };
}
