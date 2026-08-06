"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { EventEdition } from "@/lib/types";
import { LoadingSpinner } from "@/components/ui/Loading";

export default function AdminAgustusanPage() {
  const supabase = useMemo(() => createClient(), []);
  const [editions, setEditions] = useState<EventEdition[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("event_editions")
        .select("*")
        .order("year", { ascending: false });
      setEditions((data ?? []) as EventEdition[]);
      setLoading(false);
    }
    load();
  }, [supabase]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner className="h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link href="/activities" className="text-sm text-slate-500 hover:text-accent">
            ← Kegiatan
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-slate-900">Kelola Agustusan</h1>
          <p className="mt-1 text-sm text-slate-500">
            Panitia update lomba, peserta, juara, dan SOP per edisi.
          </p>
        </div>
      </div>

      {editions.length === 0 ? (
        <p className="text-sm text-slate-500">
          Belum ada edisi. Jalankan seed SQL Agustusan di Supabase.
        </p>
      ) : (
        <ul className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 bg-white">
          {editions.map((e) => (
            <li key={e.id}>
              <Link
                href={`/activities/agustusan/${e.year}`}
                className="flex items-center justify-between px-4 py-4 hover:bg-slate-50"
              >
                <div>
                  <p className="font-medium text-slate-900">{e.title}</p>
                  <p className="text-xs text-slate-500 capitalize">{e.status}</p>
                </div>
                <span className="text-sm text-slate-500">{e.year} →</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
