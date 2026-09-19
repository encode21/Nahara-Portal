"use client";

import { ArrowLeft, ArrowRight, Plus } from "lucide-react";
import { ImageUpload } from "@/components/ui/ImageUpload";
import type { UploadFolder } from "@/lib/supabase/storage";

export function MultiImageUpload({
  folder,
  values,
  onChange,
  max = 5,
  label = "Foto kegiatan",
}: {
  folder: UploadFolder;
  values: string[];
  onChange: (values: string[]) => void;
  max?: number;
  label?: string;
}) {
  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= values.length) return;
    const next = [...values];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  return (
    <div className="space-y-3">
      <div>
        <p className="label mb-0">{label}</p>
        <p className="text-xs text-slate-400">
          Maksimal {max} foto. Foto pertama menjadi thumbnail di daftar kegiatan.
        </p>
      </div>

      {values.map((value, index) => (
        <div key={`${value}-${index}`} className="rounded-xl border border-slate-200 p-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-slate-600">
              Foto {index + 1}{index === 0 ? " · Thumbnail" : ""}
            </span>
            <div className="flex gap-1">
              <button
                type="button"
                className="rounded-lg border border-slate-200 p-1.5 text-slate-500 disabled:opacity-30"
                onClick={() => move(index, -1)}
                disabled={index === 0}
                aria-label="Geser foto ke kiri"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                className="rounded-lg border border-slate-200 p-1.5 text-slate-500 disabled:opacity-30"
                onClick={() => move(index, 1)}
                disabled={index === values.length - 1}
                aria-label="Geser foto ke kanan"
              >
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
          <ImageUpload
            folder={folder}
            value={value}
            onChange={(nextValue) => {
              if (nextValue) {
                const next = [...values];
                next[index] = nextValue;
                onChange(next);
              } else {
                onChange(values.filter((_, valueIndex) => valueIndex !== index));
              }
            }}
            label=""
          />
        </div>
      ))}

      {values.length < max && (
        <div className="rounded-xl border border-slate-200 p-3">
          <ImageUpload
            folder={folder}
            value={null}
            onChange={(url) => url && onChange([...values, url].slice(0, max))}
            label=""
            hint="JPG, PNG, WebP, atau GIF — maksimal 5 MB per foto."
          />
          <p className="mt-2 flex items-center justify-center gap-1 text-xs text-slate-400">
            <Plus className="h-3.5 w-3.5" /> Foto {values.length + 1} dari {max}
          </p>
        </div>
      )}
    </div>
  );
}
