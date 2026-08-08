export const PENGADUAN_STATUSES = [
  "Baru",
  "Diproses",
  "Ditolak",
  "Selesai",
] as const;

export type PengaduanStatus = (typeof PENGADUAN_STATUSES)[number];

export const PENGADUAN_KATEGORI = [
  "Keamanan",
  "Kebersihan",
  "Infrastruktur",
  "Lainnya",
] as const;

export type PengaduanTabId =
  | "semua"
  | "validasi"
  | "diproses"
  | "ditolak"
  | "selesai";

export const PENGADUAN_TABS: {
  id: PengaduanTabId;
  label: string;
  status: PengaduanStatus | null;
}[] = [
  { id: "semua", label: "Semua", status: null },
  { id: "validasi", label: "Validasi", status: "Baru" },
  { id: "diproses", label: "Diproses", status: "Diproses" },
  { id: "ditolak", label: "Ditolak", status: "Ditolak" },
  { id: "selesai", label: "Selesai", status: "Selesai" },
];

export const PENGADUAN_STATUS_COLORS: Record<PengaduanStatus, string> = {
  Baru: "#3b82f6",
  Diproses: "#d97706",
  Ditolak: "#dc2626",
  Selesai: "#059669",
};

export function pengaduanStatusLabel(status: string): string {
  switch (status) {
    case "Baru":
      return "Menunggu Validasi";
    case "Diproses":
      return "Diproses";
    case "Ditolak":
      return "Ditolak";
    case "Selesai":
      return "Selesai";
    default:
      return status;
  }
}

export function tabFromSearch(value: string | null): PengaduanTabId {
  if (
    value === "validasi" ||
    value === "diproses" ||
    value === "ditolak" ||
    value === "selesai" ||
    value === "semua"
  ) {
    return value;
  }
  return "semua";
}

export function statusForTab(tab: PengaduanTabId): PengaduanStatus | null {
  return PENGADUAN_TABS.find((t) => t.id === tab)?.status ?? null;
}
