"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { EventContest, EventContestEntry, EventEdition } from "@/lib/types";
import { formatDateTime } from "@/lib/utils";
import { CONTEST_CATEGORY_LABELS } from "@/lib/constants/agustusan";
import { entryLabel, isRegistrationOpen } from "@/lib/agustusan";
import { getSupabaseErrorMessage } from "@/lib/supabase/errors";
import { LoadingSpinner } from "@/components/ui/Loading";

export default function ContestDetailPage() {
  const params = useParams();
  const year = Number(params.year);
  const contestId = String(params.contestId ?? "");
  const supabase = useMemo(() => createClient(), []);

  const [edition, setEdition] = useState<EventEdition | null>(null);
  const [contest, setContest] = useState<EventContest | null>(null);
  const [entries, setEntries] = useState<EventContestEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({
    display_name: "",
    partner_name: "",
    block_number: "",
    phone: "",
  });

  async function loadEntries(id: string) {
    const { data } = await supabase
      .from("event_contest_entries")
      .select("*")
      .eq("contest_id", id)
      .eq("status", "registered")
      .order("registered_at", { ascending: true });
    setEntries((data ?? []) as EventContestEntry[]);
  }

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [{ data: ed }, { data: ct }] = await Promise.all([
        supabase.from("event_editions").select("*").eq("year", year).maybeSingle(),
        supabase.from("event_contests").select("*").eq("id", contestId).maybeSingle(),
      ]);
      setEdition((ed ?? null) as EventEdition | null);
      setContest((ct ?? null) as EventContest | null);
      if (ct) await loadEntries((ct as EventContest).id);
      setLoading(false);
    }
    if (Number.isFinite(year) && contestId) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase, year, contestId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!contest || !edition) return;
    setError(null);
    setSuccess(false);

    if (!isRegistrationOpen(edition, contest)) {
      setError("Pendaftaran sudah ditutup.");
      return;
    }

    setSubmitting(true);
    const payload = {
      contest_id: contest.id,
      display_name: form.display_name.trim(),
      partner_name: form.partner_name.trim() || null,
      block_number: form.block_number.trim() || null,
      phone: form.phone.trim() || null,
      status: "registered" as const,
    };

    if (contest.team_size > 1 && !payload.partner_name) {
      setError("Lomba ini membutuhkan nama pasangan/rekan.");
      setSubmitting(false);
      return;
    }

    const result = await supabase.from("event_contest_entries").insert(payload);
    const err = getSupabaseErrorMessage(result.error);
    setSubmitting(false);
    if (err) {
      setError(err);
      return;
    }
    setSuccess(true);
    setForm({ display_name: "", partner_name: "", block_number: "", phone: "" });
    await loadEntries(contest.id);
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner className="h-8 w-8" />
      </div>
    );
  }

  if (!edition || !contest) {
    return <p className="py-12 text-center text-slate-600">Lomba tidak ditemukan.</p>;
  }

  const canRegister = isRegistrationOpen(edition, contest);

  return (
    <div className="space-y-8">
      <div>
        <Link
          href={`/kegiatan/agustusan/${year}/lomba`}
          className="text-sm text-slate-500 hover:text-accent"
        >
          ← Daftar lomba
        </Link>
        <p className="mt-3 text-xs font-medium tracking-wide text-[#9b1b23] uppercase">
          {CONTEST_CATEGORY_LABELS[contest.category] ?? contest.category}
        </p>
        <h1 className="mt-1 font-display text-3xl font-bold text-slate-900">{contest.title}</h1>
        {contest.category_note && (
          <p className="mt-1 text-sm text-slate-600">{contest.category_note}</p>
        )}
        <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm text-slate-600">
          {contest.starts_at && <span>{formatDateTime(contest.starts_at)}</span>}
          {contest.location && <span>{contest.location}</span>}
          <span>{entries.length} peserta terdaftar</span>
        </div>
      </div>

      {(contest.equipment || contest.rules) && (
        <div className="grid gap-6 lg:grid-cols-2">
          {contest.equipment && (
            <section className="space-y-2">
              <h2 className="font-display text-lg font-semibold text-slate-900">Peralatan</h2>
              <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-slate-700">
                {contest.equipment}
              </pre>
            </section>
          )}
          {contest.rules && (
            <section className="space-y-2">
              <h2 className="font-display text-lg font-semibold text-slate-900">Aturan main</h2>
              <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-slate-700">
                {contest.rules}
              </pre>
            </section>
          )}
        </div>
      )}

      <section className="space-y-3">
        <h2 className="font-display text-xl font-semibold text-slate-900">Peserta</h2>
        {entries.length === 0 ? (
          <p className="text-sm text-slate-500">Belum ada peserta.</p>
        ) : (
          <ol className="columns-1 gap-x-8 sm:columns-2">
            {entries.map((entry, i) => (
              <li
                key={entry.id}
                className="mb-1.5 break-inside-avoid border-b border-slate-100 py-2 text-sm"
              >
                <span className="mr-2 tabular-nums text-slate-400">
                  {String(i + 1).padStart(2, "0")}.
                </span>
                <span className="font-medium text-slate-900">{entryLabel(entry)}</span>
                {entry.block_number && (
                  <span className="ml-1.5 text-slate-500">{entry.block_number}</span>
                )}
              </li>
            ))}
          </ol>
        )}
      </section>

      {contest.is_competition && (
        <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6">
          <div>
            <h2 className="font-display text-xl font-semibold text-slate-900">Daftar ikut lomba</h2>
            {!canRegister && (
              <p className="mt-1 text-sm text-[#9b1b23]">
                Pendaftaran ditutup
                {edition.registration_closes_at
                  ? ` (batas ${formatDateTime(edition.registration_closes_at)})`
                  : ""}
                .
              </p>
            )}
          </div>

          {canRegister && (
            <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
              {error && (
                <p className="sm:col-span-2 text-sm text-red-600">{error}</p>
              )}
              {success && (
                <p className="sm:col-span-2 text-sm text-green-700">
                  Berhasil terdaftar. Terima kasih!
                </p>
              )}
              <div>
                <label className="label">Nama</label>
                <input
                  className="input"
                  required
                  value={form.display_name}
                  onChange={(e) => setForm({ ...form, display_name: e.target.value })}
                />
              </div>
              {contest.team_size > 1 && (
                <div>
                  <label className="label">Nama pasangan / rekan</label>
                  <input
                    className="input"
                    required
                    value={form.partner_name}
                    onChange={(e) => setForm({ ...form, partner_name: e.target.value })}
                  />
                </div>
              )}
              <div>
                <label className="label">Blok / kavling</label>
                <input
                  className="input"
                  value={form.block_number}
                  onChange={(e) => setForm({ ...form, block_number: e.target.value })}
                />
              </div>
              <div>
                <label className="label">No. HP (opsional)</label>
                <input
                  className="input"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
              <div className="sm:col-span-2">
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? "Menyimpan…" : "Daftar"}
                </button>
              </div>
            </form>
          )}
        </section>
      )}
    </div>
  );
}
