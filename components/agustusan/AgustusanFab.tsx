"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Camera, Check, MessageSquare, Share2, X } from "lucide-react";

type AgustusanFabProps = {
  year: number;
  title: string;
};

export function AgustusanFab({ year, title }: AgustusanFabProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  async function sharePage() {
    const url = `${window.location.origin}/kegiatan/agustusan/${year}`;
    const payload = {
      title,
      text: `${title} — Cluster Nahara. Ikut lomba, donasi, dan buat twibbon!`,
      url,
    };

    try {
      if (navigator.share) {
        await navigator.share(payload);
        setOpen(false);
        return;
      }
    } catch {
      /* cancel */
      return;
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Salin tautan ini:", url);
    }
  }

  return (
    <div className="fixed bottom-[max(1.25rem,env(safe-area-inset-bottom))] right-4 z-[60] flex flex-col items-end gap-2">
      {open && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-[-1] cursor-default bg-black/20"
            aria-label="Tutup menu"
            onClick={() => setOpen(false)}
          />
          <div className="mb-1 flex flex-col items-end gap-2 animate-[fadeIn_0.15s_ease-out]">
            <button
              type="button"
              onClick={sharePage}
              className="flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-medium text-slate-800 shadow-lg ring-1 ring-black/5"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 text-green-600" />
                  Tautan disalin
                </>
              ) : (
                <>
                  <Share2 className="h-4 w-4 text-[#7a1218]" />
                  Bagikan halaman
                </>
              )}
            </button>
            <Link
              href={`/kegiatan/agustusan/${year}/masukan`}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-medium text-slate-800 shadow-lg ring-1 ring-black/5"
            >
              <MessageSquare className="h-4 w-4 text-[#7a1218]" />
              Rating & usulan
            </Link>
            <Link
              href={`/kegiatan/agustusan/${year}/twibbon`}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-medium text-slate-800 shadow-lg ring-1 ring-black/5"
            >
              <Camera className="h-4 w-4 text-[#7a1218]" />
              Buat Twibbon
            </Link>
          </div>
        </>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-[#7a1218] text-white shadow-xl shadow-black/25 transition hover:bg-[#9b1b23]"
        aria-expanded={open}
        aria-label={open ? "Tutup menu aksi" : "Buka menu bagikan & twibbon"}
      >
        {open ? <X className="h-6 w-6" /> : <Share2 className="h-6 w-6" />}
      </button>
    </div>
  );
}
