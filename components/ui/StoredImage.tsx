"use client";

import { useCallback, useState } from "react";
import { isPortalStorageUrl } from "@/lib/supabase/storage";
import { Skeleton } from "@/components/ui/Loading";

type StoredImageProps = {
  src: string;
  alt: string;
  className?: string;
};

/** Gambar dari Supabase Storage (public URL) — host/path asing ditolak. */
export function StoredImage({ src, alt, className }: StoredImageProps) {
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  const bindImg = useCallback((el: HTMLImageElement | null) => {
    if (!el) return;
    // Cached images may skip onLoad — check complete
    if (el.complete) {
      if (el.naturalWidth > 0) setStatus("ready");
      else if (el.currentSrc) setStatus("error");
    }
  }, []);

  if (!isPortalStorageUrl(src)) {
    return (
      <div
        className={`flex items-center justify-center bg-slate-100 text-xs text-slate-400 ${className ?? ""}`}
        role="img"
        aria-label={alt}
      >
        Gambar tidak valid
      </div>
    );
  }

  const objectFit = className?.includes("object-contain")
    ? "object-contain"
    : "object-cover";

  // className (h/w/shrink/rounded) di wrapper — jangan pakai w-full kosong
  // supaya di flex row thumbnail tidak meregang penuh lebar.
  return (
    <span className={`relative block overflow-hidden ${className ?? ""}`}>
      {status === "loading" && (
        <Skeleton className="absolute inset-0 z-[1] h-full w-full rounded-[inherit]" />
      )}
      {status === "error" && (
        <span
          className="absolute inset-0 z-[1] flex items-center justify-center bg-slate-100 px-2 text-center text-xs text-slate-400"
          role="img"
          aria-label={alt}
        >
          Gagal memuat gambar
        </span>
      )}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        key={src}
        ref={bindImg}
        src={src}
        alt={alt}
        loading="lazy"
        onLoad={() => setStatus("ready")}
        onError={() => setStatus("error")}
        className={`h-full w-full ${objectFit} transition-opacity duration-300 ${
          status === "ready" ? "opacity-100" : "opacity-0"
        }`}
      />
    </span>
  );
}
