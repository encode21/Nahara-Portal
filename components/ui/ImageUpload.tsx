"use client";

import { useRef, useState } from "react";
import { ImagePlus, X, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { uploadPortalImage, type UploadFolder } from "@/lib/supabase/storage";
import { StoredImage } from "@/components/ui/StoredImage";

type ImageUploadProps = {
  folder: UploadFolder;
  value: string | null;
  onChange: (url: string | null) => void;
  disabled?: boolean;
  label?: string;
  hint?: string;
};

export function ImageUpload({
  folder,
  value,
  onChange,
  disabled = false,
  label = "Gambar",
  hint = "JPG, PNG, WebP, atau GIF — maks. 5 MB",
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File | null) {
    if (!file || disabled) return;
    setError(null);
    setUploading(true);
    const supabase = createClient();
    const { url, error: uploadError } = await uploadPortalImage(supabase, file, folder);
    setUploading(false);
    if (uploadError || !url) {
      setError(uploadError ?? "Gagal mengunggah gambar.");
      return;
    }
    onChange(url);
  }

  return (
    <div>
      <label className="label">{label}</label>
      {value ? (
        <div className="relative overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
          <StoredImage
            src={value}
            alt="Preview"
            className="max-h-48 w-full object-cover"
          />
          {!disabled && (
            <button
              type="button"
              onClick={() => onChange(null)}
              className="absolute right-2 top-2 rounded-full bg-white/90 p-1.5 text-slate-600 shadow hover:text-red-600"
              aria-label="Hapus gambar"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      ) : (
        <button
          type="button"
          disabled={disabled || uploading}
          onClick={() => inputRef.current?.click()}
          className="flex w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-sm text-slate-500 transition-colors hover:border-gold/40 hover:bg-gold/5 disabled:opacity-50"
        >
          {uploading ? (
            <>
              <Loader2 className="h-8 w-8 animate-spin text-gold-dark" />
              Mengunggah...
            </>
          ) : (
            <>
              <ImagePlus className="h-8 w-8 text-slate-400" />
              Klik untuk pilih gambar
            </>
          )}
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        disabled={disabled || uploading}
        onChange={(e) => {
          const file = e.target.files?.[0] ?? null;
          void handleFile(file);
          e.target.value = "";
        }}
      />
      {!value && !uploading && (
        <p className="mt-1.5 text-xs text-slate-400">{hint}</p>
      )}
      {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
    </div>
  );
}
