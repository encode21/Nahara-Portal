export const EMERGENCY_STATUS_FLOW = [
  "Dilaporkan",
  "Diterima",
  "Menuju Lokasi",
  "Bantuan Dihubungi",
  "Terkendali",
  "Selesai",
] as const;

export const EMERGENCY_KIND_LABEL: Record<string, string> = {
  kebakaran: "Kebakaran",
  medis: "Medis",
  keamanan: "Keamanan",
  bencana: "Bencana",
  lainnya: "Lainnya",
};
