"use client";

import { useEffect, useRef, useState, type MutableRefObject, type PointerEvent } from "react";
import type { WalkInput } from "./CameraRig";

export function WalkJoystick({ input, disabled }: { input: MutableRefObject<WalkInput>; disabled: boolean }) {
  const pointer = useRef<number | null>(null);
  const [knob, setKnob] = useState({ x: 0, y: 0 });
  function reset() { pointer.current = null; input.current = { x: 0, y: 0 }; setKnob({ x: 0, y: 0 }); }
  useEffect(() => {
    const clear = () => { input.current = { x: 0, y: 0 }; pointer.current = null; setKnob({ x: 0, y: 0 }); };
    window.addEventListener("blur", clear);
    return () => { window.removeEventListener("blur", clear); input.current = { x: 0, y: 0 }; };
  }, [input]);
  function update(event: PointerEvent<HTMLDivElement>) {
    if (pointer.current !== event.pointerId || disabled) return;
    const rect = event.currentTarget.getBoundingClientRect();
    let x = (event.clientX - rect.left - rect.width / 2) / 35;
    let y = (event.clientY - rect.top - rect.height / 2) / 35;
    const length = Math.max(1, Math.hypot(x, y)); x /= length; y /= length;
    input.current = { x, y }; setKnob({ x: x * 28, y: y * 28 });
  }
  return <div role="group" aria-label="Joystick jalan" className="absolute bottom-4 left-4 flex h-28 w-28 touch-none items-center justify-center rounded-full border-2 border-white/80 bg-slate-900/50 shadow-lg"
    style={{ opacity: disabled ? 0.4 : 1 }}
    onPointerDown={(event) => { if (disabled) return; event.preventDefault(); event.stopPropagation(); pointer.current = event.pointerId; event.currentTarget.setPointerCapture(event.pointerId); update(event); }}
    onPointerMove={update} onPointerUp={reset} onPointerCancel={reset} onLostPointerCapture={reset}>
    <span className="pointer-events-none h-11 w-11 rounded-full border border-white bg-white/80" style={{ transform: `translate(${knob.x}px, ${knob.y}px)` }} />
    <span className="pointer-events-none absolute -bottom-5 text-[11px] font-medium text-slate-800">Gerak</span>
  </div>;
}
