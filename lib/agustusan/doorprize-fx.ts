/** Lightweight Web Audio FX for door prize spin (no audio files). */

let sharedCtx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AC =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  if (!sharedCtx) sharedCtx = new AC();
  if (sharedCtx.state === "suspended") {
    void sharedCtx.resume();
  }
  return sharedCtx;
}

function tone(
  ctx: AudioContext,
  {
    freq,
    duration,
    type = "square",
    gain = 0.08,
    when = 0,
    slideTo,
  }: {
    freq: number;
    duration: number;
    type?: OscillatorType;
    gain?: number;
    when?: number;
    slideTo?: number;
  }
) {
  const t0 = ctx.currentTime + when;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo != null) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(1, slideTo), t0 + duration);
  }
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  osc.connect(g);
  g.connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.02);
}

/** Short click while labels flash. */
export function playSpinTick(intensity = 1) {
  const ctx = getCtx();
  if (!ctx) return;
  const f = 520 + intensity * 280;
  tone(ctx, { freq: f, duration: 0.04, type: "square", gain: 0.045 * intensity });
}

/** Rising whoosh when spin starts. */
export function playSpinStart() {
  const ctx = getCtx();
  if (!ctx) return;
  tone(ctx, {
    freq: 180,
    slideTo: 720,
    duration: 0.35,
    type: "sawtooth",
    gain: 0.06,
  });
}

/** Festive fanfare when winner is revealed. */
export function playWinnerFanfare() {
  const ctx = getCtx();
  if (!ctx) return;
  const notes = [523.25, 659.25, 783.99, 1046.5];
  notes.forEach((freq, i) => {
    tone(ctx, {
      freq,
      duration: 0.28,
      type: "triangle",
      gain: 0.1,
      when: i * 0.12,
    });
  });
  // soft boom
  tone(ctx, {
    freq: 90,
    slideTo: 40,
    duration: 0.55,
    type: "sine",
    gain: 0.12,
    when: 0.05,
  });
}

export function unlockAudio() {
  getCtx();
}
