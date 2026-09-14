"use client";

import { useEffect, useMemo, useRef } from "react";
import { type ThreeEvent } from "@react-three/fiber";
import { BoxGeometry, BufferGeometry, CylinderGeometry, Float32BufferAttribute, InstancedMesh, MeshStandardMaterial, Object3D, SphereGeometry } from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import type { PreviewPlacement } from "@/lib/nahara/provisional-3d";
import type { LotPoly } from "@/lib/nahara/provisional-lots";
import type { HouseType } from "@/lib/nahara/types";
import { HOUSE_VISUALS } from "@/lib/nahara/house-visuals";

type Part = { geometry: BufferGeometry; material: MeshStandardMaterial };
const PALETTE = { wall: "#eeeae1", trim: "#fffdf5", roof: "#343a3d", glass: "#344a50", metal: "#242c2b", paving: "#aaa99f", garden: "#65844a", leaf: "#3c693d", bark: "#8e7959" };
type Surface = keyof typeof PALETTE;

function makeHouse(type: HouseType): Part[] {
  const spec = HOUSE_VISUALS[type];
  const buckets = new Map<Surface, BufferGeometry[]>();
  function add(surface: Surface, geometry: BufferGeometry) {
    // All merged inputs must have the same attributes.
    geometry.deleteAttribute("uv");
    const list = buckets.get(surface) ?? [];
    list.push(geometry.index ? geometry.toNonIndexed() : geometry);
    if (geometry.index) geometry.dispose();
    buckets.set(surface, list);
  }
  function box(surface: Surface, x: number, y: number, z: number, w: number, h: number, d: number) {
    add(surface, new BoxGeometry(w, h, d).translate(x, y, z));
  }
  const w = type * 0.94;
  box("paving", 0, 0.08, 0, type, 0.16, 16.5);
  box("wall", 0, 2.85, -2.35, w, 5.6, 9.5);
  for (const y of [0.35, 2.9, 5.55, 5.85]) box("trim", 0, y, -2.35, w + 0.18, 0.15, 9.65);
  // Four pitched roof faces meeting a short ridge, matching the Nahara hip silhouette.
  const z0 = -2.35, roofW = type * 0.99, depth = 10;
  const eave = 5.95, ridge = eave + spec.roofHeight;
  const a = [-roofW / 2, eave, z0 - depth / 2], b = [roofW / 2, eave, z0 - depth / 2];
  const c = [roofW / 2, eave, z0 + depth / 2], d = [-roofW / 2, eave, z0 + depth / 2];
  const r0 = [0, ridge, z0 - (depth - roofW) / 2], r1 = [0, ridge, z0 + (depth - roofW) / 2];
  const roof = new BufferGeometry();
  roof.setAttribute("position", new Float32BufferAttribute([...a, ...r0, ...b, ...b, ...r0, ...r1, ...b, ...r1, ...c, ...c, ...r1, ...d, ...d, ...r1, ...r0, ...d, ...r0, ...a], 3));
  roof.computeVertexNormals();
  add("roof", roof);
  // Coarse roof courses convey tiles without a high-poly tile mesh.
  for (let i = 1; i <= 6; i++) {
    const t = i / 7;
    const x = roofW / 2 * (1 - t), zLength = depth - roofW * t;
    for (const sign of [-1, 1]) box("roof", sign * x, eave + spec.roofHeight * t, z0, 0.035, 0.04, zLength);
  }
  const sections = type === 5 ? [-0.13, 0.34] : [-0.34, 0, 0.34];
  sections.forEach((fraction, i) => {
    const central = type === 5 ? i === 0 : i === 1;
    const ww = type * (central ? 0.35 : 0.105), x = fraction * type;
    // Recessed front window, dark surround, white classical frame and sill.
    box("trim", x, 4.35, 2.48, ww + 0.34, 2.35, 0.3);
    box("metal", x, 4.35, 2.66, ww + 0.07, 1.95, 0.08);
    box("glass", x, 4.35, 2.72, ww, 1.83, 0.025);
    box("metal", x, 4.35, 2.75, 0.045, 1.87, 0.03);
    box("metal", x, 4.35, 2.75, ww, 0.045, 0.03);
    box("trim", x, 3.24, 2.7, ww + 0.4, 0.15, 0.46);
  });
  // Projecting central bay and cornice, kept within the locked template envelope.
  for (const side of [-1, 1]) box("trim", side * type * 0.255, 4.3, 2.65, 0.16, 2.5, 0.5);
  box("trim", 0, 5.64, 2.65, type * 0.59, 0.22, 0.65);
  box("metal", -type * 0.24, 1.42, 2.44, type * 0.22, 2.6, 0.09);
  box("glass", type * 0.19, 1.5, 2.45, type * 0.34, 2.3, 0.08);
  for (const x of [-0.47, 0.47]) box("trim", type * x, 1.45, 2.55, 0.2, 2.9, 0.36);
  // One, two or three clearly separated parking bays under a dark flat canopy.
  const carportW = type * (type === 5 ? 0.66 : type === 7 ? 0.83 : 0.96);
  box("metal", 0.05 * type, 2.8, 5.05, carportW, 0.13, 4.85);
  for (const side of [-1, 1]) box("metal", 0.05 * type + side * (carportW / 2 - 0.08), 1.4, 7.25, 0.09, 2.8, 0.09);
  for (let i = 0; i <= spec.parkingBays; i++) {
    const x = type * 0.05 - carportW / 2 + carportW * i / spec.parkingBays;
    box("metal", x, 0.18, 5.1, 0.045, 0.025, 4.8);
  }
  if (spec.balcony) {
    box("trim", 0, 3.03, 3.1, type * 0.48, 0.2, 1.15);
    for (let i = 0; i <= 12; i++) box("metal", -type * 0.23 + type * 0.46 * i / 12, 3.6, 3.62, 0.035, 1.05, 0.035);
    box("metal", 0, 4.1, 3.62, type * 0.49, 0.055, 0.055);
  }
  box("garden", -type * 0.41, 0.18, 5, type * 0.13, 0.12, 4.8);
  for (const z of [3.5, 5, 6.5]) {
    const shrub = new SphereGeometry(type * 0.065, 6, 4).scale(1, 0.7, 1).translate(-type * 0.41, 0.55, z);
    add("leaf", shrub);
  }
  // One small garden tree at the frontage; it does not occupy the road network.
  add("bark", new CylinderGeometry(0.055, 0.075, 2.2, 5).translate(-type * 0.4, 1.2, 7.7));
  add("leaf", new SphereGeometry(0.55, 6, 4).scale(1, 1.25, 1).translate(-type * 0.4, 2.35, 7.7));
  return Array.from(buckets).map(([surface, geometries]) => {
    const geometry = mergeGeometries(geometries)!;
    geometries.forEach((g) => g.dispose());
    return { geometry, material: new MeshStandardMaterial({ color: PALETTE[surface], roughness: surface === "glass" ? 0.28 : 0.85, metalness: surface === "metal" ? 0.15 : 0 }) };
  });
}

