import { AGUSTUSAN_MEDIA } from "@/lib/constants/agustusan";

export const MALAM_PUNCAK_DATE = "2026-08-16";
export const MALAM_PUNCAK_TZ = "Asia/Jakarta";

export type RundownCueKind = "idle" | "video" | "audio" | "embed";

export type RundownShortcut = "qr" | "spin" | "duck-race";

export type RundownCue = {
  kind: RundownCueKind;
  src: string | null;
  label?: string;
  loop?: boolean;
};

export type RundownSlot = {
  id: string;
  start: string;
  end: string;
  durationLabel: string;
  title: string;
  presenter: string;
  notes: string;
  cue: RundownCue;
  shortcuts?: RundownShortcut[];
  /** Judul pemisah di daftar operator */
  group?: string;
  /** Idle tanpa YouTube (mis. Pembacaan Doa) */
  silent?: boolean;
};

export const MALAM_PUNCAK_ASSETS = {
  indonesiaRaya: "/assets/agustusan/malam-puncak/indonesia-raya.mp4",
  registrasiLoop: "/assets/agustusan/malam-puncak/registrasi.mp4",
  idlePoster: AGUSTUSAN_MEDIA.hero,
  teaser: AGUSTUSAN_MEDIA.video,
  crazyGames: "https://www.crazygames.com/t/quiz",
  /** Tempel playlist YouTube di operator; boleh dikosongkan. */
  youtubePlaylistUrl: "",
} as const;

/** Cover carousel saat operator klik Logo / Tampilkan logo. */
export const MALAM_PUNCAK_BACKDROP_SLIDES = [
  { src: "/assets/agustusan/malam-puncak/backdrop-hut-ri.png?v=20260815" },
  { src: "/assets/agustusan/nahara-flags-banner.png" },
  { src: "/assets/agustusan/cluster-flags.png" },
  { src: "/assets/agustusan/aerial-minigolf.png" },
] as const;

export const MALAM_PUNCAK_BACKDROP_INTERVAL_MS = 8000;

