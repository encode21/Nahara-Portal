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

/** Judul SEO landing — frasa pencarian utama di depan */
export const LANDING_SITE_TITLE =
  "Cluster Nahara Cimanggis Golf Estate (CGE) | Paguyuban Warga";

export const LANDING_SITE_DESCRIPTION =
  "Situs resmi Cluster Nahara di Cimanggis Golf Estate (CGE), Depok. Paguyuban warga Nahara Cimanggis: pengumuman, Agustusan, pengaduan lingkungan, dan info komunitas — nahara.id.";

/** Judul app portal warga */
export const SITE_TITLE = "Nahara Portal Warga";

export const SITE_DESCRIPTION =
  "Portal resmi warga Cluster Nahara, Cimanggis Golf Estate (CGE) — pengumuman, kegiatan, iuran, pengaduan, peta lingkungan, CCTV, dan info keamanan dalam satu aplikasi.";

export const SITE_SHORT_NAME = "Nahara";

/** Open Graph / social share image (1200×630) */
export const OG_IMAGE_PATH = "/og.png";

/** Keywords & frasa pencarian yang relevan ke nahara.id */
export const SITE_KEYWORDS = [
  "cluster nahara",
  "Cluster Nahara",
  "cimanggis golf estate nahara",
  "Cimanggis Golf Estate Nahara",
  "cge",
  "CGE",
  "CGE Cimanggis",
  "nahara cimanggis",
  "Nahara Cimanggis",
  "cluster cimanggis golf estate",
  "Cimanggis Golf Estate",
  "paguyuban nahara",
  "Paguyuban Warga Cluster Nahara",
  "paguyuban warga nahara",
  "perumahan cluster nahara",
  "perumahan Cimanggis Golf Estate",
  "cluster nahara depok",
  "nahara depok",
  "nahara.id",
  "Nahara Cluster",
  "pengumuman warga nahara",
  "agustusan cluster nahara",
  "pengaduan lingkungan nahara",
];

export const THEME_COLOR = "#c9a84c";
