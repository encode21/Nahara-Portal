"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Activity, Participant } from "@/lib/types";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import {
  ParticipantSummary,
  ParticipantTable,
} from "@/components/ParticipantTable";
import { LoadingSpinner } from "@/components/ui/Loading";
import { ActivityFormModal } from "@/components/ActivityFormModal";

export default function ActivityDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();
  const [activity, setActivity] = useState<Activity | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [showEdit, setShowEdit] = useState(false);

  async function loadData() {
    setLoading(true);

    const [activityRes, participantsRes] = await Promise.all([
      supabase.from("activities").select("*").eq("id", params.id).single(),
      supabase
        .from("participants")
        .select("*")
        .eq("activity_id", params.id)
        .order("registered_at", { ascending: false }),
    ]);

    setActivity(activityRes.data as Activity | null);
    setParticipants((participantsRes.data ?? []) as Participant[]);
    setLoading(false);
  }

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  async function handleTogglePayment(id: string, value: boolean) {
    setUpdating(id);
    await supabase
      .from("participants")
      .update({ payment_status: value })
      .eq("id", id);
    setParticipants((prev) =>
      prev.map((p) => (p.id === id ? { ...p, payment_status: value } : p))
    );
    setUpdating(null);
  }

  async function handleToggleAttendance(id: string, value: boolean) {
    setUpdating(id);
    await supabase
      .from("participants")
      .update({ attendance_status: value })
      .eq("id", id);
    setParticipants((prev) =>
      prev.map((p) => (p.id === id ? { ...p, attendance_status: value } : p))
    );
    setUpdating(null);
  }

  async function handleDeleteParticipant(id: string) {
    if (!confirm("Hapus peserta ini?")) return;
    await supabase.from("participants").delete().eq("id", id);
    setParticipants((prev) => prev.filter((p) => p.id !== id));
  }

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
        <Link href="/activities" className="mt-4 inline-block text-accent hover:underline">
          Kembali ke daftar kegiatan
        </Link>
      </div>
    );
  }

  const paidCount = participants.filter((p) => p.payment_status).length;
  const attendingCount = participants.filter((p) => p.attendance_status).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            href="/activities"
            className="text-sm text-slate-500 hover:text-accent"
          >
            ← Kembali
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-slate-900">
            {activity.title}
          </h1>
          {activity.description && (
            <p className="mt-1 text-slate-600">{activity.description}</p>
          )}
        </div>
        <button type="button" className="btn-secondary" onClick={() => setShowEdit(true)}>
          Edit Kegiatan
        </button>
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
            <p className="mt-0.5 text-sm font-medium text-slate-900">
              {activity.location}
            </p>
          </div>
        )}
        <div>
          <p className="text-xs font-medium text-slate-500">Iuran</p>
          <p className="mt-0.5 text-sm font-medium text-slate-900">
            {formatCurrency(activity.registration_fee)}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium text-slate-500">Max Peserta</p>
          <p className="mt-0.5 text-sm font-medium text-slate-900">
            {activity.max_participants ?? "Tidak terbatas"}
          </p>
        </div>
      </div>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-900">Daftar Peserta</h2>
        <ParticipantSummary
          total={participants.length}
          paid={paidCount}
          attending={attendingCount}
        />
        <ParticipantTable
          participants={participants}
          onTogglePayment={handleTogglePayment}
          onToggleAttendance={handleToggleAttendance}
          onDelete={handleDeleteParticipant}
          updating={updating}
        />
      </section>

      {showEdit && (
        <ActivityFormModal
          activity={activity}
          onClose={() => {
            setShowEdit(false);
            loadData();
          }}
        />
      )}
    </div>
  );
}
