import type { WargaWithIuran } from "../types";
import { statusLabel } from "./preview-status";

export type ResidentAudience = "public" | "resident" | "ops" | "admin";
export type ResidentPresentation = { address: string; name?: string; occupancy?: string; status?: string };

/** Presentation allowlist, not a substitute for server-side authorization/RLS.
 * Never pass raw resident objects to in-world labels (phone, email, payments, etc.). */
export function residentPresentation(address: string, audience: ResidentAudience, resident?: WargaWithIuran): ResidentPresentation {
  if (audience === "public") return { address };
  const result: ResidentPresentation = { address, name: resident?.nama || undefined };
  if (audience === "ops" || audience === "admin") result.occupancy = resident?.status_hunian;
  // Existing ops roles are finance restricted: only admin gets payment status.
  if (audience === "admin") result.status = statusLabel(resident);
  return result;
}
