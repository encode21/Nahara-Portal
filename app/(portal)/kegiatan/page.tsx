"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Activity } from "@/lib/types";
import { ActivityCard } from "@/components/ActivityCard";
import { EmptyState, LoadingSpinner } from "@/components/ui/Loading";
import { AdminOnly } from "@/components/AdminOnly";
import { Settings } from "lucide-react";
import { AGUSTUSAN_ACTIVITY_ID, AGUSTUSAN_YEAR } from "@/lib/constants/agustusan";

export default function KegiatanPage() {
  const supabase = useMemo(() => createClient(), []);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [participantCounts, setParticipantCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError(null);

      const actsRes = await supabase
        .from("activities")
        .select("*")
        .order("date", { ascending: false });

      if (actsRes.error) {
        setError("Gagal memuat daftar kegiatan.");
        setLoading(false);
        return;
      }

      const acts = (actsRes.data ?? []) as Activity[];
      setActivities(acts);

      if (acts.length > 0) {
        const partsRes = await supabase.from("participants").select("activity_id");
        const counts: Record<string, number> = {};
        (partsRes.data ?? []).forEach((p: { activity_id: string }) => {
          counts[p.activity_id] = (counts[p.activity_id] ?? 0) + 1;
        });
        setParticipantCounts(counts);
      }

      setLoading(false);
    }

    loadData();
  }, [supabase]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">Kegiatan</h1>
          <p className="mt-1 text-sm text-slate-400">
            Lihat semua kegiatan paguyuban dan daftar sebagai peserta.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/kegiatan/agustusan" className="btn-secondary w-full sm:w-auto">
            Agustusan
          </Link>
          <Link href="/register" className="btn-primary w-full sm:w-auto">
            Daftar Kegiatan
          </Link>
          <AdminOnly>
            <Link href="/activities" className="btn-secondary w-full sm:w-auto">
              <Settings className="mr-1.5 inline h-4 w-4" />
              Kelola
            </Link>
          </AdminOnly>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner className="h-8 w-8" />
        </div>
      ) : error ? (
        <div className="glass-card">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      ) : activities.length === 0 ? (
        <EmptyState
          title="Belum ada kegiatan"
          description="Kegiatan akan muncul di sini setelah dibuat oleh admin."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {activities.map((activity) => (
            <ActivityCard
              key={activity.id}
              activity={activity}
              participantCount={participantCounts[activity.id] ?? 0}
              href={
                activity.id === AGUSTUSAN_ACTIVITY_ID
                  ? `/kegiatan/agustusan/${AGUSTUSAN_YEAR}`
                  : `/kegiatan/${activity.id}`
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
