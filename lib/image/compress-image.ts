/** Client-side JPEG recompress until under `maxBytes`. Returns null if impossible. */
export async function compressImageToMax(
  file: File,
  maxBytes: number
): Promise<File | null> {
  if (typeof window === "undefined" || typeof createImageBitmap === "undefined") {
    return null;
  }

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    return null;
  }

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    return null;
  }

  const qualities = [0.85, 0.72, 0.6, 0.48, 0.36];
  const baseName = file.name.replace(/\.[^.]+$/, "") || "image";

  try {
    for (let scale = 1; scale >= 0.35; scale -= 0.15) {
      const w = Math.max(1, Math.round(bitmap.width * scale));
      const h = Math.max(1, Math.round(bitmap.height * scale));
      canvas.width = w;
      canvas.height = h;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, w, h);
      ctx.drawImage(bitmap, 0, 0, w, h);

      for (const quality of qualities) {
        const blob = await new Promise<Blob | null>((resolve) =>
          canvas.toBlob(resolve, "image/jpeg", quality)
        );
        if (blob && blob.size <= maxBytes) {
          return new File([blob], `${baseName}.jpg`, {
            type: "image/jpeg",
            lastModified: Date.now(),
          });
        }
      }
    }
  } finally {
    bitmap.close();
  }

  return null;
}
