export const LOGO_SRC = "/assets/newnahara.png";
/** Logo circular Paguyuban */
export const LOGO_BADGE_SRC = "/assets/nahara-badge.png";
/** Tulisan NAHARA saja (tanpa ikon kuning) */
export const LOGO_WORDMARK_SRC = "/assets/nahara-wordmark.png";

/** Canonical production URL (override via NEXT_PUBLIC_SITE_URL) — prefer portal warga */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  "https://portal.nahara.id";

export const SITE_TITLE = "Nahara Portal Warga";

export const SITE_DESCRIPTION =
  "Portal resmi warga Cluster Nahara, Cimanggis Golf Estate — pengumuman, kegiatan, iuran, pengaduan, peta lingkungan, CCTV, dan info keamanan dalam satu aplikasi.";

export const SITE_SHORT_NAME = "Nahara";

/** Open Graph / social share image (1200×630) */
export const OG_IMAGE_PATH = "/og.png";

export const SITE_KEYWORDS = [
  "Nahara",
  "Portal Warga",
  "Cluster Nahara",
  "Cimanggis Golf Estate",
  "Paguyuban Warga",
  "pengaduan warga",
  "iuran lingkungan",
  "kegiatan warga",
];

export const THEME_COLOR = "#c9a84c";
