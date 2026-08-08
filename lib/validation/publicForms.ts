/** Shared limits for public form defense-in-depth (mirror DB CHECKs). */
export const PUBLIC_LIMITS = {
  nama: 80,
  deskripsi: 4000,
  pesan: 2000,
  blok: 40,
  phone: 30,
  notes: 500,
  caption: 200,
  search: 80,
} as const;

/** Strip PostgREST filter metacharacters from free-text search. */
export function sanitizeSearchTerm(raw: string): string {
  return raw
    .replace(/[%_,.()"'\\]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, PUBLIC_LIMITS.search);
}

export function clampText(value: string, max: number): string {
  return value.trim().slice(0, max);
}
