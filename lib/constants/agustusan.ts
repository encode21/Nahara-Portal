/** Fixed IDs — must match supabase seeds/migrations Agustusan */
export const AGUSTUSAN_ACTIVITY_ID = "a0812026-0000-4000-8000-000000000001";
export const AGUSTUSAN_CAMPAIGN_ID = "a0812026-0000-4000-8000-000000000002";
export const AGUSTUSAN_EDITION_ID = "a0812026-0000-4000-8000-000000000010";
export const AGUSTUSAN_YEAR = 2026;

export const AGUSTUSAN_BANK = {
  bank: "BCA",
  number: "4580329328",
  name: "Fadilla Harika Wijaya",
  contactNote:
    "Sudah transfer? Mohon kirim bukti transfer via japri ke Fadilla Harika.",
} as const;

export const AGUSTUSAN_TITLE = "Agustusan HUT ke-81 RI";

export const AGUSTUSAN_TAGLINE =
  "Dari Kita untuk Kita Semua — E Pluribus Unum Annuit Coeptis";

/** Kategori item galeri Agustusan (kolom event_gallery_items.category) */
export const GALLERY_CATEGORIES = [
  "dokumentasi",
  "twibbon",
  "lomba",
  "malam_puncak",
  "persiapan",
] as const;

export type GalleryCategory = (typeof GALLERY_CATEGORIES)[number];

export const GALLERY_CATEGORY_LABELS: Record<GalleryCategory, string> = {
  dokumentasi: "Dokumentasi",
  twibbon: "Twibbon",
  lomba: "Lomba",
  malam_puncak: "Malam Puncak",
  persiapan: "Persiapan",
};

/** Filter publik galeri — termasuk twibbon upload saat daftar malam puncak. */
export const GALLERY_FILTER_CATEGORIES = [
  ...GALLERY_CATEGORIES,
  "registrasi",
] as const;

export type GalleryFilterCategory = (typeof GALLERY_FILTER_CATEGORIES)[number];

export const GALLERY_FILTER_LABELS: Record<GalleryFilterCategory, string> = {
  ...GALLERY_CATEGORY_LABELS,
  registrasi: "Registrasi",
};

export const CONTEST_CATEGORY_LABELS: Record<string, string> = {
  ibu: "Lomba Ibu-Ibu",
  bapak: "Lomba Bapak-Bapak",
  pasangan: "Lomba Pasangan",
  dewasa_remaja: "Dewasa & Remaja",
  keluarga: "Lomba Keluarga",
  balita: "Lomba Balita",
  preteen: "Lomba Pre-Teen",
  art: "Lomba ART",
  umum: "Acara Umum",
  esport: "Esport",
};

/** Circle hole on twibbon-frame-circle.png (canvas coords, size 1024) */
export const TWIBBON_PHOTO_CIRCLE = {
  cx: 660,
  cy: 406,
  r: 364,
} as const;

export const AGUSTUSAN_MEDIA = {
  hero: "/assets/agustusan/banner_hut_ri_81_nahara.png",
  video: "/assets/agustusan/teaser.mp4",
  videoPoster: "/assets/agustusan/nahara-flags-banner.png",
  twibbonFrame: "/assets/agustusan/twibbon-frame-circle.png",
  gallery: [
    {
      src: "/assets/agustusan/nahara-flags-banner.png",
      alt: "Nahara menyambut HUT RI — banner cluster berhias bendera",
    },
    {
      src: "/assets/agustusan/lomba-suasana.png",
      alt: "Suasana lomba Agustusan di Cluster Nahara",
    },
    {
      src: "/assets/agustusan/cluster-flags.png",
      alt: "Cluster Nahara berhias bendera Merah Putih",
    },
    {
      src: "/assets/agustusan/aerial-minigolf.png",
      alt: "Area Mini Golf Cluster Nahara HUT RI",
    },
  ],
} as const;

/** Blok eligible for Malam Puncak registration (exclude row 4 & 5). */
export const PEAK_BLOK_ROWS = [
  "NHB-1",
  "NHB-2",
  "NHB-3",
  "NHB-6",
  "NHB-7",
  "NHB-8",
  "NHT-1",
  "NHT-2",
  "NHT-3",
  "NHT-6",
  "NHT-7",
  "NHT-8",
] as const;

export type PeakBlokRow = (typeof PEAK_BLOK_ROWS)[number];

export const PEAK_EVENT = {
  title: "Acara Puncak Agustusan Nahara 2026",
  subtitle: "Malam Puncak — Door Prize & Hadiah Utama",
  location: "Mini Golf Cluster Nahara",
  startsAtLabel: "Sabtu, 16 Agustus 2026 · 19:30 WIB",
  duckRaceEmbedUrl: "https://www.online-stopwatch.com/duck-race/full-screen/",
} as const;

/**
 * Toggle pendaftaran Acara Puncak via env (tanpa redeploy kode).
 * NEXT_PUBLIC_PEAK_REGISTRATION_OPEN=true|1|yes|on → dibuka
 * false / kosong / nilai lain → ditutup (default: ditutup)
 *
 * Saat acara: set true di .env / Vercel, restart/redeploy.
 * Sebelum acara (daftar offline nanti): biarkan false.
 */
export function isPeakRegistrationOpen(): boolean {
  const raw = process.env.NEXT_PUBLIC_PEAK_REGISTRATION_OPEN?.trim().toLowerCase();
  if (!raw) return false;
  return raw === "true" || raw === "1" || raw === "yes" || raw === "on";
}

export const PEAK_TERMS = [
  "Pendaftaran hanya berlaku untuk warga/rumah yang terdaftar di Nahara.",
  "Maksimal 2 peserta dari setiap rumah (suami + istri).",
  "Peserta wajib mengisi data dengan benar.",
  "Peserta wajib upload Twibbon sebelum pendaftaran dapat diselesaikan.",
  "Data pendaftaran digunakan untuk keperluan acara dan door prize.",
  "Hanya peserta yang telah terverifikasi yang masuk daftar door prize.",
  "Peserta yang tidak melakukan pendaftaran tidak akan masuk daftar Duck Race.",
  "Panitia berhak melakukan verifikasi data peserta.",
  "Setiap rumah hanya dapat terdaftar maksimal 2 orang.",
] as const;

export function twibbonLocalStorageKey(year: number): string {
  return `nahara:agustusan:${year}:lastTwibbonUrl`;
}

export function formatHouseholdLabel(
  blokRow: string,
  nomorKavling: number,
): string {
  return `${blokRow}/${String(nomorKavling).padStart(2, "0")}`;
}

export function isPeakBlokRow(value: string): value is PeakBlokRow {
  return (PEAK_BLOK_ROWS as readonly string[]).includes(value);
}
