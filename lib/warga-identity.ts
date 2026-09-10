export const WARGA_IDENTITY_KEY = "nahara.warga_identity";
export const WARGA_IDENTITY_DISMISS_KEY = "nahara.warga_identity_dismissed";

export type WargaIdentity = {
  wargaId: string;
  nama: string;
  blok: string;
  confirmedAt: string;
};

export function readWargaIdentity(): WargaIdentity | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(WARGA_IDENTITY_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as WargaIdentity;
    if (!parsed?.wargaId || !parsed?.nama || !parsed?.blok) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeWargaIdentity(identity: WargaIdentity): void {
  localStorage.setItem(WARGA_IDENTITY_KEY, JSON.stringify(identity));
  localStorage.removeItem(WARGA_IDENTITY_DISMISS_KEY);
}

export function clearWargaIdentity(): void {
  localStorage.removeItem(WARGA_IDENTITY_KEY);
}

export function isWargaIdentityDismissed(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(WARGA_IDENTITY_DISMISS_KEY) === "1";
  } catch {
    return false;
  }
}

export function dismissWargaIdentityPrompt(): void {
  localStorage.setItem(WARGA_IDENTITY_DISMISS_KEY, "1");
}

export function resetWargaIdentityDismiss(): void {
  localStorage.removeItem(WARGA_IDENTITY_DISMISS_KEY);
}
