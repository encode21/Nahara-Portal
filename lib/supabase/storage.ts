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

function extensionFromFile(file: File): string {
  const fromName = file.name.split(".").pop()?.toLowerCase();
  if (fromName && ["jpg", "jpeg", "png", "webp", "gif"].includes(fromName)) {
    return fromName === "jpeg" ? "jpg" : fromName;
  }
  const map: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
  };
  return map[file.type] ?? "jpg";
}

export function validateImageFile(file: File): string | null {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type as (typeof ALLOWED_IMAGE_TYPES)[number])) {
    return "Format harus JPG, PNG, WebP, atau GIF.";
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return "Ukuran maksimal 5 MB.";
  }
  return null;
}

export async function uploadPortalImage(
  supabase: SupabaseClient,
  file: File,
  folder: UploadFolder
): Promise<{ url: string | null; error: string | null }> {
  const validation = validateImageFile(file);
  if (validation) return { url: null, error: validation };

  const ext = extensionFromFile(file);
  const path = `${folder}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(UPLOAD_BUCKET)
    .upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type,
    });

  if (uploadError) {
    return { url: null, error: uploadError.message };
  }

  const { data } = supabase.storage.from(UPLOAD_BUCKET).getPublicUrl(path);
  return { url: data.publicUrl, error: null };
}

export function storagePathFromPublicUrl(url: string): string | null {
  const marker = `/storage/v1/object/public/${UPLOAD_BUCKET}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  return decodeURIComponent(url.slice(idx + marker.length));
}

export async function removePortalImage(
  supabase: SupabaseClient,
  publicUrl: string | null | undefined
): Promise<void> {
  if (!publicUrl) return;
  const path = storagePathFromPublicUrl(publicUrl);
  if (!path) return;
  await supabase.storage.from(UPLOAD_BUCKET).remove([path]);
}
