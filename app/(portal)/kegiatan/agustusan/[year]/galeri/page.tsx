"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { ExternalLink, Images, Play } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { EventEdition, EventGalleryItem, EventPeakRegistration, GalleryMediaType } from "@/lib/types";
import {
  AGUSTUSAN_MEDIA,
  AGUSTUSAN_YEAR,
  GALLERY_FILTER_CATEGORIES,
  GALLERY_FILTER_LABELS,
  type GalleryFilterCategory,
} from "@/lib/constants/agustusan";
import { peakRegistrationsToGalleryItems } from "@/lib/agustusan/gallery";
import { normalizeGoogleDriveUrl } from "@/lib/validation/driveUrl";
import { Skeleton } from "@/components/ui/Loading";
import { StoredImage } from "@/components/ui/StoredImage";

type FilterKey = "all" | GalleryFilterCategory;
type MediaTab = GalleryMediaType;

function GaleriSkeleton() {
  return (
    <div className="space-y-8" role="status" aria-busy="true" aria-label="Memuat galeri">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-3">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-9 w-64 sm:w-80" />
          <Skeleton className="h-4 w-56 sm:w-72" />
        </div>
        <Skeleton className="h-4 w-48" />
      </div>

      <div className="flex flex-wrap gap-2">
        <Skeleton className="h-10 w-24 rounded-lg" />
        <Skeleton className="h-10 w-24 rounded-lg" />
      </div>

      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-20 rounded-lg" />
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="overflow-hidden">
            <Skeleton className="aspect-[4/3] w-full rounded-none" />
            <Skeleton className="mt-0 h-8 w-full rounded-none bg-slate-100" />
          </div>
        ))}
      </div>
      <span className="sr-only">Memuat galeri…</span>
    </div>
  );
}

function asGalleryItem(
  item: EventGalleryItem
): EventGalleryItem {
  return {
    ...item,
    media_type: item.media_type === "video" ? "video" : "image",
    video_url: item.video_url ?? null,
  };
}

