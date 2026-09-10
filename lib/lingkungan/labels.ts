/** WMO Weather interpretation codes → label ID */
export function weatherLabelId(code: number): string {
  if (code === 0) return "Cerah";
  if (code === 1) return "Cerah berawan";
  if (code === 2) return "Berawan sebagian";
  if (code === 3) return "Berawan";
  if (code === 45 || code === 48) return "Berkabut";
  if (code === 51 || code === 53 || code === 55) return "Gerimis";
  if (code === 56 || code === 57) return "Gerimis beku";
  if (code === 61 || code === 63 || code === 65) return "Hujan";
  if (code === 66 || code === 67) return "Hujan beku";
  if (code === 71 || code === 73 || code === 75 || code === 77) return "Salju";
  if (code === 80 || code === 81 || code === 82) return "Hujan lokal";
  if (code === 85 || code === 86) return "Salju lokal";
  if (code === 95) return "Petir";
  if (code === 96 || code === 99) return "Petir + hujan es";
  return "Cuaca tidak diketahui";
}

export type AqiBand = {
  label: string;
  tone: "good" | "moderate" | "unhealthySensitive" | "unhealthy" | "veryUnhealthy" | "hazardous";
};

/** US AQI bands (familiar via IQAir / aplikasi kualitas udara) */
export function usAqiBand(aqi: number): AqiBand {
  if (aqi <= 50) return { label: "Baik", tone: "good" };
  if (aqi <= 100) return { label: "Sedang", tone: "moderate" };
  if (aqi <= 150) return { label: "Tidak sehat (sensitif)", tone: "unhealthySensitive" };
  if (aqi <= 200) return { label: "Tidak sehat", tone: "unhealthy" };
  if (aqi <= 300) return { label: "Sangat tidak sehat", tone: "veryUnhealthy" };
  return { label: "Berbahaya", tone: "hazardous" };
}

export const GUNUNG_STATUS: Record<number, { label: string; severity: "info" | "watch" | "warning" }> = {
  1: { label: "Normal", severity: "info" },
  2: { label: "Waspada", severity: "watch" },
  3: { label: "Siaga", severity: "warning" },
  4: { label: "Awas", severity: "warning" },
};
