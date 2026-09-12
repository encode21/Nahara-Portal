import { getPortalOrigin } from "@/lib/host";
import { gempaShareText } from "@/lib/lingkungan/gempa-shared";

export function buildGempaSharePayload(input: {
  title: string;
  detail?: string | null;
  summary?: string | null;
  sourceUrl?: string | null;
}) {
  const portalUrl = `${getPortalOrigin()}/notifikasi`;
  const text = gempaShareText({ ...input, portalUrl });
  return { text, portalUrl, title: "Nahara Alert — Gempa BMKG" };
}

export async function shareGempaAlert(input: {
  title: string;
  detail?: string | null;
  summary?: string | null;
  sourceUrl?: string | null;
}): Promise<"shared" | "copied" | "whatsapp" | "cancelled" | "failed"> {
  const { text, portalUrl, title } = buildGempaSharePayload(input);

  if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
    try {
      await navigator.share({ title, text, url: portalUrl });
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
    /* fall through */
  }

  try {
    const wa = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(wa, "_blank", "noopener,noreferrer");
    return "whatsapp";
  } catch {
    window.prompt("Salin teks alert gempa:", text);
    return "failed";
  }
}
