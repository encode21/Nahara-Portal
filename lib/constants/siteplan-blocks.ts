/** Siteplan raster — viewBox SVG harus sama persis dengan ukuran file ini */
export const SITEPLAN_IMAGE = {
  src: "/siteplan.jpg",
  width: 1024,
  height: 984,
} as const;

/** Area fasilitas / RC */
export const SITEPLAN_RC_BOUNDS: Record<
  string,
  { x: number; y: number; w: number; h: number }
> = {
  "RC-1": { x: 918, y: 308, w: 58, h: 82 },
  "RC-2": { x: 918, y: 498, w: 58, h: 40 },
  "RC-3": { x: 918, y: 540, w: 58, h: 40 },
  "RC-4": { x: 914, y: 128, w: 62, h: 178 },
};
