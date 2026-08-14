"use client";

import { useEffect, useState } from "react";
import type { EventContest, EventContestCategory } from "@/lib/types";
import { CONTEST_CATEGORY_LABELS } from "@/lib/constants/agustusan";
import {
  CONTEST_CATEGORIES,
  fromDatetimeLocalWib,
  toDatetimeLocalWib,
} from "@/lib/agustusan";
import { LoadingSpinner } from "@/components/ui/Loading";

export type ContestEditPayload = {
  title: string;
  category: EventContestCategory;
  category_note: string | null;
  location: string | null;
  starts_at: string | null;
  ends_at: string | null;
  equipment: string | null;
  rules: string | null;
  team_size: number;
  max_entries: number | null;
  registration_open: boolean;
  is_competition: boolean;
  sort_order: number;
};

type Props = {
  contest: EventContest;
  saving?: boolean;
  onCancel: () => void;
  onSave: (payload: ContestEditPayload) => Promise<void>;
};

export function ContestEditForm({ contest, saving, onCancel, onSave }: Props) {
  const [title, setTitle] = useState(contest.title);
  const [category, setCategory] = useState<EventContestCategory>(contest.category);
  const [categoryNote, setCategoryNote] = useState(contest.category_note ?? "");
  const [location, setLocation] = useState(contest.location ?? "");
  const [startsAt, setStartsAt] = useState(toDatetimeLocalWib(contest.starts_at));
  const [endsAt, setEndsAt] = useState(toDatetimeLocalWib(contest.ends_at));
  const [equipment, setEquipment] = useState(contest.equipment ?? "");
  const [rules, setRules] = useState(contest.rules ?? "");
  const [teamSize, setTeamSize] = useState(String(contest.team_size ?? 1));
  const [maxEntries, setMaxEntries] = useState(
    contest.max_entries != null ? String(contest.max_entries) : ""
  );
  const [sortOrder, setSortOrder] = useState(String(contest.sort_order ?? 0));
  const [registrationOpen, setRegistrationOpen] = useState(contest.registration_open);
  const [isCompetition, setIsCompetition] = useState(contest.is_competition);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    setTitle(contest.title);
    setCategory(contest.category);
    setCategoryNote(contest.category_note ?? "");
    setLocation(contest.location ?? "");
    setStartsAt(toDatetimeLocalWib(contest.starts_at));
    setEndsAt(toDatetimeLocalWib(contest.ends_at));
    setEquipment(contest.equipment ?? "");
    setRules(contest.rules ?? "");
    setTeamSize(String(contest.team_size ?? 1));
    setMaxEntries(contest.max_entries != null ? String(contest.max_entries) : "");
    setSortOrder(String(contest.sort_order ?? 0));
    setRegistrationOpen(contest.registration_open);
    setIsCompetition(contest.is_competition);
    setFormError(null);
  }, [contest]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    const trimmed = title.trim();
    if (!trimmed) {
      setFormError("Judul wajib diisi.");
      return;
    }
    const team = parseInt(teamSize, 10);
    const sort = parseInt(sortOrder, 10);
    const max = maxEntries.trim() ? parseInt(maxEntries, 10) : null;
    if (!Number.isFinite(team) || team < 1) {
      setFormError("Ukuran tim minimal 1.");
      return;
    }
    if (!Number.isFinite(sort)) {
      setFormError("Urutan tidak valid.");
      return;
    }
    if (maxEntries.trim() && (max == null || !Number.isFinite(max) || max < 1)) {
      setFormError("Kuota peserta tidak valid.");
      return;
    }

    await onSave({
      title: trimmed,
      category,
      category_note: categoryNote.trim() || null,
      location: location.trim() || null,
      starts_at: fromDatetimeLocalWib(startsAt),
      ends_at: fromDatetimeLocalWib(endsAt),
      equipment: equipment.trim() || null,
      rules: rules.trim() || null,
      team_size: team,
      max_entries: max,
      registration_open: registrationOpen,
      is_competition: isCompetition,
      sort_order: sort,
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 sm:p-5"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold text-slate-900">
            {contest.id ? "Edit lomba" : "Tambah lomba"}
          </h3>
          <p className="text-xs text-slate-500">Waktu disimpan sebagai Asia/Jakarta (+07).</p>
        </div>
        <button type="button" className="btn-secondary text-xs" onClick={onCancel} disabled={saving}>
          Tutup
        </button>
      </div>

      {formError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {formError}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="label" htmlFor="contest-title">
            Judul
          </label>
          <input
            id="contest-title"
            className="input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="label" htmlFor="contest-category">
            Kategori
          </label>
          <select
            id="contest-category"
            className="input"
            value={category}
            onChange={(e) => setCategory(e.target.value as EventContestCategory)}
          >
            {CONTEST_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {CONTEST_CATEGORY_LABELS[c] ?? c}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="contest-location">
            Lokasi
          </label>
          <input
            id="contest-location"
            className="input"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        </div>
        <div className="sm:col-span-2">
          <label className="label" htmlFor="contest-note">
            Catatan kategori
          </label>
          <input
            id="contest-note"
            className="input"
            value={categoryNote}
            onChange={(e) => setCategoryNote(e.target.value)}
            placeholder="Contoh: Anak remaja boleh ikut"
          />
        </div>
        <div>
          <label className="label" htmlFor="contest-starts">
            Mulai
          </label>
          <input
            id="contest-starts"
            type="datetime-local"
            className="input"
            value={startsAt}
            onChange={(e) => setStartsAt(e.target.value)}
          />
        </div>
        <div>
          <label className="label" htmlFor="contest-ends">
            Selesai
          </label>
          <input
            id="contest-ends"
            type="datetime-local"
            className="input"
            value={endsAt}
            onChange={(e) => setEndsAt(e.target.value)}
          />
        </div>
        <div>
          <label className="label" htmlFor="contest-team">
            Ukuran tim
          </label>
          <input
            id="contest-team"
            type="number"
            min={1}
            className="input"
            value={teamSize}
            onChange={(e) => setTeamSize(e.target.value)}
          />
        </div>
        <div>
          <label className="label" htmlFor="contest-max">
            Kuota peserta (opsional)
          </label>
          <input
            id="contest-max"
            type="number"
            min={1}
            className="input"
            value={maxEntries}
            onChange={(e) => setMaxEntries(e.target.value)}
            placeholder="Kosong = tidak dibatasi"
          />
        </div>
        <div>
          <label className="label" htmlFor="contest-sort">
            Urutan tampil
          </label>
          <input
            id="contest-sort"
            type="number"
            className="input"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
          />
        </div>
        <div className="flex flex-col justify-end gap-2 pb-1">
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={isCompetition}
              onChange={(e) => setIsCompetition(e.target.checked)}
              className="rounded border-slate-300 text-accent focus:ring-accent"
            />
            Lomba (ada pendaftaran/juara)
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={registrationOpen}
              onChange={(e) => setRegistrationOpen(e.target.checked)}
              disabled={!isCompetition}
              className="rounded border-slate-300 text-accent focus:ring-accent"
            />
            Pendaftaran terbuka
          </label>
        </div>
        <div className="sm:col-span-2">
          <label className="label" htmlFor="contest-equipment">
            Peralatan
          </label>
          <textarea
            id="contest-equipment"
            className="input min-h-[88px]"
            value={equipment}
            onChange={(e) => setEquipment(e.target.value)}
            placeholder="Satu baris per item"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="label" htmlFor="contest-rules">
            Aturan / rules
          </label>
          <textarea
            id="contest-rules"
            className="input min-h-[120px]"
            value={rules}
            onChange={(e) => setRules(e.target.value)}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? <LoadingSpinner /> : "Simpan perubahan"}
        </button>
        <button type="button" className="btn-secondary" onClick={onCancel} disabled={saving}>
          Batal
        </button>
      </div>
    </form>
  );
}
