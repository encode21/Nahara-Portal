import { buildLandingUrl } from "@/lib/host";

export function agustusanLpjShareUrl(): string {
  return buildLandingUrl("/agustusan/lpj");
}

export function agustusanLpjSharePayload(year: number) {
  const url = agustusanLpjShareUrl();
  const shareTitle = `LPJ Agustusan HUT RI ke-81 — Cluster Nahara`;
  const text =
    `Laporan Pertanggungjawaban dana Agustusan HUT RI ke-81 Cluster Nahara (${year}).\n` +
    `Pemasukan, pengeluaran, donatur, dan rincian belanja — terbuka untuk warga.\n\n` +
    `${url}`;
  return { url, title: shareTitle, text };
}

export async function shareAgustusanLpj(
  year: number,
): Promise<"shared" | "copied" | "whatsapp" | "cancelled" | "failed"> {
  const { url, title: shareTitle, text } = agustusanLpjSharePayload(year);

  if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
    try {
      await navigator.share({ title: shareTitle, text, url });
      return "shared";
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        return "cancelled";
      }
    }
  }

  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return "copied";
    }
  } catch {
    // continue
  }

  try {
    const wa = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(wa, "_blank", "noopener,noreferrer");
    return "whatsapp";
  } catch {
    window.prompt("Salin tautan LPJ Agustusan:", url);
    return "failed";
  }
}
