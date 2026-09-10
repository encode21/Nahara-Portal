export type WeatherSnapshot = {
  temperatureC: number;
  feelsLikeC: number;
  humidity: number;
  windSpeedKmh: number;
  weatherCode: number;
  observedAt: string;
};

export type AirQualitySnapshot = {
  usAqi: number;
  europeanAqi: number;
  pm25: number;
  pm10: number;
  observedAt: string;
};

export type LingkunganAlertKind = "gempa" | "gunung";

export type LingkunganAlert = {
  id: string;
  kind: LingkunganAlertKind;
  title: string;
  detail: string;
  levelLabel?: string;
  severity: "info" | "watch" | "warning";
  occurredAt?: string;
  sourceUrl: string;
  sourceName: string;
};

export type LingkunganSnapshot = {
  locationLabel: string;
  weather: WeatherSnapshot | null;
  airQuality: AirQualitySnapshot | null;
  alerts: LingkunganAlert[];
  fetchedAt: string;
  errors: string[];
};
