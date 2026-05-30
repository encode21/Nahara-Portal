"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Activity } from "@/lib/types";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { LoadingSpinner } from "@/components/ui/Loading";

type PublicParticipant = {
  id: string;
  name: string;
  registered_at: string;
};

export default function PublicActivityDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = useMemo(() => createClient(), []);
  const [activity, setActivity] = useState<Activity | null>(null);
  const [participants, setParticipants] = useState<PublicParticipant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);

      const [activityRes, participantsRes] = await Promise.all([
        supabase.from("activities").select("*").eq("id", params.id).single(),
        supabase
          .from("participants")
          .select("id,name,registered_at")
          .eq("activity_id", params.id)
          .order("registered_at", { ascending: false }),
      ]);

      setActivity((activityRes.data ?? null) as Activity | null);
      setParticipants((participantsRes.data ?? []) as PublicParticipant[]);
      setLoading(false);
    }

    loadData();
  }, [params.id, supabase]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner className="h-8 w-8" />
      </div>
    );
  }

  if (!activity) {
    return (
      <div className="text-center">
        <p className="text-slate-600">Kegiatan tidak ditemukan.</p>
        <Link href="/kegiatan" className="mt-4 inline-block text-accent hover:underline">
          Kembali ke daftar kegiatan
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Link href="/kegiatan" className="text-sm text-slate-500 hover:text-accent">
          ← Kembali
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">{activity.title}</h1>
        {activity.description && (
          <p className="text-slate-600 whitespace-pre-line">{activity.description}</p>
        )}
      </div>

      <div className="card grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="text-xs font-medium text-slate-500">Tanggal</p>
          <p className="mt-0.5 text-sm font-medium text-slate-900">
            {formatDateTime(activity.date)}
          </p>
        </div>
        {activity.location && (
          <div>
            <p className="text-xs font-medium text-slate-500">Lokasi</p>
            <p className="mt-0.5 text-sm font-medium text-slate-900">{activity.location}</p>
          </div>
        )}
        <div>
          <p className="text-xs font-medium text-slate-500">Iuran</p>
          <p className="mt-0.5 text-sm font-medium text-slate-900">
            {formatCurrency(activity.registration_fee)}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium text-slate-500">Peserta Terdaftar</p>
          <p className="mt-0.5 text-sm font-medium text-slate-900">
            {participants.length}
            {activity.max_participants != null ? ` / ${activity.max_participants}` : ""}
          </p>
        </div>
      </div>

      <section className="space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Daftar Peserta</h2>
          <Link href="/register" className="btn-primary w-full sm:w-auto">
            Daftar Kegiatan
          </Link>
        </div>

        {participants.length === 0 ? (
          <div className="card text-center text-sm text-slate-600">
            Belum ada peserta yang mendaftar.
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="px-4 py-3 font-medium text-slate-600">Nama</th>
                    <th className="px-4 py-3 font-medium text-slate-600">Waktu Daftar</th>
                  </tr>
                </thead>
                <tbody>
                  {participants.map((p) => (
                    <tr key={p.id} className="border-b border-slate-100 last:border-b-0">
                      <td className="px-4 py-3 font-medium text-slate-900">{p.name}</td>
                      <td className="px-4 py-3 text-slate-600">{formatDateTime(p.registered_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

