"use client";

import { Component, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Canvas } from "@react-three/fiber";
import { LotPlates } from "@/components/3d/LotPlates";
import { HouseModels } from "@/components/3d/HouseModels";
import { Neighborhood } from "@/components/3d/Neighborhood";
import { CameraRig, type ViewMode, type WalkInput } from "@/components/3d/CameraRig";
import { WalkJoystick } from "@/components/3d/WalkJoystick";
import { createWalkNetwork, streetSpawn } from "@/lib/nahara/walk-network";
import type { LotPoly } from "@/lib/nahara/provisional-lots";
import { previewPlacement, type PreviewPlacement } from "@/lib/nahara/provisional-3d";
import { statusLabel } from "@/lib/nahara/preview-status";
import { siteplanLabelToDbBlok } from "@/lib/constants/cluster-layout";
import type { WargaWithIuran } from "@/lib/types";
import { RenderBudget, QUALITY, type SceneQuality } from "@/components/3d/RenderBudget";
import { ResidentBubbles } from "@/components/3d/ResidentBubbles";
import { ResidentPopup } from "./ResidentPopup";
import { residentPresentation, type ResidentAudience } from "@/lib/nahara/resident-presentation";
import { useAuth } from "@/lib/hooks/useAuth";

type Props = {
  lots: LotPoly[];
  selectedKey: string | null;
  lookupWarga: (lot: LotPoly) => WargaWithIuran | undefined;
  onSelect: (lot: LotPoly) => void;
  onBack: () => void;
};

const ignorePosition = () => {};
const ignoreRenderMetrics = () => {};

function SelectionBoundary({ placement }: { placement: PreviewPlacement }) {
  const vertices = useMemo(() => new Float32Array(placement.points.flatMap(([x, z]) => [x, 0.14, z])), [placement]);
  return <lineLoop>
    <bufferGeometry><bufferAttribute attach="attributes-position" args={[vertices, 3]} /></bufferGeometry>
    <lineBasicMaterial color="#2563eb" />
  </lineLoop>;
}

class SceneBoundary extends Component<{ children: ReactNode; onBack: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    return this.state.failed ? <div className="p-6 text-sm">
      <p>3D tidak dapat dimuat pada perangkat ini. Peta 2D tetap tersedia.</p>
      <button className="mt-3 min-h-10 underline" onClick={this.props.onBack}>Kembali ke 2D</button>
    </div> : this.props.children;
  }
}

