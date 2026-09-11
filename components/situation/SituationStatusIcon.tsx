import type { LucideIcon } from "lucide-react";
import {
  Activity,
  CloudLightning,
  CloudRain,
  CloudSun,
  DoorOpen,
  Droplet,
  Droplets,
  Flame,
  Leaf,
  Mountain,
  Route,
  Shield,
  TreePine,
  Waves,
  Wind,
  Zap,
} from "lucide-react";
import type { SituationIconKey } from "@/lib/situation/types";

const ICONS: Record<SituationIconKey, LucideIcon> = {
  weather: CloudSun,
  aqi: Leaf,
  wind: Wind,
  lightning: CloudLightning,
  rain: CloudRain,
  flood: Waves,
  drainage: Droplets,
  tree: TreePine,
  electricity: Zap,
  water: Droplet,
  gate: DoorOpen,
  security: Shield,
  fire: Flame,
  earthquake: Activity,
  volcano: Mountain,
  road: Route,
  smoke: Flame,
};

export function SituationStatusIcon({
  name,
  className,
}: {
  name: SituationIconKey;
  className?: string;
}) {
  const Icon = ICONS[name] ?? CloudSun;
  return <Icon className={className} aria-hidden strokeWidth={1.75} />;
}
