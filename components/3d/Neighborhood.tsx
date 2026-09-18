"use client";

import { useEffect, useMemo, useRef } from "react";
import { BufferGeometry, CanvasTexture, Float32BufferAttribute, InstancedMesh, Object3D, RepeatWrapping } from "three";
import type { PreviewPlacement } from "@/lib/nahara/provisional-3d";
import { WALK_CELL, type WalkNetwork } from "@/lib/nahara/walk-network";

export function Neighborhood({ network, placements }: { network: WalkNetwork; placements: PreviewPlacement[] }) {
  const road = useMemo(() => {
    const vertices: number[] = [], uvs: number[] = [], edges: number[] = [];
    // Combine adjacent cells into horizontal strips for a lightweight road mesh.
    for (let row = 0; row < network.height; row++) {
      let col = 0;
      while (col < network.width) {
        if (!network.mask[row * network.width + col]) { col++; continue; }
        const start = col;
        while (col < network.width && network.mask[row * network.width + col]) col++;
        const x0 = network.minX + start * WALK_CELL, x1 = network.minX + col * WALK_CELL;
        const z0 = network.minZ + row * WALK_CELL, z1 = z0 + WALK_CELL;
        for (const [x, z] of [[x0, z0], [x0, z1], [x1, z1], [x0, z0], [x1, z1], [x1, z0]]) { vertices.push(x, 0.022, z); uvs.push(x * 2, z * 2); }
      }
    }
    for (let id = 0; id < network.mask.length; id++) {
      if (!network.mask[id]) continue;
      const [x, z] = network.point(id), h = WALK_CELL / 2;
      if (!network.mask[id - network.width]) edges.push(x - h, 0.05, z - h, x + h, 0.05, z - h);
      if (!network.mask[id + network.width]) edges.push(x - h, 0.05, z + h, x + h, 0.05, z + h);
    }
    const geometry = new BufferGeometry();
    geometry.setAttribute("position", new Float32BufferAttribute(vertices, 3));
    geometry.setAttribute("uv", new Float32BufferAttribute(uvs, 2)); geometry.computeVertexNormals();
    const edgeGeometry = new BufferGeometry(); edgeGeometry.setAttribute("position", new Float32BufferAttribute(edges, 3));
    const canvas = document.createElement("canvas"); canvas.width = canvas.height = 128;
    const context = canvas.getContext("2d")!;
    context.fillStyle = "#a7aaa6"; context.fillRect(0, 0, 128, 128);
    for (let row = 0; row < 8; row++) for (let col = -1; col < 5; col++) {
      context.fillStyle = (row + col) % 3 === 0 ? "#959b99" : "#b7b9b1";
      context.fillRect(col * 32 + row % 2 * 16 + 1, row * 16 + 1, 30, 14);
    }
    const texture = new CanvasTexture(canvas); texture.wrapS = texture.wrapT = RepeatWrapping;
    return { geometry, edgeGeometry, texture };
  }, [network]);
  useEffect(() => () => { road.geometry.dispose(); road.edgeGeometry.dispose(); road.texture.dispose(); }, [road]);
  // Decorations sit on parcel frontage corners, never on walkable cells.
  const anchors = useMemo(() => placements.filter((p, i) => p.type && i % 5 === 0).map((p) => {
    const edge = Number(p.lot.unit) % 2 === 0 ? p.points[2] : p.points[0];
    return { x: edge[0] * 0.83 + p.position.x * 0.17, z: edge[1] * 0.83 + p.position.z * 0.17 };
  }), [placements]);
  return <group>
    <mesh geometry={road.geometry}><meshStandardMaterial map={road.texture} roughness={1} /></mesh>
    <lineSegments geometry={road.edgeGeometry}><lineBasicMaterial color="#a77a65" /></lineSegments>
    <StreetDetails anchors={anchors} />
  </group>;
}

function StreetDetails({ anchors }: { anchors: { x: number; z: number }[] }) {
  const poles = useRef<InstancedMesh>(null), lamps = useRef<InstancedMesh>(null), trunks = useRef<InstancedMesh>(null), leaves = useRef<InstancedMesh>(null);
  useEffect(() => {
    const o = new Object3D();
    anchors.forEach((p, i) => {
      o.position.set(p.x, 0.8, p.z); o.scale.set(0.045, 1.6, 0.045); o.rotation.set(0, 0, 0); o.updateMatrix(); poles.current!.setMatrixAt(i, o.matrix);
      o.position.y = 1.62; o.scale.set(0.22, 0.07, 0.16); o.updateMatrix(); lamps.current!.setMatrixAt(i, o.matrix);
      o.position.set(p.x + 0.17, 0.85, p.z); o.scale.set(0.055, 1.7, 0.055); o.updateMatrix(); trunks.current!.setMatrixAt(i, o.matrix);
      for (let leaf = 0; leaf < 6; leaf++) {
        const angle = leaf / 6 * Math.PI * 2;
        o.position.set(p.x + 0.17 + Math.sin(angle) * 0.23, 1.72, p.z + Math.cos(angle) * 0.23);
        o.rotation.set(0.15, angle, 0); o.scale.set(0.13, 0.04, 0.65); o.updateMatrix(); leaves.current!.setMatrixAt(i * 6 + leaf, o.matrix);
      }
    });
    for (const ref of [poles, lamps, trunks, leaves]) { ref.current!.instanceMatrix.needsUpdate = true; ref.current!.computeBoundingSphere(); }
  }, [anchors]);
  return <group>
    <instancedMesh ref={poles} args={[undefined, undefined, anchors.length]}><boxGeometry /><meshStandardMaterial color="#303b37" /></instancedMesh>
    <instancedMesh ref={lamps} args={[undefined, undefined, anchors.length]}><boxGeometry /><meshStandardMaterial color="#fff0c0" emissive="#ffe8a0" emissiveIntensity={0.35} /></instancedMesh>
    <instancedMesh name="nahara-budget-vegetation" ref={trunks} args={[undefined, undefined, anchors.length]}><cylinderGeometry args={[0.7, 1, 1, 5]} /><meshStandardMaterial color="#84745a" /></instancedMesh>
    <instancedMesh name="nahara-budget-vegetation" ref={leaves} args={[undefined, undefined, anchors.length * 6]}><sphereGeometry args={[1, 5, 3]} /><meshStandardMaterial color="#3d6748" /></instancedMesh>
  </group>;
}
