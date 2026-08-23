import { buildLandingUrl } from "@/lib/host";

/** Publik share ke landing agar mudah dibagikan lewat WA tanpa domain portal. */
export function agustusanFeedbackShareUrl(): string {
  return buildLandingUrl("/agustusan/masukan");
}

export function agustusanFeedbackSharePayload(year: number, title?: string) {
  const url = agustusanFeedbackShareUrl();
  const eventLabel = title?.trim() || `Agustusan ${year}`;
  const shareTitle = `Rating & usulan — ${eventLabel}`;
  const text =
    `Bantu panitia evaluasi ${eventLabel}.\n` +
    `Kasih rating, usul lomba/perbaikan tahun depan, dan lihat masukan warga lain.\n\n` +
    `${url}`;
  return { url, title: shareTitle, text };
}

export async function shareAgustusanFeedback(
  year: number,
  title?: string,
): Promise<"shared" | "copied" | "whatsapp" | "cancelled" | "failed"> {
  const { url, title: shareTitle, text } = agustusanFeedbackSharePayload(year, title);

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
    window.prompt("Salin tautan rating Agustusan:", url);
    return "failed";
  }
}
