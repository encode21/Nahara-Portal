/** Marketing reference only. Never use this as geometry or payment data. */
export const BROCHURE_REFERENCE = {
  url: "https://irp.cdn-website.com/3553c92d/files/uploaded/E-brochure%20Nahara%201.5.pdf#page=7",
  page: 7,
  scope: "Tahap 1",
  verification: "unverified",
} as const;

// Display swatches for the brochure legend; not sampled geometry or statuses.
export const BROCHURE_TYPE_LEGEND = [
  { label: "Tipe 9", color: "#cfe5e3" },
  { label: "Tipe 9 Hoek", color: "#8ed5e1" },
  { label: "Tipe 7", color: "#f7dfb4" },
  { label: "Tipe 7 Hoek", color: "#f8d978" },
  { label: "Tipe 5", color: "#ebbad6" },
  { label: "Tipe 5 Hoek", color: "#d886ba" },
] as const;

export function provisionalIdentityWarning(address: string): string | null {
  if (/^NHT-8\/0?16$/.test(address)) {
    return "Nomor 16 muncul dua kali pada peta lama. Identitas kedua bidang belum dipastikan.";
  }
  if (/^NHB-2\/0?30$/.test(address)) {
    return "Label gambar terbaca 38, sedangkan data lama memakai 30. Belum direkonsiliasi.";
  }
  if (/^NH[BT]-1\//.test(address)) {
    return "Penomoran baris 1 pada gambar dan daftar lama belum cocok seluruhnya.";
  }
  return null;
}
