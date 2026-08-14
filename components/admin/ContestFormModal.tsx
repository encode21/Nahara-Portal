"use client";

import { useState } from "react";

type Props = {
  contest?: any | null;
  onClose: (saved?: any) => void;
};

export function ContestFormModal({ contest, onClose }: Props) {
  const [title, setTitle] = useState(contest?.title ?? "");
  const [category, setCategory] = useState(contest?.category ?? "umum");
  const [location, setLocation] = useState(contest?.location ?? "");
  const [startsAt, setStartsAt] = useState(contest?.starts_at ?? "");
  const [endsAt, setEndsAt] = useState(contest?.ends_at ?? "");
  const [rules, setRules] = useState(contest?.rules ?? "");
  const [equipment, setEquipment] = useState(contest?.equipment ?? "");
  const [teamSize, setTeamSize] = useState(contest?.team_size ?? 1);
  const [maxEntries, setMaxEntries] = useState(contest?.max_entries ?? "");
  const [registrationOpen, setRegistrationOpen] = useState(
    contest?.registration_open ?? true
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave(e: any) {
    e.preventDefault();
    setError(null);
    if (!title.trim()) return setError("Title is required");
    if (!category) return setError("Category required");
    if (!startsAt || !endsAt) return setError("Start and end datetime required");

    setIsSubmitting(true);
    try {
      const payload: any = {
        title: title.trim(),
        category,
        location: location.trim() || null,
        starts_at: startsAt,
        ends_at: endsAt,
        rules: rules.trim() || null,
        equipment: equipment.trim() || null,
        team_size: Number(teamSize) || 1,
        max_entries: maxEntries ? Number(maxEntries) : null,
        registration_open: !!registrationOpen,
      };

      const method = contest?.id ? "PUT" : "POST";
      const url = contest?.id ? `/api/admin/contests/${contest.id}` : `/api/admin/contests`;
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Failed to save");
      onClose(data.data ?? data);
    } catch (err: any) {
      setError(err.message ?? String(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-lg">
        <h3 className="text-lg font-semibold">{contest ? "Edit Lomba" : "Tambah Lomba"}</h3>
        <form className="mt-4 space-y-3" onSubmit={handleSave}>
          <div>
            <label className="block text-sm font-medium">Title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1 w-full rounded border px-2 py-1" />
          </div>

          <div>
            <label className="block text-sm font-medium">Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="mt-1 w-full rounded border px-2 py-1">
              <option value="ibu">Ibu</option>
              <option value="bapak">Bapak</option>
              <option value="pasangan">Pasangan</option>
              <option value="keluarga">Keluarga</option>
              <option value="balita">Balita</option>
              <option value="preteen">Preteen</option>
              <option value="art">Art</option>
              <option value="umum">Umum</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium">Starts at</label>
              <input type="datetime-local" value={startsAt ?? ""} onChange={(e) => setStartsAt(e.target.value)} className="mt-1 w-full rounded border px-2 py-1" />
            </div>
            <div>
              <label className="block text-sm font-medium">Ends at</label>
              <input type="datetime-local" value={endsAt ?? ""} onChange={(e) => setEndsAt(e.target.value)} className="mt-1 w-full rounded border px-2 py-1" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium">Location</label>
            <input value={location ?? ""} onChange={(e) => setLocation(e.target.value)} className="mt-1 w-full rounded border px-2 py-1" />
          </div>

          <div>
            <label className="block text-sm font-medium">Stages / Rules</label>
            <textarea value={rules ?? ""} onChange={(e) => setRules(e.target.value)} className="mt-1 w-full rounded border px-2 py-1" rows={4} />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium">Equipment</label>
              <input value={equipment ?? ""} onChange={(e) => setEquipment(e.target.value)} className="mt-1 w-full rounded border px-2 py-1" />
            </div>
            <div>
              <label className="block text-sm font-medium">Team size</label>
              <input type="number" value={teamSize} onChange={(e) => setTeamSize(Number(e.target.value))} className="mt-1 w-full rounded border px-2 py-1" />
            </div>
            <div>
              <label className="block text-sm font-medium">Capacity (max entries)</label>
              <input value={maxEntries ?? ""} onChange={(e) => setMaxEntries(e.target.value)} className="mt-1 w-full rounded border px-2 py-1" />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={registrationOpen} onChange={(e) => setRegistrationOpen(e.target.checked)} />
              <span className="text-sm">Registration open</span>
            </label>
          </div>

          {error && <div className="text-sm text-red-600">{error}</div>}

          <div className="mt-4 flex justify-end gap-2">
            <button type="button" className="btn-ghost" onClick={() => onClose()} disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
