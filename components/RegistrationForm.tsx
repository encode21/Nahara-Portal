"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Activity } from "@/lib/types";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { LoadingSpinner } from "@/components/ui/Loading";

type Props = {
  onSuccess: (data: {
    name: string;
    activityTitle: string;
    activityDate: string;
    registrationFee: number;
  }) => void;
};

export function RegistrationForm({ onSuccess }: Props) {
  const supabase = createClient();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [participantCounts, setParticipantCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [activityId, setActivityId] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [blockNumber, setBlockNumber] = useState("");

  useEffect(() => {
    async function loadActivities() {
      const { data, error: fetchError } = await supabase
        .from("activities")
        .select("*")
        .gte("date", new Date().toISOString())
        .order("date", { ascending: true });

      if (fetchError) {
        setError("Gagal memuat daftar kegiatan.");
        setLoading(false);
        return;
      }

      const acts = (data ?? []) as Activity[];
      setActivities(acts);

      if (acts.length > 0) {
        const { data: participants } = await supabase
          .from("participants")
          .select("activity_id");

        const counts: Record<string, number> = {};
        (participants ?? []).forEach((p: { activity_id: string }) => {
          counts[p.activity_id] = (counts[p.activity_id] ?? 0) + 1;
        });
        setParticipantCounts(counts);
      }

      setLoading(false);
    }

    loadActivities();
  }, [supabase]);

  const selectedActivity = activities.find((a) => a.id === activityId);
  const selectedCount = activityId ? participantCounts[activityId] ?? 0 : 0;
  const isFull =
    selectedActivity?.max_participants != null &&
    selectedCount >= selectedActivity.max_participants;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!activityId || !name.trim()) {
      setError("Pilih kegiatan dan isi nama lengkap.");
      return;
    }

    if (isFull) {
      setError("Kegiatan ini sudah penuh.");
      return;
    }

    setSubmitting(true);

    const { error: insertError } = await supabase.from("participants").insert({
      activity_id: activityId,
      name: name.trim(),
      phone: phone.trim() || null,
      block_number: blockNumber.trim() || null,
      payment_status: false,
      attendance_status: false,
    });

    setSubmitting(false);

    if (insertError) {
      setError("Gagal mendaftar. Silakan coba lagi.");
      return;
    }

    onSuccess({
      name: name.trim(),
      activityTitle: selectedActivity!.title,
      activityDate: selectedActivity!.date,
      registrationFee: selectedActivity!.registration_fee,
    });
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner className="h-8 w-8" />
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="card text-center">
        <p className="text-slate-600">
          Belum ada kegiatan yang tersedia untuk pendaftaran.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="card mx-auto max-w-lg space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Form Pendaftaran</h2>
        <p className="mt-1 text-sm text-slate-500">
          Isi data di bawah untuk mendaftar kegiatan komunitas.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="activity" className="label">
          Pilih Kegiatan
        </label>
        <select
          id="activity"
          className="input"
          value={activityId}
          onChange={(e) => setActivityId(e.target.value)}
          required
        >
          <option value="">— Pilih kegiatan —</option>
          {activities.map((activity) => {
            const count = participantCounts[activity.id] ?? 0;
            const full =
              activity.max_participants != null &&
              count >= activity.max_participants;
            return (
              <option key={activity.id} value={activity.id} disabled={full}>
                {activity.title} — {formatDateTime(activity.date)}
                {full ? " (Penuh)" : ""}
              </option>
            );
          })}
        </select>
        {selectedActivity && (
          <div className="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
            {selectedActivity.location && (
              <p>Lokasi: {selectedActivity.location}</p>
            )}
            {selectedActivity.registration_fee > 0 && (
              <p>Iuran: {formatCurrency(selectedActivity.registration_fee)}</p>
            )}
            {selectedActivity.max_participants != null && (
              <p>
                Peserta: {selectedCount}/{selectedActivity.max_participants}
              </p>
            )}
          </div>
        )}
      </div>

      <div>
        <label htmlFor="name" className="label">
          Nama Lengkap
        </label>
        <input
          id="name"
          type="text"
          className="input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nama lengkap warga"
          required
        />
      </div>

      <div>
        <label htmlFor="phone" className="label">
          No. Telepon
        </label>
        <input
          id="phone"
          type="tel"
          className="input"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="08xxxxxxxxxx"
        />
      </div>

      <div>
        <label htmlFor="block" className="label">
          Nomor Blok
        </label>
        <input
          id="block"
          type="text"
          className="input"
          value={blockNumber}
          onChange={(e) => setBlockNumber(e.target.value)}
          placeholder="Contoh: A-12"
        />
      </div>

      <button
        type="submit"
        className="btn-primary w-full"
        disabled={submitting || isFull}
      >
        {submitting ? (
          <span className="flex items-center gap-2">
            <LoadingSpinner />
            Mendaftar...
          </span>
        ) : (
          "Daftar Sekarang"
        )}
      </button>
    </form>
  );
}