export default function GaleriDokumentasiPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const year = Number(params.year);
  const supabase = useMemo(() => createClient(), []);
  const [edition, setEdition] = useState<EventEdition | null>(null);
  const [items, setItems] = useState<EventGalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<EventGalleryItem | null>(null);
  const [filter, setFilter] = useState<FilterKey>("all");
  const [mediaTab, setMediaTab] = useState<MediaTab>(
    searchParams.get("media") === "video" ? "video" : "image"
  );

  useEffect(() => {
    if (searchParams.get("media") === "video") {
      setMediaTab("video");
      setFilter("all");
    }
  }, [searchParams]);

  useEffect(() => {
    async function load() {
      const { data: ed } = await supabase
        .from("event_editions")
        .select("*")
        .eq("year", year)
        .maybeSingle();
      const editionRow = (ed ?? null) as EventEdition | null;
      setEdition(editionRow);

      if (!editionRow) {
        setLoading(false);
        return;
      }

      const [galleryRes, peakRes] = await Promise.all([
        supabase
          .from("event_gallery_items")
          .select("*")
          .eq("edition_id", editionRow.id)
          .eq("is_published", true)
          .order("sort_order", { ascending: true })
          .order("created_at", { ascending: false }),
        supabase
          .from("event_peak_registrations")
          .select("*")
          .eq("edition_id", editionRow.id)
          .neq("status", "cancelled")
          .not("twibbon_url", "is", null)
          .order("created_at", { ascending: false }),
      ]);

      const { data, error } = galleryRes;
      const regItems = peakRegistrationsToGalleryItems(
        (peakRes.data ?? []) as EventPeakRegistration[],
        editionRow.id
      );

      if (error || !data?.length) {
        if (year === AGUSTUSAN_YEAR) {
          setItems([
            ...AGUSTUSAN_MEDIA.gallery.map((g, i) => ({
              id: `local-${i}`,
              edition_id: editionRow.id,
              image_url: g.src,
              media_type: "image" as const,
              video_url: null,
              caption: g.alt,
              category: "dokumentasi",
              sort_order: i,
              is_published: true,
              created_at: new Date().toISOString(),
            })),
            ...regItems,
          ]);
        } else {
          setItems(regItems);
        }
      } else {
        setItems([
          ...(data as EventGalleryItem[]).map(asGalleryItem),
          ...regItems,
        ]);
      }
      setLoading(false);
    }

    if (Number.isFinite(year)) load();
  }, [supabase, year]);

  const imageItems = useMemo(
    () => items.filter((i) => i.media_type !== "video"),
    [items]
  );
  const videoItems = useMemo(
    () =>
      items
        .filter((i) => i.media_type === "video")
        .sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        ),
    [items]
  );
  const tabItems = mediaTab === "video" ? videoItems : imageItems;

  const counts = useMemo(() => {
    const map: Record<string, number> = { all: tabItems.length };
    for (const c of GALLERY_FILTER_CATEGORIES) map[c] = 0;
    for (const item of tabItems) {
      const key = item.category in map ? item.category : "dokumentasi";
      map[key] = (map[key] ?? 0) + 1;
    }
    return map;
  }, [tabItems]);

  const filtered = useMemo(() => {
    if (filter === "all") return tabItems;
    return tabItems.filter((item) => item.category === filter);
  }, [filter, tabItems]);

  const driveUrl = normalizeGoogleDriveUrl(edition?.gallery_drive_url);

  if (loading) {
    return <GaleriSkeleton />;
  }

  if (!edition) {
    return <p className="py-12 text-center text-slate-600">Edisi tidak ditemukan.</p>;
  }

  const chips: { key: FilterKey; label: string }[] = [
    { key: "all", label: "Semua" },
    ...GALLERY_FILTER_CATEGORIES.map((key) => ({
      key,
      label: GALLERY_FILTER_LABELS[key],
    })),
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link
            href={`/kegiatan/agustusan/${year}`}
            className="text-sm text-slate-500 hover:text-accent"
          >
            ← {edition.title}
          </Link>
          <h1 className="mt-2 flex items-center gap-2 font-display text-3xl font-bold text-slate-900">
            <Images className="h-7 w-7 text-[#9b1b23]" />
            Galeri & Dokumentasi
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Dokumentasi visual Agustusan {edition.year} Cluster Nahara.
          </p>
        </div>
        {driveUrl && (
          <a
            href={driveUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#9a7b2e] hover:underline"
          >
            Arsip lengkap di Google Drive
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {(
          [
            { id: "image" as const, label: "Foto", count: imageItems.length },
            { id: "video" as const, label: "Video", count: videoItems.length },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => {
              setMediaTab(tab.id);
              setFilter("all");
            }}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
              mediaTab === tab.id
                ? "bg-[#9b1b23] text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            {tab.label}
            <span
              className={`ml-1.5 tabular-nums ${
                mediaTab === tab.id ? "text-white/80" : "text-slate-500"
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {tabItems.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {chips.map(({ key, label }) => {
            const count = counts[key] ?? 0;
            if (key !== "all" && count === 0) return null;
            const selected = filter === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setFilter(key)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                  selected
                    ? "bg-slate-800 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {label}
                <span
                  className={`ml-1.5 tabular-nums ${
                    selected ? "text-white/80" : "text-slate-500"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 px-6 py-12 text-center text-sm text-slate-500">
          {tabItems.length === 0 ? (
            <>
              {mediaTab === "video"
                ? "Belum ada video highlight di portal."
                : "Belum ada foto di galeri."}
              {driveUrl && (
                <>
                  {" "}
                  Lihat arsip di{" "}
                  <a
                    href={driveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-[#9a7b2e] hover:underline"
                  >
                    Google Drive
                  </a>
                  .
                </>
              )}
            </>
          ) : (
            `Tidak ada ${mediaTab === "video" ? "video" : "foto"} di kategori ini.`
          )}
        </div>
      ) : (
        <div
          className={
            mediaTab === "video"
              ? "grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 md:grid-cols-4 lg:grid-cols-5"
              : "grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-3"
          }
        >
          {filtered.map((item) => {
            const isLocal = item.image_url.startsWith("/");
            const isVideo = item.media_type === "video";
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActive(item)}
                className={`group relative overflow-hidden bg-slate-100 text-left ${
                  isVideo ? "aspect-[9/16]" : "aspect-[4/3]"
                }`}
              >
                {isLocal ? (
                  <Image
                    src={item.image_url}
                    alt={item.caption ?? "Dokumentasi"}
                    fill
                    className="object-cover transition duration-300 group-hover:scale-[1.03]"
                    sizes="(max-width: 768px) 50vw, 33vw"
                  />
                ) : (
                  <StoredImage
                    src={item.image_url}
                    alt={item.caption ?? "Dokumentasi"}
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                  />
                )}
                {isVideo && (
                  <span className="absolute inset-0 flex items-center justify-center">
                    <span className="rounded-full bg-black/55 p-3 text-white shadow-sm">
                      <Play className="h-6 w-6 fill-current" />
                    </span>
                  </span>
                )}
                {item.caption && (
                  <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-2 pb-2 pt-6 text-xs text-white opacity-0 transition group-hover:opacity-100 sm:opacity-100">
                    {item.caption}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {active && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 p-4"
          onClick={() => setActive(null)}
          role="dialog"
          aria-modal
        >
          <div
            className="relative max-h-[90vh] w-full max-w-4xl"
            onClick={(e) => e.stopPropagation()}
          >
            {active.media_type === "video" && active.video_url ? (
              <video
                className="mx-auto max-h-[80vh] w-full max-w-md bg-black"
                controls
                autoPlay
                playsInline
                poster={active.image_url}
                src={active.video_url}
              >
                Browser Anda tidak mendukung pemutar video.
              </video>
            ) : active.image_url.startsWith("/") ? (
              <Image
                src={active.image_url}
                alt={active.caption ?? "Dokumentasi"}
                width={1600}
                height={1200}
                className="max-h-[80vh] w-full object-contain"
              />
            ) : (
              <StoredImage
                src={active.image_url}
                alt={active.caption ?? "Dokumentasi"}
                className="max-h-[80vh] w-full object-contain"
              />
            )}
            {active.caption && (
              <p className="mt-3 text-center text-sm text-white/90">{active.caption}</p>
            )}
            <button
              type="button"
              onClick={() => setActive(null)}
              className="absolute -top-2 right-0 rounded-lg bg-white/90 px-3 py-1.5 text-sm font-medium text-slate-800"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
