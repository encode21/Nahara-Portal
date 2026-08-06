import type { EventContest, EventEdition } from "@/lib/types";

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
    const key = c.starts_at ? c.starts_at.slice(0, 10) : "tbd";
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
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            }).format(new Date(`${key}T12:00:00+07:00`)),
      contests: list.sort((a, b) => a.sort_order - b.sort_order),
    }));
}