function HouseBatch({ part, houses, onSelect, onHover }: {
  part: Part; houses: PreviewPlacement[]; onSelect: (lot: LotPoly) => void; onHover: (key: string | null) => void;
}) {
  const mesh = useRef<InstancedMesh>(null);
  useEffect(() => {
    const object = new Object3D();
    houses.forEach((p, i) => {
      // Placement, yaw and fit come unchanged from the locked preview pipeline.
      object.position.set(p.position.x, 0.12, p.position.z);
      object.rotation.set(0, p.rotation, 0);
      object.scale.setScalar(p.box.depth / 17);
      object.updateMatrix();
      mesh.current!.setMatrixAt(i, object.matrix);
    });
    mesh.current!.instanceMatrix.needsUpdate = true;
    mesh.current!.computeBoundingSphere();
  }, [houses]);
  const target = (event: ThreeEvent<MouseEvent | PointerEvent>) => event.instanceId === undefined ? undefined : houses[mesh.current?.userData.sourceIndices?.[event.instanceId] ?? event.instanceId];
  const detail = [PALETTE.trim, PALETTE.leaf, PALETTE.bark].includes(`#${part.material.color.getHexString()}`);
  return <instancedMesh name={detail ? "nahara-budget-detail" : "nahara-budget-core"} ref={mesh} args={[part.geometry, part.material, houses.length]} dispose={null}
    onClick={(event) => { event.stopPropagation(); const p = target(event); if (p && event.delta <= 5) onSelect(p.lot); }}
    onPointerOver={(event) => { event.stopPropagation(); onHover(target(event)?.lot.lotId ?? null); }} onPointerOut={() => onHover(null)} />;
}

export function HouseModels({ placements, onSelect, onHover }: {
  placements: PreviewPlacement[]; onSelect: (lot: LotPoly) => void; onHover: (key: string | null) => void;
}) {
  const models = useMemo(() => ([5, 7, 9] as const).map((type) => ({
    type, parts: makeHouse(type), houses: placements.filter((p) => !p.lot.isRC && p.type === type),
  })), [placements]);
  useEffect(() => () => models.forEach((m) => m.parts.forEach((p) => { p.geometry.dispose(); p.material.dispose(); })), [models]);
  return <group>{models.flatMap((m) => m.parts.map((part, i) => <HouseBatch key={`${m.type}-${i}`} part={part} houses={m.houses} onSelect={onSelect} onHover={onHover} />))}</group>;
}
