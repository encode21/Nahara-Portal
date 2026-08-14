"use client";

import { useEffect, useState } from "react";
import { ContestFormModal } from "@/components/admin/ContestFormModal";

export default function AdminContestsPage() {
  const [contests, setContests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");

  async function load() {
    setLoading(true);
    const qs = new URLSearchParams();
    if (category) qs.set("category", category);
    const res = await fetch(`/api/admin/contests?${qs.toString()}`);
    const data = await res.json();
    if (res.ok) setContests(data.data ?? []);
    else setContests([]);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category]);

  function filtered() {
    if (!q) return contests;
    return contests.filter((c) => (c.title ?? "").toLowerCase().includes(q.toLowerCase()));
  }

  async function handlePublish(id: string) {
    const res = await fetch(`/api/admin/contests/${id}/publish`, { method: "PATCH" });
    if (res.ok) load();
    else alert("Failed to toggle publish");
  }

  async function handleCloseRegistration(id: string) {
    if (!confirm("Close registration for this contest?")) return;
    const res = await fetch(`/api/admin/contests/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ registration_open: false }),
    });
    if (res.ok) load();
    else alert("Failed to close registration");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Manage Lomba</h1>
          <p className="text-sm text-slate-500">Tambah / edit / publish lomba untuk event</p>
        </div>
        <div className="flex items-center gap-2">
          <input placeholder="Search title" value={q} onChange={(e) => setQ(e.target.value)} className="rounded border px-2 py-1" />
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="rounded border px-2 py-1">
            <option value="">All categories</option>
            <option value="ibu">Ibu</option>
            <option value="bapak">Bapak</option>
            <option value="pasangan">Pasangan</option>
            <option value="keluarga">Keluarga</option>
            <option value="balita">Balita</option>
            <option value="preteen">Preteen</option>
            <option value="art">Art</option>
            <option value="umum">Umum</option>
          </select>
          <button className="btn-primary" onClick={() => { setEditing(null); setShowForm(true); }}>
            + Add Lomba
          </button>
        </div>
      </div>

      {loading ? (
        <div>Loading\fontests...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="text-left">
                <th className="px-2 py-2">Title</th>
                <th className="px-2 py-2">Category</th>
                <th className="px-2 py-2">Starts</th>
                <th className="px-2 py-2">Ends</th>
                <th className="px-2 py-2">Reg Open</th>
                <th className="px-2 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered().map((c) => (
                <tr key={c.id} className="border-t">
                  <td className="px-2 py-2">{c.title}</td>
                  <td className="px-2 py-2">{c.category}</td>
                  <td className="px-2 py-2">{c.starts_at ? new Date(c.starts_at).toLocaleString() : "-"}</td>
                  <td className="px-2 py-2">{c.ends_at ? new Date(c.ends_at).toLocaleString() : "-"}</td>
                  <td className="px-2 py-2">{c.registration_open ? "Yes" : "No"}</td>
                  <td className="px-2 py-2">
                    <div className="flex gap-2">
                      <button className="btn-ghost" onClick={() => { setEditing(c); setShowForm(true); }}>Edit</button>
                      <button className="btn-ghost" onClick={() => handlePublish(c.id)}>{c.is_published ? "Unpublish" : "Publish"}</button>
                      <button className="btn-ghost text-red-600" onClick={() => handleCloseRegistration(c.id)}>Close Reg</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <ContestFormModal
          contest={editing}
          onClose={(saved) => {
            setShowForm(false);
            setEditing(null);
            if (saved) load();
          }}
        />
      )}
    </div>
  );
}
