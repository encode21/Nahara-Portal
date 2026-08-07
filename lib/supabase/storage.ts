import type { SupabaseClient } from "@supabase/supabase-js";

export const UPLOAD_BUCKET = "nahara-uploads";
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;

export type UploadFolder = "kegiatan" | "pengumuman" | "pengaduan" | "agustusan";

const FOLDER_SET = new Set<string>([
  "kegiatan",
  "pengumuman",
  "pengaduan",
  "agustusan",
]);

const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

function publicObjectMarker(): string {
  return `/storage/v1/object/public/${UPLOAD_BUCKET}/`;
}

/** True if URL is an https public object under nahara-uploads (optional folder). */
export function isPortalStorageUrl(
  url: string | null | undefined,
  folder?: UploadFolder
): boolean {
  if (!url) return false;
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return false;
  const marker = publicObjectMarker();
  const idx = parsed.pathname.indexOf(marker);
  if (idx === -1) return false;
  const objectPath = decodeURIComponent(parsed.pathname.slice(idx + marker.length));
  if (!objectPath || objectPath.includes("..")) return false;
  const top = objectPath.split("/")[0];
  if (!FOLDER_SET.has(top)) return false;
  if (folder && top !== folder) return false;
  return true;
}

async function sniffImageMime(file: File): Promise<string | null> {
  const buf = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  if (buf.length < 3) return null;
  // JPEG
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";
  // PNG
  if (
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47
  ) {
    return "image/png";
  }
  // GIF
  if (
    buf[0] === 0x47 &&
    buf[1] === 0x49 &&
    buf[2] === 0x46 &&
    buf[3] === 0x38
  ) {
    return "image/gif";
  }
  // WebP: RIFF....WEBP
  if (
    buf.length >= 12 &&
    buf[0] === 0x52 &&
    buf[1] === 0x49 &&
    buf[2] === 0x46 &&
    buf[3] === 0x46 &&
    buf[8] === 0x57 &&
    buf[9] === 0x45 &&
    buf[10] === 0x42 &&
    buf[11] === 0x50
  ) {
    return "image/webp";
  }
  return null;
}

export async function validateImageFile(file: File): Promise<string | null> {
  if (file.size > MAX_IMAGE_BYTES) {
    return "Ukuran maksimal 5 MB.";
  }
  const sniffed = await sniffImageMime(file);
  if (!sniffed || !ALLOWED_IMAGE_TYPES.includes(sniffed as (typeof ALLOWED_IMAGE_TYPES)[number])) {
    return "Format harus JPG, PNG, WebP, atau GIF.";
  }
  if (
    file.type &&
    ALLOWED_IMAGE_TYPES.includes(file.type as (typeof ALLOWED_IMAGE_TYPES)[number]) &&
    file.type !== sniffed
  ) {
    return "Tipe file tidak cocok dengan isi gambar.";
  }
  return null;
}

function extensionForMime(mime: string): string {
  return MIME_TO_EXT[mime] ?? "jpg";
}

export async function uploadPortalImage(
  supabase: SupabaseClient,
  file: File,
  folder: UploadFolder
): Promise<{ url: string | null; error: string | null }> {
  const validation = await validateImageFile(file);
  if (validation) return { url: null, error: validation };

  const sniffed = (await sniffImageMime(file))!;
  const ext = extensionForMime(sniffed);
  const path = `${folder}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(UPLOAD_BUCKET)
    .upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: sniffed,
    });

  if (uploadError) {
    return { url: null, error: uploadError.message };
  }

  const { data } = supabase.storage.from(UPLOAD_BUCKET).getPublicUrl(path);
  return { url: data.publicUrl, error: null };
}

export function storagePathFromPublicUrl(url: string): string | null {
  if (!isPortalStorageUrl(url)) return null;
  const marker = publicObjectMarker();
  try {
    const parsed = new URL(url);
    const idx = parsed.pathname.indexOf(marker);
    if (idx === -1) return null;
    return decodeURIComponent(parsed.pathname.slice(idx + marker.length));
  } catch {
    return null;
  }
}

export async function removePortalImage(
  supabase: SupabaseClient,
  publicUrl: string | null | undefined
): Promise<void> {
  if (!publicUrl || !isPortalStorageUrl(publicUrl)) return;
  const path = storagePathFromPublicUrl(publicUrl);
  if (!path) return;
  await supabase.storage.from(UPLOAD_BUCKET).remove([path]);
}
