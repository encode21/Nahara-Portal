import type { RundownCueKind } from "@/lib/constants/agustusan-rundown";

export type MalamPuncakCue = {
  slotId: string | null;
  mode: RundownCueKind;
  src: string | null;
  title: string;
  playing: boolean;
  loop: boolean;
  volume: number;
  at: number;
  /** YouTube playlist id (PL…) diputar di belakang logo */
  youtubeList: string | null;
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
  loop: false,
  volume: 1,
  at: 0,
  youtubeList: null,
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
      youtubeList:
        typeof parsed.youtubeList === "string" && parsed.youtubeList
          ? parsed.youtubeList
          : null,
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

export function malamPuncakPlaylistUrlKey(year: number): string {
  return `nahara:malam-puncak:${year}:yt-playlist-url`;
}

/** Ambil id playlist dari tautan YouTube (playlist?list= / watch?list= / id mentah). */
export function parseYoutubePlaylistId(input: string): string | null {
  const t = input.trim();
  if (!t) return null;
  try {
    const u = new URL(t);
    const list = u.searchParams.get("list");
    if (list && list.length >= 10) return list;
  } catch {
    /* not a URL */
  }
  if (/^PL[\w-]+$/i.test(t)) return t;
  return null;
}
