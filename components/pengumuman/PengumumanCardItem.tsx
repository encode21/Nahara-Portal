"use client";

import type { Pengumuman } from "@/lib/types";
import { formatShortDate } from "@/lib/utils";
import { StoredImage } from "@/components/ui/StoredImage";
import { Calendar, ChevronRight, Pencil, Trash2 } from "lucide-react";

type Props = {
  item: Pengumuman;
  isAdmin: boolean;
  onOpen: () => void;
  onEdit: () => void;
  onDelete: () => void;
};

export function PengumumanCardItem({ item, isAdmin, onOpen, onEdit, onDelete }: Props) {
  const excerpt = item.isi?.trim() || "Ketuk untuk melihat detail pengumuman.";

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-all hover:border-gold/40 hover:shadow-md">
      <button
        type="button"
        onClick={onOpen}
        className="flex flex-1 flex-col text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/50"
      >
        <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100">
          {item.image_url ? (
            <StoredImage
              src={item.image_url}
              alt=""
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-gradient-to-br from-gold/10 to-slate-50 px-4">
              <p className="line-clamp-4 text-center text-sm text-slate-500">{excerpt}</p>
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/50 to-transparent px-3 pb-3 pt-8">
            <span className="inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-medium text-slate-700">
              <Calendar className="h-3 w-3" />
              {formatShortDate(item.created_at)}
            </span>
          </div>
        </div>

        <div className="flex flex-1 flex-col p-4">
          <h2 className="line-clamp-2 font-semibold text-slate-900 group-hover:text-gold-dark">
            {item.judul}
          </h2>
          {item.image_url && item.isi && (
            <p className="mt-2 line-clamp-2 text-sm text-slate-500">{item.isi}</p>
          )}
          <span className="mt-auto flex items-center gap-1 pt-3 text-xs font-medium text-gold-dark">
            Baca selengkapnya
            <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </span>
        </div>
      </button>

      {isAdmin && (
        <div className="absolute right-2 top-2 flex gap-1">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="rounded-lg bg-white/95 p-1.5 text-slate-500 shadow-sm hover:text-gold-dark"
            aria-label="Edit"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="rounded-lg bg-white/95 p-1.5 text-slate-500 shadow-sm hover:text-red-600"
            aria-label="Hapus"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      )}
    </article>
  );
}
