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

export const AGUSTUSAN_TITLE = "Agustusan HUT RI ke-81";

export const AGUSTUSAN_TAGLINE =
  "Dari Kita untuk Kita Semua — E Pluribus Unum Annuit Coeptis";

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
};

/** Circle hole on twibbon-frame-circle.png (canvas coords, size 1024) */
export const TWIBBON_PHOTO_CIRCLE = {
  cx: 660,
  cy: 406,
  r: 364,
} as const;

export const AGUSTUSAN_MEDIA = {
  hero: "/assets/agustusan/hero-banner.png",
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
