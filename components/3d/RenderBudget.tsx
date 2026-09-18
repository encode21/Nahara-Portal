"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Frustum, InstancedMesh, Matrix4, Sphere } from "three";

export type SceneQuality = "mobile" | "standard";
export type RenderMetrics = { visible: number; total: number; triangles: number };
export const QUALITY = {
  mobile: { dpr: 1, detailDistance: 22, vegetationDistance: 30, streetDistance: 58 },
  standard: { dpr: 1.5, detailDistance: 55, vegetationDistance: 90, streetDistance: 150 },
} as const;

/** Visibility-only LOD. Original template vertices, transforms, roads and colliders
 * are untouched. Packing instances needs an explicit index map for correct picking. */
export function RenderBudget({ quality, walking, onMetrics }: { quality: SceneQuality; walking: boolean; onMetrics: (metrics: RenderMetrics) => void }) {
  const { scene, camera, invalidate } = useThree();
  const work = useMemo(() => ({ frustum: new Frustum(), projection: new Matrix4(), matrix: new Matrix4(), sphere: new Sphere() }), []);
  const cache = useMemo(() => new Map<InstancedMesh, { matrices: Float32Array; count: number; indices: number[] }>(), []);
  const report = useRef({ time: -Infinity, signature: "" });
  useEffect(() => {
    camera.far = walking ? QUALITY[quality].streetDistance : 500;
    camera.updateProjectionMatrix(); invalidate();
    report.current.time = -Infinity;
  }, [camera, quality, walking, invalidate]);
  useEffect(() => () => {
    cache.forEach((saved, mesh) => {
      mesh.count = saved.count;
      (mesh.instanceMatrix.array as Float32Array).set(saved.matrices);
      mesh.instanceMatrix.needsUpdate = true;
      delete mesh.userData.sourceIndices;
    });
    cache.clear();
  }, [cache]);
  useFrame(({ clock }) => {
    let visible = 0, total = 0, triangles = 0;
    camera.updateMatrixWorld();
    work.frustum.setFromProjectionMatrix(work.projection.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse));
    scene.traverse((object) => {
      if (!(object instanceof InstancedMesh) || !object.name.startsWith("nahara-budget-")) return;
      let saved = cache.get(object);
      if (!saved) {
        saved = { matrices: new Float32Array(object.instanceMatrix.array), count: object.count, indices: [] };
        cache.set(object, saved);
      }
      if (!object.geometry.boundingSphere) object.geometry.computeBoundingSphere();
      const detail = object.name === "nahara-budget-detail";
      const vegetation = object.name === "nahara-budget-vegetation";
      const distance = quality === "standard" && !walking ? Infinity : detail ? QUALITY[quality].detailDistance : vegetation ? QUALITY[quality].vegetationDistance : Infinity;
      let count = 0, changed = false;
      for (let i = 0; i < saved.count; i++) {
        work.matrix.fromArray(saved.matrices, i * 16);
        work.sphere.copy(object.geometry.boundingSphere!).applyMatrix4(work.matrix);
        if (!work.frustum.intersectsSphere(work.sphere) || camera.position.distanceTo(work.sphere.center) > distance + work.sphere.radius) continue;
        if (saved.indices[count] !== i) { object.setMatrixAt(count, work.matrix); changed = true; }
        saved.indices[count++] = i;
      }
      saved.indices.length = count;
      object.userData.sourceIndices = saved.indices;
      object.count = count;
      visible += count; total += saved.count;
      triangles += count * (object.geometry.index?.count ?? object.geometry.getAttribute("position").count) / 3;
      if (changed) object.instanceMatrix.needsUpdate = true;
      // The original full bounding sphere stays a conservative batch-level bound.
    });
    const signature = `${visible}/${total}/${triangles}`;
    if (signature !== report.current.signature && clock.elapsedTime - report.current.time >= 0.5) {
      report.current = { time: clock.elapsedTime, signature };
      onMetrics({ visible, total, triangles });
    }
  });
  return null;
}
