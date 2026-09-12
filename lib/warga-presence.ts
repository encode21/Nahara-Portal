/** Online if last heartbeat within this window. */
export const WARGA_ONLINE_MS = 5 * 60 * 1000;
export const WARGA_ACTIVE_7D_MS = 7 * 24 * 60 * 60 * 1000;
export const WARGA_INACTIVE_30D_MS = 30 * 24 * 60 * 60 * 1000;

export function isWargaOnline(
  lastSeenAt: string | null | undefined,
  now = Date.now()
): boolean {
  if (!lastSeenAt) return false;
  const t = new Date(lastSeenAt).getTime();
  if (Number.isNaN(t)) return false;
  return now - t <= WARGA_ONLINE_MS;
}

export function isWargaActive7d(
  lastSeenAt: string | null | undefined,
  now = Date.now()
): boolean {
  if (!lastSeenAt) return false;
  const t = new Date(lastSeenAt).getTime();
  if (Number.isNaN(t)) return false;
  return now - t <= WARGA_ACTIVE_7D_MS;
}

export function isWargaInactive30d(
  lastSeenAt: string | null | undefined,
  now = Date.now()
): boolean {
  if (!lastSeenAt) return true;
  const t = new Date(lastSeenAt).getTime();
  if (Number.isNaN(t)) return true;
  return now - t > WARGA_INACTIVE_30D_MS;
}
