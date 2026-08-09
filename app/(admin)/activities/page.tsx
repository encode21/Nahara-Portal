"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Activity } from "@/lib/types";
import { ActivityCard } from "@/components/ActivityCard";
import { EmptyState, LoadingSpinner } from "@/components/ui/Loading";
import { ActivityFormModal } from "@/components/ActivityFormModal";

export default function ActivitiesPage() {
  const supabase = createClient();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [participantCounts, setParticipantCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);

  async function loadData() {
    setLoading(true);
    const { data } = await supabase
      .from("activities")
      .select("*")
      .order("date", { ascending: false });

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

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleDelete(id: string) {
    if (!confirm("Hapus kegiatan ini? Semua peserta juga akan dihapus.")) return;

    await supabase.from("activities").delete().eq("id", id);
    loadData();
  }

  function handleEdit(activity: Activity) {
    setEditingActivity(activity);
    setShowForm(true);
  }

  function handleFormClose() {
    setShowForm(false);
    setEditingActivity(null);
    loadData();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Kegiatan</h1>
          <p className="mt-1 text-slate-500">Kelola kegiatan paguyuban</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/activities/agustusan" className="btn-secondary">
            Kelola Agustusan
          </Link>
          <button
            type="button"
            className="btn-primary"
            onClick={() => {
              setEditingActivity(null);
              setShowForm(true);
            }}
          >
            + Tambah Kegiatan
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner className="h-8 w-8" />
        </div>
      ) : activities.length === 0 ? (
        <EmptyState
          title="Belum ada kegiatan"
          description="Buat kegiatan pertama untuk paguyuban."
          action={
            <button type="button" className="btn-primary" onClick={() => setShowForm(true)}>
              Tambah Kegiatan
            </button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {activities.map((activity) => (
            <div key={activity.id} className="relative">
              <Link href={`/activities/${activity.id}`}>
                <ActivityCard
                  activity={activity}
                  participantCount={participantCounts[activity.id] ?? 0}
                />
              </Link>
              <div className="absolute right-4 top-4 flex gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    handleEdit(activity);
                  }}
                  className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    handleDelete(activity.id);
                  }}
                  className="rounded-lg border border-red-200 bg-white px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                >
                  Hapus
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <ActivityFormModal
          activity={editingActivity}
          onClose={handleFormClose}
        />
      )}
    </div>
  );
}
