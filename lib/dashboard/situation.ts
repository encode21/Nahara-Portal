/**
 * @deprecated Import from `@/lib/situation/aggregate` instead.
 * Kept so existing dashboard imports keep working.
 */
export {
  aggregateSituation,
  deriveSituation,
} from "@/lib/situation/aggregate";

export type {
  SituationBundle,
  SituationHeadline,
  SituationStatus,
  SituationStatusLevel,
} from "@/lib/situation/types";

/** Legacy alias used by the first SituationCenter draft */
export type SituationLevel = "normal" | "warning" | "emergency";

export type SituationSummary = {
  level: SituationLevel;
  title: string;
  detail: string;
};
