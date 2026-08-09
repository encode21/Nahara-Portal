export const LOGO_SRC = "/assets/newnahara.png";
/** Logo circular Paguyuban */
export const LOGO_BADGE_SRC = "/assets/nahara-badge.png";
/** Tulisan NAHARA saja (tanpa ikon kuning) */
export const LOGO_WORDMARK_SRC = "/assets/nahara-wordmark.png";

/** Public landing (indexed) */
export const LANDING_URL =
  process.env.NEXT_PUBLIC_LANDING_URL?.replace(/\/$/, "") || "https://nahara.id";

/** Portal warga (private — noindex) */
export const PORTAL_URL =
  process.env.NEXT_PUBLIC_PORTAL_URL?.replace(/\/$/, "") ||
  "https://portal.nahara.id";

/**
 * Canonical site URL for public SEO / sitemap / OG.
 * Prefer LANDING_URL; override via NEXT_PUBLIC_SITE_URL if needed.
 */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || LANDING_URL;

/** Judul SEO landing (Google: “Nahara Cluster”) */
export const LANDING_SITE_TITLE =
  "Cluster Nahara — Paguyuban Warga Cimanggis Golf Estate";

export const LANDING_SITE_DESCRIPTION =
  "Situs resmi Paguyuban Warga Cluster Nahara, Cimanggis Golf Estate. Pengumuman, kegiatan Agustusan, pengaduan lingkungan, dan info warga — tanpa login.";

/** Judul app portal warga */
export const SITE_TITLE = "Nahara Portal Warga";

export const SITE_DESCRIPTION =
  "Portal resmi warga Cluster Nahara, Cimanggis Golf Estate — pengumuman, kegiatan, iuran, pengaduan, peta lingkungan, CCTV, dan info keamanan dalam satu aplikasi.";

export const SITE_SHORT_NAME = "Nahara";

/** Open Graph / social share image (1200×630) */
export const OG_IMAGE_PATH = "/og.png";

export const SITE_KEYWORDS = [
  "Nahara",
  "Nahara Cluster",
  "Cluster Nahara",
  "Cimanggis Golf Estate",
  "Paguyuban Warga Nahara",
  "Paguyuban Nahara",
  "nahara.id",
  "perumahan Cimanggis",
  "pengumuman warga",
  "kegiatan Agustusan",
  "pengaduan lingkungan",
];

export const THEME_COLOR = "#c9a84c";
