/** Marker so pengeluaran kas ↔ donasi can be reversed on delete. */
const MARKER = /^\[Kas→Donasi:([0-9a-f-]{36})\]\s*/i;

export function buildKasToDonasiDescription(
  campaignId: string,
  campaignTitle: string,
  note?: string
): string {
  const base = `[Kas→Donasi:${campaignId}] Transfer kas → ${campaignTitle}`;
  const trimmed = note?.trim();
  return trimmed ? `${base} — ${trimmed}` : base;
}

export function parseKasToDonasiCampaignId(description: string): string | null {
  const match = description.match(MARKER);
  return match?.[1] ?? null;
}
