/** Cluster Nahara — Cimanggis Golf Estate, Depok */
export const LINGKUNGAN_LOCATION = {
  label: "Cimanggis, Depok",
  latitude: -6.3945,
  longitude: 106.85,
} as const;

/** Cache TTL for external lingkungan fetches (seconds) */
export const LINGKUNGAN_REVALIDATE_SEC = 15 * 60;

type WindyEmbedOptions = {
  zoom?: number;
  /** e.g. wind | rain | radar | temp | clouds */
  overlay?: string;
};

/** Official Windy embed (main windy.com blocks iframe) */
export function getWindyEmbedUrl({
  zoom = 8,
  overlay = "radar",
}: WindyEmbedOptions = {}): string {
  const { latitude: lat, longitude: lon } = LINGKUNGAN_LOCATION;
  const params = new URLSearchParams({
    lat: String(lat),
    lon: String(lon),
    zoom: String(zoom),
    level: "surface",
    overlay,
    menu: "",
    message: "true",
    marker: "true",
    calendar: "now",
    pressure: "",
    type: "map",
    location: "coordinates",
    detail: "true",
    detailLat: String(lat),
    detailLon: String(lon),
    metricWind: "default",
    metricTemp: "°C",
    radarRange: "-1",
  });
  return `https://embed.windy.com/embed2.html?${params.toString()}`;
}

export function getWindyFullUrl(): string {
  const { latitude: lat, longitude: lon } = LINGKUNGAN_LOCATION;
  return `https://www.windy.com/${lat}/${lon}?radar,${lat},${lon},8`;
}
