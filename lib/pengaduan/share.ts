import { buildPortalUrl } from "@/lib/host";
import type { Pengaduan } from "@/lib/types";

export function pengaduanShareUrl(pengaduanId: string): string {
  return buildPortalUrl(`/pengaduan/${pengaduanId}`);
}

export function pengaduanSharePayload(pengaduan: Pick<
  Pengaduan,
  "id" | "kode" | "kategori" | "deskripsi"
>) {
  const url = pengaduanShareUrl(pengaduan.id);
  const kode = pengaduan.kode ?? pengaduan.id.slice(0, 8);
  const title = `Pengaduan ${pengaduan.kategori} · ${kode}`;
  const ringkas =
    pengaduan.deskripsi.length > 120
      ? `${pengaduan.deskripsi.slice(0, 120)}…`
      : pengaduan.deskripsi;
  const text = `Pengaduan ${pengaduan.kategori} di Cluster Nahara\n${ringkas}\n\nLihat & balas: ${url}`;
  return { url, title, text, kode };
}

export async function sharePengaduan(
  pengaduan: Pick<Pengaduan, "id" | "kode" | "kategori" | "deskripsi">,
): Promise<"shared" | "copied" | "whatsapp" | "cancelled" | "failed"> {
  const { url, title, text } = pengaduanSharePayload(pengaduan);

  if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
    try {
      await navigator.share({ title, text, url });
      return "shared";
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        return "cancelled";
      }
      // continue to fallbacks
    }
  }

  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(`${text}`);
      return "copied";
    }
  } catch {
    // continue
  }

  // WhatsApp fallback — works well for warga on mobile
  try {
    const wa = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(wa, "_blank", "noopener,noreferrer");
    return "whatsapp";
  } catch {
    window.prompt("Salin tautan pengaduan:", url);
    return "failed";
  }
}
