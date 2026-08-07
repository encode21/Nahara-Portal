import { isPortalStorageUrl } from "@/lib/supabase/storage";

type StoredImageProps = {
  src: string;
  alt: string;
  className?: string;
};

/** Gambar dari Supabase Storage (public URL) — host/path asing ditolak. */
export function StoredImage({ src, alt, className }: StoredImageProps) {
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

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} className={className} loading="lazy" />
  );
}
