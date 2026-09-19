"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Activity } from "@/lib/types";
import { LoadingSpinner } from "@/components/ui/Loading";
import { MultiImageUpload } from "@/components/ui/MultiImageUpload";
import { dispatchNotificationPush } from "@/lib/notifications/api";

type Props = {
  activity: Activity | null;
  onClose: () => void;
};

export function ActivityFormModal({ activity, onClose }: Props) {
  const supabase = useMemo(() => createClient(), []);
  const isEdit = !!activity;

  const [title, setTitle] = useState(activity?.title ?? "");
  const [description, setDescription] = useState(activity?.description ?? "");
  const [date, setDate] = useState(
    activity?.date
      ? new Date(activity.date).toISOString().slice(0, 16)
      : ""
  );
  const [location, setLocation] = useState(activity?.location ?? "");
  const [maxParticipants, setMaxParticipants] = useState(
    activity?.max_participants?.toString() ?? ""
  );
  const [registrationFee, setRegistrationFee] = useState(
    activity?.registration_fee?.toString() ?? "0"
  );
  const [imageUrls, setImageUrls] = useState<string[]>(
    activity?.image_url ? [activity.image_url] : []
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!activity) return;
    async function loadImages() {
      const { data, error: imagesError } = await supabase
        .from("activity_images")
        .select("image_url")
        .eq("activity_id", activity!.id)
        .order("sort_order");
      if (!imagesError && data && data.length > 0) {
        setImageUrls(data.map((item: { image_url: string }) => item.image_url));
      }
    }
    void loadImages();
  }, [activity, supabase]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const payload = {
      title: title.trim(),
      description: description.trim() || null,
      date: new Date(date).toISOString(),
      location: location.trim() || null,
      max_participants: maxParticipants ? parseInt(maxParticipants, 10) : null,
      registration_fee: parseInt(registrationFee, 10) || 0,
      image_url: imageUrls[0] ?? null,
    };

    const result = isEdit
      ? await supabase
          .from("activities")
          .update(payload)
          .eq("id", activity!.id)
          .select("id")
          .maybeSingle()
      : await supabase.from("activities").insert(payload).select("id").single();

    if (result.error) {
      setLoading(false);
      setError("Gagal menyimpan kegiatan.");
      return;
    }

    const id = (result.data as { id?: string } | null)?.id ?? activity?.id;
    if (id) {
      const { error: imagesError } = await supabase.rpc("replace_activity_images", {
        p_activity_id: id,
        p_image_urls: imageUrls,
      });

      if (imagesError) {
        setLoading(false);
        setError("Kegiatan tersimpan, tetapi galeri foto gagal diperbarui. Coba simpan kembali.");
        return;
      }

      dispatchNotificationPush({
        sourceType: "activities",
        sourceId: id,
        type: isEdit ? "event_updated" : "event_created",
      });
    }

    setLoading(false);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">
            {isEdit ? "Edit Kegiatan" : "Tambah Kegiatan"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="title" className="label">Judul</label>
            <input
              id="title"
              className="input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div>
            <label htmlFor="description" className="label">Deskripsi</label>
            <textarea
              id="description"
              className="input min-h-[80px] resize-y"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <MultiImageUpload
            folder="kegiatan"
            values={imageUrls}
            onChange={setImageUrls}
            max={5}
            label="Poster / Dokumentasi Kegiatan"
          />

          <div>
            <label htmlFor="date" className="label">Tanggal & Waktu</label>
            <input
              id="date"
              type="datetime-local"
              className="input"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          <div>
            <label htmlFor="location" className="label">Lokasi</label>
            <input
              id="location"
              className="input"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="max" className="label">Max Peserta</label>
              <input
                id="max"
                type="number"
                min="1"
                className="input"
                value={maxParticipants}
                onChange={(e) => setMaxParticipants(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="fee" className="label">Iuran (Rp)</label>
              <input
                id="fee"
                type="number"
                min="0"
                className="input"
                value={registrationFee}
                onChange={(e) => setRegistrationFee(e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" className="btn-secondary flex-1" onClick={onClose}>
              Batal
            </button>
            <button type="submit" className="btn-primary flex-1" disabled={loading}>
              {loading ? <LoadingSpinner /> : isEdit ? "Simpan" : "Tambah"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