export default function NaharaMap3D({ lots, selectedKey, lookupWarga, onSelect, onBack }: Props) {
  const auth = useAuth();
  const audience: ResidentAudience = auth.loading || !auth.user ? "public" : auth.isAdmin ? "admin" : auth.isStaff || auth.isWargaRegistry ? "ops" : "resident";
  const [qualityChoice, setQualityChoice] = useState<"auto" | SceneQuality>("auto");
  const [mobile, setMobile] = useState(true);
  useEffect(() => {
    const query = window.matchMedia("(max-width: 767px), (pointer: coarse)");
    const update = () => setMobile(query.matches);
    update(); query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  const quality = qualityChoice === "auto" ? mobile ? "mobile" : "standard" : qualityChoice;
  const pointerType = useRef("mouse");
  const placements = useMemo(() => lots.map(previewPlacement), [lots]);
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);
  const [mode, setMode] = useState<ViewMode>("MASTERPLAN");
  const [locked, setLocked] = useState(false);
  const [targetKey, setTargetKey] = useState<string | null>(null);
  const [showHint, setShowHint] = useState(true);
  const [request, setRequest] = useState(0);
  const [transitioning, setTransitioning] = useState(true);
  const joystick = useRef<WalkInput>({ x: 0, y: 0 });
  const streetViewport = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (mode === "STREET_EXPLORE") streetViewport.current?.scrollIntoView({ block: "center", behavior: "smooth" });
    setShowHint(true);
    const timeout = window.setTimeout(() => setShowHint(false), 9000);
    return () => window.clearTimeout(timeout);
  }, [mode]);
  const network = useMemo(() => createWalkNetwork(placements), [placements]);
  const chooseLot = useCallback((lot: LotPoly) => {
    if (mode === "STREET_EXPLORE") {
      if (pointerType.current === "touch") onSelect(lot);
      return; // Desktop click still captures mouse; touch tap selects without a camera flight.
    }
    setTransitioning(true); setMode("HOUSE_FOCUS"); setRequest((value) => value + 1); onSelect(lot);
  }, [onSelect, mode]);
  function changeView(next: ViewMode) {
    setTransitioning(true); setMode(next); setRequest((value) => value + 1);
  }
  const active = placements.find((p) => p.lot.lotId === (hoveredKey ?? selectedKey));
  const selected = placements.find((p) => p.lot.lotId === selectedKey);
  const target = placements.find((p) => p.lot.lotId === targetKey);
  const present = (p: PreviewPlacement) => residentPresentation(p.lot.isRC ? p.lot.blokKey : siteplanLabelToDbBlok(p.lot.blokKey), audience, lookupWarga(p.lot));
  const bubbleKeys = Array.from(new Set([selectedKey, mode === "STREET_EXPLORE" ? targetKey : hoveredKey].filter(Boolean)));
  const bubbles = bubbleKeys.slice(0, 2).flatMap((key) => {
    const p = placements.find((p) => p.lot.lotId === key);
    return p && !p.lot.isRC ? [{ placement: p, resident: present(p) }] : [];
  });
  useEffect(() => {
    const inspect = (event: KeyboardEvent) => {
      if (event.code !== "KeyE" || event.repeat || mode !== "STREET_EXPLORE" || transitioning || !target || document.querySelector('[role="dialog"]')) return;
      if (event.target instanceof HTMLElement && event.target.closest("input, textarea, button, [contenteditable=true]")) return;
      if (document.pointerLockElement) document.exitPointerLock();
      onSelect(target.lot);
    };
    window.addEventListener("keydown", inspect);
    return () => window.removeEventListener("keydown", inspect);
  }, [mode, transitioning, target, onSelect]);
  const spawn = useMemo(() => selected ? streetSpawn(network, selected) : null, [network, selected]);
  return <div data-scene-mode={mode} data-quality={quality} data-camera-transition={transitioning ? "moving" : "ready"}>
    <style>{`@keyframes nahara-enter { from { opacity: 0; transform: translateY(5px) scale(.97); } to { opacity: 1; transform: translateY(0) scale(1); } } .nahara-enter { animation: nahara-enter 180ms ease-out both; } @media (prefers-reduced-motion: reduce) { .nahara-enter { animation: none; } }`}</style>
    <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
      <p>3D Provisional · Belum terverifikasi · satuan tampilan, bukan meter</p>
      <div className="flex items-center gap-3">
        <label>Kualitas <select aria-label="Kualitas 3D" value={qualityChoice} onChange={(e) => setQualityChoice(e.target.value as typeof qualityChoice)} className="min-h-10 rounded border bg-white px-2">
          <option value="auto">Otomatis</option><option value="mobile">Hemat / mobile</option><option value="standard">Standar</option>
        </select></label>
        <button type="button" disabled={transitioning} className="min-h-10 underline" onClick={() => changeView("MASTERPLAN")}>← Kembali ke Peta</button>
      </div>
    </div>
    <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
      {mode !== "STREET_EXPLORE" && !selected && <>
      <button type="button" disabled={transitioning} className="min-h-10 rounded bg-slate-800 px-3 text-white disabled:opacity-40"
        onClick={() => changeView("STREET_EXPLORE")}>Jelajahi Jalan</button>
      </>}
      <span>{transitioning ? "Kamera berpindah…" : mode === "STREET_EXPLORE" ? "Street Explore" : mode === "HOUSE_FOCUS" ? "House Focus" : "Masterplan"}</span>
      {selected && !spawn && <span>Jalur depan rumah belum terhubung. Pilih rumah lain untuk mulai berjalan.</span>}
    </div>
    {selected && <ResidentPopup placement={selected} resident={present(selected)} audience={audience} onDetail={() => onSelect(selected.lot)}
      navigation={mode !== "STREET_EXPLORE" ? { disabled: transitioning, canExplore: !!spawn, onFocus: () => changeView("HOUSE_FOCUS"), onExplore: () => changeView("STREET_EXPLORE") } : undefined} />}
    <div ref={streetViewport} onPointerDownCapture={(event) => { pointerType.current = event.pointerType; }} className="relative h-[min(65vh,34rem)] min-h-80 overflow-hidden rounded-lg border bg-slate-100" data-validation-state="provisional">
      <SceneBoundary onBack={onBack}>
        <Canvas frameloop="demand" dpr={[1, QUALITY[quality].dpr]} shadows={false} camera={{ position: [80, 100, 100], fov: 45, near: 0.1, far: 500 }}
          fallback={<div className="p-6 text-sm">WebGL tidak tersedia. <button className="underline" onClick={onBack}>Kembali ke 2D</button></div>}>
          <color attach="background" args={["#dfe9ef"]} />
          <fog attach="fog" args={mode === "STREET_EXPLORE" ? ["#dfe9ef", QUALITY[quality].streetDistance * 0.65, QUALITY[quality].streetDistance] : ["#dfe9ef", 150, 320]} />
          <ambientLight intensity={1.4} />
          <directionalLight position={[30, 70, 20]} intensity={2} />
          <mesh rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[110, 106]} /><meshStandardMaterial color="#d6dccf" /></mesh>
          <LotPlates placements={placements} lookupWarga={lookupWarga} onSelect={chooseLot} onHover={setHoveredKey} />
          <HouseModels placements={placements} onSelect={chooseLot} onHover={setHoveredKey} />
          <Neighborhood network={network} placements={placements} />
          {selected && <SelectionBoundary placement={selected} />}
          <ResidentBubbles bubbles={bubbles} />
          <CameraRig mode={mode} request={request} selected={selected} placements={placements} network={network}
            joystick={joystick} onPosition={ignorePosition} onTransition={setTransitioning} onLock={setLocked} onTarget={setTargetKey} />
          <RenderBudget quality={quality} walking={mode === "STREET_EXPLORE"} onMetrics={ignoreRenderMetrics} />
        </Canvas>
      </SceneBoundary>
      <div className="pointer-events-none absolute left-3 top-3 rounded bg-white/95 px-2 py-1 text-xs font-semibold text-amber-900">Belum terverifikasi</div>
      {mode === "STREET_EXPLORE" && <>
        <WalkJoystick input={joystick} disabled={transitioning} />
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center"><span className="h-1 w-1 rounded-full bg-white shadow" /></div>
        <button type="button" className="absolute right-3 top-3 rounded bg-white/95 px-3 py-2 text-xs" onClick={() => {
          if (document.pointerLockElement) document.exitPointerLock();
          changeView("MASTERPLAN");
        }} disabled={transitioning}>← Kembali ke Peta</button>
        <div className="absolute bottom-4 right-3 max-w-48 rounded bg-white/90 p-2 text-xs text-slate-800" data-pointer-locked={locked}>
          {showHint ? <p className="pointer-events-none">WASD untuk berjalan · Mouse untuk melihat · Shift untuk berjalan cepat · ESC untuk melepas mouse. Sentuh: joystick kiri, geser kanan untuk melihat.</p> : <button onClick={() => setShowHint(true)}>Petunjuk kontrol</button>}
          {!locked && <p className="mt-1 pointer-events-none">Klik jalan untuk mengunci mouse. Jika tidak tersedia, geser untuk melihat.</p>}
        </div>
        {target && !transitioning && <div className="absolute left-1/2 top-14 -translate-x-1/2 rounded bg-white/95 p-2 text-xs">
          <p>{siteplanLabelToDbBlok(target.lot.blokKey)} · Type {target.type ?? "—"}</p>
          <p>{statusLabel(lookupWarga(target.lot))} · Belum terverifikasi</p>
          <button className="min-h-10 underline" onClick={() => { if (document.pointerLockElement) document.exitPointerLock(); onSelect(target.lot); }}>Lihat Rumah (E)</button>
        </div>}
      </>}
    </div>
    <p className="mt-2 text-xs text-slate-500">Rumah prosedural Nahara 5/7/9 · Geser untuk orbit atau melihat saat berjalan · Ketuk rumah untuk fokus dan data warga. Jalur jalan diturunkan dari ruang di antara kavling. Tinggi pandang setara 1,65 m terhadap skala model; skala kawasan tetap provisional.</p>
  </div>;
}
