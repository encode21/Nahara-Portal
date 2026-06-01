type StoredImageProps = {
  src: string;
  alt: string;
  className?: string;
};

/** Gambar dari Supabase Storage (public URL) */
export function StoredImage({ src, alt, className }: StoredImageProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} className={className} loading="lazy" />
  );
}
