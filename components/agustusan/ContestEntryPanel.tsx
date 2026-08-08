"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { EventContest, EventContestEntry, EventEdition } from "@/lib/types";
import { entryLabel, isRegistrationOpen } from "@/lib/agustusan";
import { getSupabaseErrorMessage } from "@/lib/supabase/errors";
import { formatDateTime } from "@/lib/utils";
import { PUBLIC_LIMITS } from "@/lib/validation/publicForms";

type Props = {
  edition: EventEdition;
  contest: EventContest;
};

export function ContestEntryPanel({ edition, contest }: Props) {
  const supabase = useMemo(() => createClient(), []);
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

  async function loadEntries() {
    const { data } = await supabase
      .from("event_contest_entries")
      .select("*")
      .eq("contest_id", contest.id)
      .eq("status", "registered")
      .order("registered_at", { ascending: true });
    setEntries((data ?? []) as EventContestEntry[]);
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      await loadEntries();
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contest.id, supabase]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!isRegistrationOpen(edition, contest)) {
      setError("Pendaftaran sudah ditutup.");
      return;
    }

    setSubmitting(true);
    const payload = {
      contest_id: contest.id,
      display_name: form.display_name.trim().slice(0, PUBLIC_LIMITS.nama),
      partner_name: form.partner_name.trim()
        ? form.partner_name.trim().slice(0, PUBLIC_LIMITS.nama)
        : null,
      block_number: form.block_number.trim()
        ? form.block_number.trim().slice(0, PUBLIC_LIMITS.blok)
        : null,
      phone: form.phone.trim()
        ? form.phone.trim().slice(0, PUBLIC_LIMITS.phone)
        : null,
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
    await loadEntries();
  }

  const canRegister = contest.is_competition && isRegistrationOpen(edition, contest);

  return (
    <div className="space-y-5 border-t border-slate-100 pt-4">
      {(contest.equipment || contest.rules) && (
        <div className="grid gap-4 sm:grid-cols-2">
          {contest.equipment && (
            <div>
              <h4 className="text-sm font-semibold text-slate-900">Peralatan</h4>
              <pre className="mt-1 whitespace-pre-wrap font-sans text-sm leading-relaxed text-slate-700">
                {contest.equipment}
              </pre>
            </div>
          )}
          {contest.rules && (
            <div>
              <h4 className="text-sm font-semibold text-slate-900">Aturan main</h4>
              <pre className="mt-1 whitespace-pre-wrap font-sans text-sm leading-relaxed text-slate-700">
                {contest.rules}
              </pre>
            </div>
          )}
        </div>
      )}

      <div>
        <h4 className="text-sm font-semibold text-slate-900">
          Peserta{loading ? "" : ` (${entries.length})`}
        </h4>
        {loading ? (
          <p className="mt-1 text-sm text-slate-500">Memuat…</p>
        ) : entries.length === 0 ? (
          <p className="mt-1 text-sm text-slate-500">Belum ada peserta.</p>
        ) : (
          <ol className="mt-2 columns-1 gap-x-6 sm:columns-2">
            {entries.map((entry, i) => (
              <li
                key={entry.id}
                className="mb-1 break-inside-avoid border-b border-slate-100 py-1.5 text-sm"
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
      </div>

      {contest.is_competition && (
        <div className="rounded-xl border border-slate-200 bg-[#faf7f0]/60 p-4 sm:p-5">
          <h4 className="font-display text-base font-semibold text-slate-900">
            Daftar ikut lomba
          </h4>
          {!canRegister && (
            <p className="mt-1 text-sm text-[#9b1b23]">
              Pendaftaran ditutup
              {edition.registration_closes_at
                ? ` (batas ${formatDateTime(edition.registration_closes_at)})`
                : ""}
              .
            </p>
          )}
          {canRegister && (
            <form onSubmit={handleSubmit} className="mt-3 grid gap-3 sm:grid-cols-2">
              {error && <p className="sm:col-span-2 text-sm text-red-600">{error}</p>}
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
                  minLength={2}
                  maxLength={PUBLIC_LIMITS.nama}
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
                    maxLength={PUBLIC_LIMITS.nama}
                    value={form.partner_name}
                    onChange={(e) => setForm({ ...form, partner_name: e.target.value })}
                  />
                </div>
              )}
              <div>
                <label className="label">Blok / kavling</label>
                <input
                  className="input"
                  maxLength={PUBLIC_LIMITS.blok}
                  value={form.block_number}
                  onChange={(e) => setForm({ ...form, block_number: e.target.value })}
                />
              </div>
              <div>
                <label className="label">No. HP (opsional)</label>
                <input
                  className="input"
                  maxLength={PUBLIC_LIMITS.phone}
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
        </div>
      )}
    </div>
  );
}
