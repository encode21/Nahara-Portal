/**
 * Configurable thresholds for Situation Center derivations.
 * Documented so Ops can tune without hunting magic numbers.
 *
 * Wind speeds use Open-Meteo `wind_speed_10m` (km/h).
 * Beaufort-inspired resident-friendly bands (not official BMKG warnings).
 */
export const SITUATION_THRESHOLDS = {
  wind: {
    /** Below this → Normal */
    warningKmh: 40,
    /** At/above this → Critical (very strong / hazardous outdoor) */
    criticalKmh: 60,
  },
  /**
   * Observation age beyond which we treat live data as stale
   * (do not confidently label "Normal").
   */
  staleAfterMs: 2 * 60 * 60 * 1000,
  /**
   * WMO weather codes (Open-Meteo) treated as heavy rain risk.
   * 63/65 = moderate/heavy rain; 81/82 = heavy showers.
   */
  heavyRainCodes: [63, 65, 81, 82] as readonly number[],
  /**
   * WMO codes indicating thunderstorm / lightning potential.
   * We do NOT claim precise lightning tracking — only weather-code risk.
   */
  lightningCodes: [95, 96, 99] as readonly number[],
  /**
   * AQI (US) → situation level mapping uses usAqiBand tones;
   * moderate stays informational for residents.
   */
} as const;
