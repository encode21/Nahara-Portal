import type { EventGalleryItem, EventPeakRegistration } from "@/lib/types";

/** Twibbon upload dari form registrasi malam puncak → item galeri virtual. */
export function peakRegistrationsToGalleryItems(
  rows: EventPeakRegistration[],
  editionId: string
): EventGalleryItem[] {
  return rows
    .filter(
      (r) =>
        r.status !== "cancelled" &&
        typeof r.twibbon_url === "string" &&
        r.twibbon_url.trim().length > 0
    )
    .map((r) => ({
      id: `peak-reg-${r.id}`,
      edition_id: editionId,
      image_url: r.twibbon_url,
      media_type: "image" as const,
      video_url: null,
      caption: `${r.participant_name} · ${r.household_label}`,
      category: "registrasi",
      sort_order: 9000,
      is_published: true,
      created_at: r.created_at,
    }))
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
}
