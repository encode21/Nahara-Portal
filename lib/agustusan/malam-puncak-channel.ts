import type { RundownCueKind } from "@/lib/constants/agustusan-rundown";

export type MalamPuncakCue = {
  slotId: string | null;
  mode: RundownCueKind;
  src: string | null;
  title: string;
  playing: boolean;
  volume: number;
  at: number;
};

export type MalamPuncakMessage =
  | { type: "cue"; cue: MalamPuncakCue }
  | { type: "hello" }
  | { type: "pong"; at: number };

export const IDLE_CUE: MalamPuncakCue = {
  slotId: null,
  mode: "idle",
  src: null,
  title: "Malam Puncak",
  playing: false,
  volume: 1,
  at: 0,
};

export function malamPuncakChannelName(year: number): string {
  return `nahara-malam-puncak-${year}`;
}

export function malamPuncakStorageKey(year: number): string {
  return `nahara:malam-puncak:${year}:cue`;
}

export function readStoredCue(year: number): MalamPuncakCue {
  if (typeof window === "undefined") return IDLE_CUE;
  try {
    const raw = window.localStorage.getItem(malamPuncakStorageKey(year));
    if (!raw) return { ...IDLE_CUE };
    const parsed = JSON.parse(raw) as MalamPuncakCue;
    if (!parsed || typeof parsed !== "object") return { ...IDLE_CUE };
    return {
      ...IDLE_CUE,
      ...parsed,
      volume: clampVolume(parsed.volume),
    };
  } catch {
    return { ...IDLE_CUE };
  }
}

export function writeStoredCue(year: number, cue: MalamPuncakCue): void {
  window.localStorage.setItem(
    malamPuncakStorageKey(year),
    JSON.stringify(cue),
  );
}

export function clampVolume(value: number | undefined): number {
  if (typeof value !== "number" || Number.isNaN(value)) return 1;
  return Math.min(1, Math.max(0, value));
}

export function createMalamPuncakChannel(
  year: number,
  onMessage: (msg: MalamPuncakMessage) => void,
): BroadcastChannel | null {
  if (typeof window === "undefined" || typeof BroadcastChannel === "undefined") {
    return null;
  }
  const channel = new BroadcastChannel(malamPuncakChannelName(year));
  channel.onmessage = (event: MessageEvent<MalamPuncakMessage>) => {
    onMessage(event.data);
  };
  return channel;
}

export function postCue(
  channel: BroadcastChannel | null,
  year: number,
  cue: MalamPuncakCue,
): void {
  writeStoredCue(year, cue);
  channel?.postMessage({ type: "cue", cue } satisfies MalamPuncakMessage);
}
