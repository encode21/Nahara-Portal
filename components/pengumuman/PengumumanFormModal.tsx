"use client";

import { ImageUpload } from "@/components/ui/ImageUpload";

type FormState = {
  judul: string;
  isi: string;
  image_url: string | null;
};

type Props = {
  open: boolean;
  editId: string | null;
  form: FormState;
  error: string | null;
  onChange: (form: FormState) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
};

export function PengumumanFormModal({
  open,
  editId,
  form,
  error,
  onChange,
  onSubmit,
  onClose,
}: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-label="Tutup"
      />
      <form
        onSubmit={onSubmit}
        className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
      >
        <h3 className="font-display text-lg font-semibold text-slate-900">
          {editId ? "Edit Pengumuman" : "Tambah Pengumuman"}
        </h3>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

        <div className="mt-4 space-y-4">
          <div>
            <label className="label">Judul</label>
            <input
              className="input"
              placeholder="Contoh: Rapat RT Bulan Juni"
              value={form.judul}
              onChange={(e) => onChange({ ...form, judul: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="label">Isi Pengumuman</label>
            <textarea
              className="input"
              rows={5}
              placeholder="Tulis detail pengumuman di sini..."
              value={form.isi}
              onChange={(e) => onChange({ ...form, isi: e.target.value })}
            />
          </div>
          <ImageUpload
            folder="pengumuman"
            value={form.image_url}
            onChange={(image_url) => onChange({ ...form, image_url })}
            label="Gambar Pengumuman"
          />
        </div>

        <div className="mt-6 flex gap-2">
          <button type="submit" className="btn-primary flex-1">Simpan</button>
          <button type="button" className="btn-secondary flex-1" onClick={onClose}>
            Batal
          </button>
        </div>
      </form>
    </div>
  );
}
