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
  /** YouTube playlist id (PL…) */
  youtubeList: string | null;
  /** YouTube video id (11 karakter, dari watch?v=) */
  youtubeVideo: string | null;
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
  youtubeVideo: null,
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
      youtubeVideo:
        typeof parsed.youtubeVideo === "string" && parsed.youtubeVideo
          ? parsed.youtubeVideo
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

/** Playlist id dan/atau video id dari tautan YouTube. */
export function parseYoutubeMedia(input: string): {
  listId: string | null;
  videoId: string | null;
} {
  const t = input.trim();
  if (!t) return { listId: null, videoId: null };
  if (/^PL[\w-]+$/i.test(t)) return { listId: t, videoId: null };
  if (/^[\w-]{11}$/.test(t)) return { listId: null, videoId: t };
  try {
    const u = new URL(t);
    let listId = u.searchParams.get("list");
    let videoId = u.searchParams.get("v");
    if (u.hostname.replace(/^www\./, "") === "youtu.be") {
      videoId = u.pathname.replace(/^\//, "").split("/")[0] || videoId;
    }
    const embed = u.pathname.match(/\/embed\/([^/?]+)/);
    if (embed && embed[1] !== "videoseries") videoId = embed[1];
    const shorts = u.pathname.match(/\/shorts\/([^/?]+)/);
    if (shorts) videoId = shorts[1];
    if (listId && listId.length < 10) listId = null;
    if (videoId && !/^[\w-]{11}$/.test(videoId)) videoId = null;
    return { listId, videoId };
  } catch {
    return { listId: null, videoId: null };
  }
}

export function hasYoutubeMedia(cue: Pick<MalamPuncakCue, "youtubeList" | "youtubeVideo">): boolean {
  return Boolean(cue.youtubeList || cue.youtubeVideo);
}
