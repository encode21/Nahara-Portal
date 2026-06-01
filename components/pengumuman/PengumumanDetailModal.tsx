"use client";

import { useEffect } from "react";
import type { Pengumuman } from "@/lib/types";
import { formatShortDate } from "@/lib/utils";
import { StoredImage } from "@/components/ui/StoredImage";
import { Calendar, Pencil, Trash2, X } from "lucide-react";

type Props = {
  item: Pengumuman | null;
  open: boolean;
  isAdmin: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
};

export function PengumumanDetailModal({
  item,
  open,
  isAdmin,
  onClose,
  onEdit,
  onDelete,
}: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open || !item) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pengumuman-detail-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
        onClick={onClose}
        aria-label="Tutup"
      />

      <div className="relative z-10 flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:max-h-[85vh] sm:rounded-2xl">
        <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-4 py-3">
          <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
            <Calendar className="h-3.5 w-3.5" />
            {formatShortDate(item.created_at)}
          </span>
          <div className="flex items-center gap-1">
            {isAdmin && (
              <>
                <button
                  type="button"
                  onClick={onEdit}
                  className="rounded-lg p-2 text-slate-500 hover:bg-gold/10 hover:text-gold-dark"
                  aria-label="Edit"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={onDelete}
                  className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-600"
                  aria-label="Hapus"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </>
            )}
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              aria-label="Tutup"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto overscroll-contain">
          {item.image_url && (
            <StoredImage
              src={item.image_url}
              alt={item.judul}
              className="w-full max-h-72 object-cover"
            />
          )}

          <div className="space-y-4 p-5">
            <h2
              id="pengumuman-detail-title"
              className="font-display text-xl font-bold leading-snug text-slate-900"
            >
              {item.judul}
            </h2>

            {item.isi ? (
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-600">
                {item.isi}
              </p>
            ) : (
              <p className="text-sm italic text-slate-400">Tidak ada deskripsi tambahan.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
