const DRIVE_HOSTS = new Set(["drive.google.com", "docs.google.com"]);

/** Canonical public folder URL without /u/N/ (account-specific path). */
export function normalizeGoogleDriveUrl(
  raw: string | null | undefined
): string | null {
  const trimmed = raw?.trim() ?? "";
  if (!trimmed) return null;

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return null;
  }

  if (parsed.protocol !== "https:") return null;
  if (!DRIVE_HOSTS.has(parsed.hostname)) return null;

  const folderMatch = parsed.pathname.match(
    /\/(?:drive\/(?:u\/\d+\/)?folders|folderview)\/([a-zA-Z0-9_-]+)/
  );
  if (folderMatch?.[1]) {
    return `https://drive.google.com/drive/folders/${folderMatch[1]}`;
  }

  // File or open links — keep host/path, strip query noise except id=
  const idParam = parsed.searchParams.get("id");
  if (idParam && /^[a-zA-Z0-9_-]+$/.test(idParam)) {
    if (parsed.pathname.includes("/file/") || parsed.pathname.includes("open")) {
      return `https://drive.google.com/file/d/${idParam}/view`;
    }
    return `https://drive.google.com/drive/folders/${idParam}`;
  }

  const fileMatch = parsed.pathname.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileMatch?.[1]) {
    return `https://drive.google.com/file/d/${fileMatch[1]}/view`;
  }

  // Accept already-canonical folder/file paths without /u/N/
  if (
    parsed.pathname.startsWith("/drive/folders/") ||
    parsed.pathname.startsWith("/file/d/")
  ) {
    return `${parsed.origin}${parsed.pathname.replace(/\/$/, "")}`;
  }

  return null;
}

export function isValidGoogleDriveUrl(raw: string | null | undefined): boolean {
  return normalizeGoogleDriveUrl(raw) !== null;
}
