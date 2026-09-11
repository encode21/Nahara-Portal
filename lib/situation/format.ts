/** Parse Open-Meteo local times (often without offset) as WIB. */
export function parseObservedAt(iso?: string | null): Date | null {
  if (!iso) return null;
  const d = new Date(
    iso.includes("T") && !iso.includes("+") && !iso.endsWith("Z")
      ? `${iso}:00+07:00`
      : iso,
  );
  return Number.isNaN(d.getTime()) ? null : d;
}

export function isStale(
  observedAt: string | undefined,
  staleAfterMs: number,
  nowMs = Date.now(),
): boolean {
  const d = parseObservedAt(observedAt);
  if (!d) return false;
  return nowMs - d.getTime() > staleAfterMs;
}

export function formatRelativeId(
  iso?: string | null,
  nowMs = Date.now(),
): string | null {
  const d = parseObservedAt(iso);
  if (!d) return null;
  const diffMin = Math.round((nowMs - d.getTime()) / 60_000);
  if (diffMin < 1) return "baru saja";
  if (diffMin < 60) return `${diffMin} menit lalu`;
  const hours = Math.round(diffMin / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.round(hours / 24);
  return `${days} hari lalu`;
}

export function formatClockWib(iso?: string | null): string | null {
  const d = parseObservedAt(iso);
  if (!d) return null;
  return d.toLocaleString("id-ID", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  });
}