export const MALAM_PUNCAK_RUNDOWN: RundownSlot[] = [
  {
    id: "registrasi",
    group: "Registrasi",
    start: "18:00",
    end: "19:30",
    durationLabel: "90 menit",
    title: "Registrasi",
    presenter: "MC Meryka",
    notes: "Video loop di projector + QR daftar",
    cue: {
      kind: "video",
      src: MALAM_PUNCAK_ASSETS.registrasiLoop,
      label: "Video Registrasi",
      loop: true,
    },
    shortcuts: ["qr"],
  },
  {
    id: "pembukaan",
    group: "Pembukaan",
    start: "19:30",
    end: "19:35",
    durationLabel: "5 menit",
    title: "Pembukaan",
    presenter: "MC Umi",
    notes: "",
    cue: { kind: "idle", src: null },
  },
  {
    id: "indonesia-raya",
    group: "Pembukaan",
    start: "19:35",
    end: "19:40",
    durationLabel: "5 menit",
    title: "Menyanyikan Indonesia Raya",
    presenter: "MC Umi",
    notes: "Putar di layar projector",
    cue: {
      kind: "video",
      src: MALAM_PUNCAK_ASSETS.indonesiaRaya,
      label: "Indonesia Raya",
    },
  },
  {
    id: "doa",
    group: "Doa",
    start: "19:40",
    end: "19:45",
    durationLabel: "5 menit",
    title: "Pembacaan Doa",
    presenter: "Mas Catur",
    notes: "Hening — tanpa lagu YouTube / organ",
    silent: true,
    cue: { kind: "idle", src: null },
  },
  {
    id: "sambutan",
    group: "Sambutan",
    start: "19:45",
    end: "20:00",
    durationLabel: "15 menit",
    title: "Sambutan",
    presenter:
      "Ketua Panitia (Mas Desandri), Ketua Paguyuban (Mba Widuri), Ketua RT (Pak Radar)",
    notes: "",
    cue: { kind: "idle", src: null },
  },
  {
    id: "tumpeng",
    group: "Sambutan",
    start: "20:00",
    end: "20:05",
    durationLabel: "5 menit",
    title: "Potong Tumpeng",
    presenter: "Ketua RT (Pak Radar)",
    notes: "",
    cue: { kind: "idle", src: null },
  },
  {
    id: "makan",
    group: "Makan & hiburan",
    start: "20:05",
    end: "23:00",
    durationLabel: "sd selesai",
    title: "Makan Bersama",
    presenter: "",
    notes: "Bersamaan dengan hiburan organ",
    cue: { kind: "idle", src: null },
  },
  {
    id: "hadiah",
    group: "Makan & hiburan",
    start: "20:05",
    end: "20:20",
    durationLabel: "15 menit",
    title: "Pembagian Hadiah",
    presenter: "",
    notes: "Diutamakan sesepuh, ketua panitia, ketua paguyuban, ketua RT",
    cue: { kind: "idle", src: null },
  },
  {
    id: "organ-awal",
    group: "Makan & hiburan",
    start: "20:05",
    end: "23:00",
    durationLabel: "sd selesai",
    title: "Hiburan (Organ Tunggal)",
    presenter: "",
    notes: "Background music; jeda saat Doa / acara resmi",
    cue: { kind: "idle", src: null },
  },
  {
    id: "tebak-cermat",
    group: "Makan & hiburan",
    start: "20:20",
    end: "20:30",
    durationLabel: "10 menit",
    title: "Games Tebak Cermat",
    presenter: "MC",
    notes: "Games di panggung",
    cue: { kind: "idle", src: null },
  },
  {
    id: "doorprize",
    group: "Makan & hiburan",
    start: "21:00",
    end: "21:15",
    durationLabel: "15 menit",
    title: "Doorprize",
    presenter: "MC Meryka, sesepuh",
    notes: "Kuis Crazy Games (Sony dan Ari)",
    cue: {
      kind: "embed",
      src: MALAM_PUNCAK_ASSETS.crazyGames,
      label: "Crazy Games",
    },
    shortcuts: ["spin"],
  },
  {
    id: "organ-lanjutan",
    group: "Makan & hiburan",
    start: "21:15",
    end: "23:00",
    durationLabel: "sd selesai",
    title: "Hiburan (Organ Tunggal) — Lanjutan",
    presenter: "",
    notes: "",
    cue: { kind: "idle", src: null },
  },
  {
    id: "closing",
    group: "Penutup",
    start: "23:00",
    end: "23:59",
    durationLabel: "selesai",
    title: "Closing",
    presenter: "MC",
    notes: "Semua rangkaian dikontrol oleh MC",
    cue: {
      kind: "video",
      src: MALAM_PUNCAK_ASSETS.teaser,
      label: "Teaser Agustusan",
    },
  },
];

function parseHm(hm: string): number {
  const [h, m] = hm.split(":").map(Number);
  return h * 60 + m;
}

/** Minutes from midnight in Asia/Jakarta. */
export function getJakartaMinutes(now = new Date()): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: MALAM_PUNCAK_TZ,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? "0");
  const minute = Number(parts.find((p) => p.type === "minute")?.value ?? "0");
  return hour * 60 + minute;
}

export function formatJakartaClock(now = new Date()): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: MALAM_PUNCAK_TZ,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).format(now);
}

export function isSlotCurrent(slot: RundownSlot, now = new Date()): boolean {
  const minutes = getJakartaMinutes(now);
  const start = parseHm(slot.start);
  const end = parseHm(slot.end);
  return minutes >= start && minutes < end;
}

export function rundownShortcutHref(
  kind: RundownShortcut,
  year: number,
): { href: string; label: string } {
  if (kind === "qr") {
    return { href: `/activities/agustusan/${year}/qr`, label: "QR Daftar" };
  }
  if (kind === "spin") {
    return {
      href: `/activities/agustusan/${year}/doorprize/spin`,
      label: "Spin Doorprize",
    };
  }
  return {
    href: `/activities/agustusan/${year}/duck-race`,
    label: "Duck Race",
  };
}
