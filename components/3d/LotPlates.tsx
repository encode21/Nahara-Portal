"use client";

import { useEffect, useMemo } from "react";
import { useThree, type ThreeEvent } from "@react-three/fiber";
import { Color, Float32BufferAttribute, Shape, ShapeGeometry } from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import type { PreviewPlacement } from "@/lib/nahara/provisional-3d";
import type { LotPoly } from "@/lib/nahara/provisional-lots";
import { getHouseStyle } from "@/lib/nahara/preview-status";
import type { WargaWithIuran } from "@/lib/types";

/** One draw call for all status plates; picking retains the original preview key. */
export function LotPlates({ placements, lookupWarga, onSelect, onHover }: {
  placements: PreviewPlacement[]; lookupWarga: (lot: LotPoly) => WargaWithIuran | undefined;
  onSelect: (lot: LotPoly) => void; onHover: (key: string | null) => void;
}) {
  const { invalidate } = useThree();
  const batch = useMemo(() => {
    const faces: LotPoly[] = [];
    const spans: { start: number; count: number; lot: LotPoly }[] = [];
    let start = 0;
    const geometries = placements.map((p) => {
      const shape = new Shape();
      p.points.forEach(([x, z], i) => i ? shape.lineTo(x, -z) : shape.moveTo(x, -z)); shape.closePath();
      const source = new ShapeGeometry(shape);
      const g = source.toNonIndexed().rotateX(-Math.PI / 2).translate(0, 0.04, 0);
      source.dispose();
      const count = g.getAttribute("position").count;
      spans.push({ start, count, lot: p.lot }); start += count;
      for (let i = 0; i < count / 3; i++) faces.push(p.lot);
      return g;
    });
    const geometry = mergeGeometries(geometries)!; geometries.forEach((g) => g.dispose());
    geometry.setAttribute("color", new Float32BufferAttribute(new Float32Array(start * 3), 3));
    return { geometry, faces, spans };
  }, [placements]);
  useEffect(() => {
    const colors = batch.geometry.getAttribute("color");
    batch.spans.forEach(({ start, count, lot }) => {
      const c = new Color(lot.isRC ? "#a78bfa" : getHouseStyle(lookupWarga(lot)).fill);
      for (let i = start; i < start + count; i++) colors.setXYZ(i, c.r, c.g, c.b);
    });
    colors.needsUpdate = true; invalidate();
  }, [batch, lookupWarga, invalidate]);
  useEffect(() => () => batch.geometry.dispose(), [batch]);
  const target = (event: ThreeEvent<MouseEvent | PointerEvent>) => event.faceIndex == null ? undefined : batch.faces[event.faceIndex];
  return <mesh geometry={batch.geometry}
    onClick={(event) => { event.stopPropagation(); const lot = target(event); if (lot && event.delta <= 5) onSelect(lot); }}
    onPointerOver={(event) => { event.stopPropagation(); onHover(target(event)?.lotId ?? null); }}
    onPointerMove={(event) => { event.stopPropagation(); onHover(target(event)?.lotId ?? null); }}
    onPointerOut={() => onHover(null)}>
    <meshBasicMaterial vertexColors transparent opacity={0.45} />
  </mesh>;
}
