"use client";

import { useEffect, useRef, useState, type MutableRefObject } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Euler, Matrix4, PerspectiveCamera, Quaternion, Vector3 } from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import type { PreviewPlacement } from "@/lib/nahara/provisional-3d";
import { moveOnRoad, streetSpawn, type WalkNetwork } from "@/lib/nahara/walk-network";
import { nearestRoadEntry } from "@/lib/nahara/street-entry";

export type ViewMode = "MASTERPLAN" | "HOUSE_FOCUS" | "STREET_EXPLORE";
export type WalkInput = { x: number; y: number; sprint?: boolean };
const modalOpen = () => !!document.querySelector('[role="dialog"]');

export function CameraRig({ mode, request, selected, placements, network, joystick, onPosition, onTransition, onLock, onTarget }: {
  mode: ViewMode; request: number; selected?: PreviewPlacement; network: WalkNetwork;
  placements: PreviewPlacement[]; onLock: (locked: boolean) => void; onTarget: (key: string | null) => void;
  joystick: MutableRefObject<WalkInput>; onPosition: (position: [number, number, number]) => void;
  onTransition: (transitioning: boolean) => void;
}) {
  const { camera, gl, size, invalidate } = useThree();
  const controls = useRef<OrbitControlsImpl>(null);
  const keys = useRef(new Set<string>());
  const view = useRef({ yaw: 0, pitch: 0 });
  const [transitioning, setTransitioning] = useState(false);
  const telemetry = useRef(0);
  const reported = useRef(new Vector3(Infinity, Infinity, Infinity));
  const wasModalOpen = useRef(false);
  const velocity = useRef({ x: 0, z: 0 });
  const previousMode = useRef<ViewMode>("MASTERPLAN");
  const aerial = useRef({ position: new Vector3(80, 100, 100), quaternion: camera.quaternion.clone(), target: new Vector3() });
  const selection = useRef(selected); selection.current = selected;
  const orbitTarget = useRef(new Vector3());
  const flight = useRef<{
    time: number; from: Vector3; to: Vector3; fromQuaternion: Quaternion; toQuaternion: Quaternion;
    target: Vector3; arc: number;
  } | null>(null);

  useEffect(() => {
    if (!(camera instanceof PerspectiveCamera)) return;
    camera.fov = mode === "STREET_EXPLORE" ? 65 : 2 * Math.atan(Math.tan(Math.PI / 8) / Math.min(1, size.width / size.height)) * 180 / Math.PI;
    camera.updateProjectionMatrix(); invalidate();
  }, [camera, size.width, size.height, mode, invalidate]);

  useEffect(() => {
    if (previousMode.current === "MASTERPLAN" && mode !== "MASTERPLAN") {
      aerial.current = { position: camera.position.clone(), quaternion: camera.quaternion.clone(), target: orbitTarget.current.clone() };
    }
    previousMode.current = mode;
    if (document.pointerLockElement === gl.domElement) document.exitPointerLock();
    const selected = selection.current;
    let to = aerial.current.position.clone(), target = aerial.current.target.clone();
    if (mode !== "MASTERPLAN" && selected) {
      const { position, rotation, box } = selected;
      const front = new Vector3(Math.sin(rotation), 0, Math.cos(rotation));
      target.set(position.x, box.height * 0.6, position.z);
      if (mode === "STREET_EXPLORE") {
        const spawn = streetSpawn(network, selected);
        if (!spawn) { onTransition(false); setTransitioning(false); return; }
        to.set(spawn[0], network.eyeHeight, spawn[1]);
        target.set(position.x, network.eyeHeight, position.z);
      } else {
        const distance = Math.max(box.depth * 1.45, box.width * 2.2);
        to.copy(target).addScaledVector(front, distance);
        to.y = box.height * 2.4;
      }
    }
    if (mode === "STREET_EXPLORE" && !selected) {
      const entry = nearestRoadEntry(network, [orbitTarget.current.x, orbitTarget.current.z]);
      if (!entry) { onTransition(false); setTransitioning(false); return; }
      to.set(entry.point[0], network.eyeHeight, entry.point[1]);
      target.copy(to).add(new Vector3(-Math.sin(entry.yaw), 0, -Math.cos(entry.yaw)));
    }
    const matrix = new Matrix4().lookAt(to, target, new Vector3(0, 1, 0));
    flight.current = { time: 0, from: camera.position.clone(), to, fromQuaternion: camera.quaternion.clone(), toQuaternion: mode === "MASTERPLAN" ? aerial.current.quaternion.clone() : new Quaternion().setFromRotationMatrix(matrix), target, arc: 0 };
    velocity.current = { x: 0, z: 0 };
    keys.current.clear(); joystick.current = { x: 0, y: 0 };
    setTransitioning(true); onTransition(true); invalidate();
    // Selection alone must never teleport a walking player. Only explicit commands fly.
  }, [mode, request, network, camera, gl, invalidate, joystick, onTransition]);

  useEffect(() => {
    const canvas = gl.domElement;
    let pointer: { id: number; x: number; y: number } | null = null;
    const editable = (target: EventTarget | null) => target instanceof HTMLElement && !!target.closest("input, textarea, select, button, [contenteditable=true]");
    const keyDown = (event: KeyboardEvent) => {
      if (event.code === "Escape" && mode === "STREET_EXPLORE") {
        keys.current.clear(); velocity.current = { x: 0, z: 0 };
        if (document.pointerLockElement === canvas) document.exitPointerLock();
        return;
      }
      if (mode !== "STREET_EXPLORE" || flight.current || modalOpen() || editable(event.target) || event.metaKey || event.ctrlKey || event.altKey) return;
      if (["KeyW", "KeyA", "KeyS", "KeyD", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "ShiftLeft", "ShiftRight"].includes(event.code)) {
        event.preventDefault(); keys.current.add(event.code); invalidate();
      }
    };
    const keyUp = (event: KeyboardEvent) => { keys.current.delete(event.code); };
    const reset = () => { keys.current.clear(); velocity.current = { x: 0, z: 0 }; joystick.current = { x: 0, y: 0 }; pointer = null; };
    const lockChange = () => { reset(); onLock(document.pointerLockElement === canvas); };
    const look = (x: number, y: number) => {
      view.current.yaw -= x * 0.0025;
      view.current.pitch = Math.max(-1.25, Math.min(1.25, view.current.pitch - y * 0.0025)); invalidate();
    };
    const lockedMove = (event: MouseEvent) => {
      if (document.pointerLockElement === canvas && !flight.current && !modalOpen()) look(event.movementX, event.movementY);
    };
    const down = (event: PointerEvent) => {
      if (mode !== "STREET_EXPLORE" || flight.current || modalOpen() || event.button !== 0) return;
      canvas.focus({ preventScroll: true });
      if (event.pointerType === "mouse" && canvas.requestPointerLock && document.pointerLockElement !== canvas) {
        // Lock must originate from a real gesture, not the end of an asynchronous flight.
        try { const result = canvas.requestPointerLock(); if (result) void result.catch(() => onLock(false)); } catch { onLock(false); }
      }
      pointer = { id: event.pointerId, x: event.clientX, y: event.clientY };
      if (event.pointerType !== "mouse" || !canvas.requestPointerLock) canvas.setPointerCapture(event.pointerId);
    };
    const move = (event: PointerEvent) => {
      if (document.pointerLockElement === canvas || !pointer || pointer.id !== event.pointerId || modalOpen()) return;
      look(event.clientX - pointer.x, event.clientY - pointer.y);
      pointer.x = event.clientX; pointer.y = event.clientY; invalidate();
    };
    const up = (event: PointerEvent) => {
      if (pointer?.id !== event.pointerId) return;
      if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
      pointer = null;
    };
    window.addEventListener("keydown", keyDown); window.addEventListener("keyup", keyUp);
    document.addEventListener("pointerlockchange", lockChange); document.addEventListener("mousemove", lockedMove);
    window.addEventListener("blur", reset); document.addEventListener("visibilitychange", reset);
    canvas.addEventListener("pointerdown", down); canvas.addEventListener("pointermove", move);
    canvas.addEventListener("pointerup", up); canvas.addEventListener("pointercancel", up);
    return () => {
      reset(); window.removeEventListener("keydown", keyDown); window.removeEventListener("keyup", keyUp);
      document.removeEventListener("pointerlockchange", lockChange); document.removeEventListener("mousemove", lockedMove);
      if (document.pointerLockElement === canvas) document.exitPointerLock();
      window.removeEventListener("blur", reset); document.removeEventListener("visibilitychange", reset);
      canvas.removeEventListener("pointerdown", down); canvas.removeEventListener("pointermove", move);
      canvas.removeEventListener("pointerup", up); canvas.removeEventListener("pointercancel", up);
    };
  }, [mode, gl, invalidate, joystick, onLock]);

  useFrame((_, elapsed) => {
    const delta = Math.min(elapsed, 0.05);
    if (flight.current) {
      const f = flight.current;
      f.time = Math.min(1, f.time + delta / 1.3);
      const t = f.time * f.time * (3 - 2 * f.time);
      camera.position.lerpVectors(f.from, f.to, t);
      camera.position.y += Math.sin(Math.PI * t) * f.arc;
      camera.quaternion.slerpQuaternions(f.fromQuaternion, f.toQuaternion, t);
      if (f.time === 1) {
        controls.current?.target.copy(f.target);
        const angles = new Euler().setFromQuaternion(camera.quaternion, "YXZ");
        view.current = { yaw: angles.y, pitch: angles.x };
        flight.current = null; setTransitioning(false); onTransition(false);
        orbitTarget.current.copy(f.target);
        if (mode === "STREET_EXPLORE" && !modalOpen()) { gl.domElement.tabIndex = 0; gl.domElement.focus({ preventScroll: true }); }
        onPosition([camera.position.x, camera.position.y, camera.position.z]);
      }
      invalidate(); return;
    }
    if (mode !== "STREET_EXPLORE") {
      if (controls.current) orbitTarget.current.copy(controls.current.target);
      if (reported.current.distanceToSquared(camera.position) > 1e-10) {
        reported.current.copy(camera.position);
        onPosition([camera.position.x, camera.position.y, camera.position.z]);
      }
      return;
    }
    const blockedByModal = modalOpen();
    if (wasModalOpen.current && !blockedByModal) gl.domElement.focus({ preventScroll: true });
    wasModalOpen.current = blockedByModal;
    if (!blockedByModal && !document.hidden) {
      const pressed = (...codes: string[]) => codes.some((code) => keys.current.has(code)) ? 1 : 0;
      let right = pressed("KeyD", "ArrowRight") - pressed("KeyA", "ArrowLeft") + joystick.current.x;
      let forward = pressed("KeyW", "ArrowUp") - pressed("KeyS", "ArrowDown") - joystick.current.y;
      const length = Math.max(1, Math.hypot(right, forward)); right /= length; forward /= length;
      const speed = (pressed("ShiftLeft", "ShiftRight") || joystick.current.sprint ? 6.5 : 3.5) * network.bodyScale;
      const { yaw, pitch } = view.current;
      const damping = 1 - Math.exp(-12 * delta);
      velocity.current.x += ((Math.cos(yaw) * right - Math.sin(yaw) * forward) * speed - velocity.current.x) * damping;
      velocity.current.z += ((-Math.sin(yaw) * right - Math.cos(yaw) * forward) * speed - velocity.current.z) * damping;
      const [x, z] = moveOnRoad(network, [camera.position.x, camera.position.z],
        velocity.current.x * delta, velocity.current.z * delta);
      camera.position.set(x, network.eyeHeight, z);
      camera.quaternion.setFromEuler(new Euler(pitch, yaw, 0, "YXZ"));
    } else {
      keys.current.clear(); velocity.current = { x: 0, z: 0 }; joystick.current = { x: 0, y: 0 };
      if (document.pointerLockElement === gl.domElement) document.exitPointerLock();
    }
    telemetry.current += delta;
    if (telemetry.current > 0.2) {
      telemetry.current = 0; onPosition([camera.position.x, camera.position.y, camera.position.z]);
      // Small contextual target only: nearest house in a narrow forward cone.
      let best: string | null = null, distance = 18 * network.bodyScale;
      for (const p of placements) {
        if (p.lot.isRC) continue;
        const dx = p.position.x - camera.position.x, dz = p.position.z - camera.position.z;
        const d = Math.hypot(dx, dz);
        if (d < distance && (-Math.sin(view.current.yaw) * dx - Math.cos(view.current.yaw) * dz) / d > 0.9) { best = p.lot.lotId; distance = d; }
      }
      onTarget(best);
    }
    invalidate();
  });
  return mode === "STREET_EXPLORE" || transitioning || previousMode.current !== mode ? null : <OrbitControls ref={controls} makeDefault target={orbitTarget.current}
    minDistance={1} maxDistance={220} maxPolarAngle={Math.PI / 2.03} />;
}
