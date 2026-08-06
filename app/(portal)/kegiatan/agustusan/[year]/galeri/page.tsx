"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Images } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { EventEdition, EventGalleryItem } from "@/lib/types";
import { AGUSTUSAN_MEDIA, AGUSTUSAN_YEAR } from "@/lib/constants/agustusan";
import { LoadingSpinner } from "@/components/ui/Loading";
import { StoredImage } from "@/components/ui/StoredImage";

export default function GaleriDokumentasiPage() {
  const params = useParams();
  const year = Number(params.year);
  const supabase = useMemo(() => createClient(), []);
  const [edition, setEdition] = useState<EventEdition | null>(null);
  const [items, setItems] = useState<EventGalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<EventGalleryItem | null>(null);

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

      const { data, error } = await supabase
        .from("event_gallery_items")
        .select("*")
        .eq("edition_id", editionRow.id)
        .eq("is_published", true)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false });

      if (error || !data?.length) {
        // Fallback aset lokal jika tabel belum di-seed / kosong
        if (year === AGUSTUSAN_YEAR) {
          setItems(
            AGUSTUSAN_MEDIA.gallery.map((g, i) => ({
              id: `local-${i}`,
              edition_id: editionRow.id,
              image_url: g.src,
              caption: g.alt,
              sort_order: i,
              is_published: true,
              created_at: new Date().toISOString(),
            }))
          );
        } else {
          setItems([]);
        }
      } else {
        setItems(data as EventGalleryItem[]);
      }
      setLoading(false);
    }

    if (Number.isFinite(year)) load();
  }, [supabase, year]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner className="h-8 w-8" />
      </div>
    );
  }

  if (!edition) {
    return <p className="py-12 text-center text-slate-600">Edisi tidak ditemukan.</p>;
  }

  return (
    <div className="space-y-8">
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

      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 px-6 py-12 text-center text-sm text-slate-500">
          Belum ada foto di galeri. Panitia bisa mengunggah dari menu Kelola Agustusan.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-3">
          {items.map((item) => {
            const isLocal = item.image_url.startsWith("/");
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActive(item)}
                className="group relative aspect-[4/3] overflow-hidden bg-slate-100 text-left"
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
            {active.image_url.startsWith("/") ? (
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
