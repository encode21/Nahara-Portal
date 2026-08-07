import type { EventContest, EventContestCategory, EventEdition } from "@/lib/types";
import { TIMEZONE_JAKARTA, toJakartaDateKey } from "@/lib/utils";

export function isRegistrationOpen(
  edition: Pick<EventEdition, "registration_closes_at"> | null | undefined,
  contest: Pick<EventContest, "registration_open" | "is_competition">
): boolean {
  if (!contest.is_competition || !contest.registration_open) return false;
  if (!edition?.registration_closes_at) return true;
  return new Date(edition.registration_closes_at).getTime() > Date.now();
}

export function entryLabel(entry: {
  display_name: string;
  partner_name?: string | null;
}): string {
  return entry.partner_name
    ? `${entry.display_name} & ${entry.partner_name}`
    : entry.display_name;
}

export function groupContestsByDay(contests: EventContest[]): {
  key: string;
  label: string;
  contests: EventContest[];
}[] {
  const map = new Map<string, EventContest[]>();
  for (const c of contests) {
    const key = c.starts_at ? toJakartaDateKey(c.starts_at) : "tbd";
    const list = map.get(key) ?? [];
    list.push(c);
    map.set(key, list);
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, list]) => ({
      key,
      label:
        key === "tbd"
          ? "Jadwal menyusul"
          : new Intl.DateTimeFormat("id-ID", {
              timeZone: TIMEZONE_JAKARTA,
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            }).format(new Date(`${key}T12:00:00+07:00`)),
      contests: list.sort((a, b) => a.sort_order - b.sort_order),
    }));
}

/** ISO timestamptz → value for `<input type="datetime-local">` in Asia/Jakarta */
export function toDatetimeLocalWib(iso: string | null | undefined): string {
  if (!iso) return "";
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE_JAKARTA,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date(iso));
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  let hour = get("hour");
  if (hour === "24") hour = "00";
  return `${get("year")}-${get("month")}-${get("day")}T${hour}:${get("minute")}`;
}

/** datetime-local (WIB wall clock) → ISO string for DB */
export function fromDatetimeLocalWib(value: string): string | null {
  const v = value.trim();
  if (!v) return null;
  const withSeconds = v.length === 16 ? `${v}:00` : v;
  return new Date(`${withSeconds}+07:00`).toISOString();
}

export const CONTEST_CATEGORIES: EventContestCategory[] = [
  "ibu",
  "bapak",
  "pasangan",
  "dewasa_remaja",
  "keluarga",
  "balita",
  "preteen",
  "art",
  "umum",
];
