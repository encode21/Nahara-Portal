"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type {
  EventContest,
  EventContestEntry,
  EventContestResult,
  EventEdition,
  EventGalleryItem,
} from "@/lib/types";
import { formatDateTime } from "@/lib/utils";
import { CONTEST_CATEGORY_LABELS } from "@/lib/constants/agustusan";
import { entryLabel } from "@/lib/agustusan";
import { getSupabaseErrorMessage } from "@/lib/supabase/errors";
import { uploadPortalImage, removePortalImage } from "@/lib/supabase/storage";
import { LoadingSpinner } from "@/components/ui/Loading";
import { StoredImage } from "@/components/ui/StoredImage";

type Tab = "lomba" | "peserta" | "juara" | "galeri" | "sop";

export default function AdminEditionPage() {
  const params = useParams();
  const year = Number(params.year);
  const supabase = useMemo(() => createClient(), []);

  const [tab, setTab] = useState<Tab>("lomba");
  const [edition, setEdition] = useState<EventEdition | null>(null);
  const [contests, setContests] = useState<EventContest[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [entries, setEntries] = useState<EventContestEntry[]>([]);
  const [results, setResults] = useState<EventContestResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [sopText, setSopText] = useState("");
  const [entryForm, setEntryForm] = useState({
    display_name: "",
    partner_name: "",
    block_number: "",
  });
  const [resultForm, setResultForm] = useState({
    rank: "1",
    winner_label: "",
    prize: "",
    published: true,
  });
  const [gallery, setGallery] = useState<EventGalleryItem[]>([]);
  const [galleryCaption, setGalleryCaption] = useState("");
  const [galleryUploading, setGalleryUploading] = useState(false);

  const selected = contests.find((c) => c.id === selectedId) ?? null;

  const loadGallery = useCallback(
    async (editionId: string) => {
      const { data } = await supabase
        .from("event_gallery_items")
        .select("*")
        .eq("edition_id", editionId)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false });
      setGallery((data ?? []) as EventGalleryItem[]);
    },
    [supabase]
  );

  const loadEdition = useCallback(async () => {
    const { data: ed } = await supabase
      .from("event_editions")
      .select("*")
      .eq("year", year)
      .maybeSingle();
    const editionRow = (ed ?? null) as EventEdition | null;
    setEdition(editionRow);
    setSopText(editionRow?.sop_text ?? "");
    if (!editionRow) {
      setLoading(false);
      return;
    }
    const { data: ct } = await supabase
      .from("event_contests")
      .select("*")
      .eq("edition_id", editionRow.id)
      .order("sort_order");
    const list = (ct ?? []) as EventContest[];
    setContests(list);
    setSelectedId((prev) => prev || list[0]?.id || "");
    setLoading(false);
  }, [supabase, year]);

  const loadEntries = useCallback(
    async (contestId: string) => {
      const { data } = await supabase
        .from("event_contest_entries")
        .select("*")
        .eq("contest_id", contestId)
        .order("registered_at");
      setEntries((data ?? []) as EventContestEntry[]);
    },
    [supabase]
  );

  const loadResults = useCallback(
    async (contestId: string) => {
      const { data } = await supabase
        .from("event_contest_results")
        .select("*")
        .eq("contest_id", contestId)
        .order("rank");
      setResults((data ?? []) as EventContestResult[]);
    },
    [supabase]
  );

  useEffect(() => {
    if (Number.isFinite(year)) loadEdition();
  }, [loadEdition, year]);

  useEffect(() => {
    if (!selectedId) return;
    if (tab === "peserta") loadEntries(selectedId);
    if (tab === "juara") loadResults(selectedId);
  }, [selectedId, tab, loadEntries, loadResults]);

  useEffect(() => {
    if (tab === "galeri" && edition?.id) loadGallery(edition.id);
  }, [tab, edition?.id, loadGallery]);

  async function toggleRegistration(contest: EventContest) {
    setError(null);
    const { error: err } = await supabase
      .from("event_contests")
      .update({ registration_open: !contest.registration_open })
      .eq("id", contest.id);
    if (err) {
      setError(getSupabaseErrorMessage(err) ?? "Gagal update");
      return;
    }
    await loadEdition();
    setMessage("Status pendaftaran diperbarui.");
  }

  async function saveSop() {
    if (!edition) return;
    setError(null);
    const { error: err } = await supabase
      .from("event_editions")
      .update({ sop_text: sopText })
      .eq("id", edition.id);
    if (err) {
      setError(getSupabaseErrorMessage(err) ?? "Gagal simpan");
      return;
    }
    setMessage("SOP disimpan.");
    await loadEdition();
  }

  async function addEntry(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedId) return;
    setError(null);
    const { error: err } = await supabase.from("event_contest_entries").insert({
      contest_id: selectedId,
      display_name: entryForm.display_name.trim(),
      partner_name: entryForm.partner_name.trim() || null,
      block_number: entryForm.block_number.trim() || null,
      status: "registered",
    });
    if (err) {
      setError(getSupabaseErrorMessage(err) ?? "Gagal tambah");
      return;
    }
    setEntryForm({ display_name: "", partner_name: "", block_number: "" });
    await loadEntries(selectedId);
  }

  async function withdrawEntry(id: string) {
    if (!confirm("Tandai peserta withdrawn?")) return;
    await supabase.from("event_contest_entries").update({ status: "withdrawn" }).eq("id", id);
    if (selectedId) await loadEntries(selectedId);
  }

  async function saveResult(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedId) return;
    setError(null);
    const rank = parseInt(resultForm.rank, 10);
    const payload = {
      contest_id: selectedId,
      rank,
      winner_label: resultForm.winner_label.trim(),
      prize: resultForm.prize.trim() || null,
      published: resultForm.published,
      announced_at: new Date().toISOString(),
    };
    const existing = results.find((r) => r.rank === rank);
    const result = existing
      ? await supabase.from("event_contest_results").update(payload).eq("id", existing.id)
      : await supabase.from("event_contest_results").insert(payload);
    if (result.error) {
      setError(getSupabaseErrorMessage(result.error) ?? "Gagal simpan juara");
      return;
    }
    setResultForm({ rank: "1", winner_label: "", prize: "", published: true });
    await loadResults(selectedId);
    setMessage("Juara disimpan.");
  }

  async function publishAnnouncement() {
    if (!edition || !selected || results.filter((r) => r.published).length === 0) {
      setError("Publish minimal 1 juara dulu.");
      return;
    }
    const lines = results
      .filter((r) => r.published)
      .sort((a, b) => a.rank - b.rank)
      .map(
        (r) =>
          `${r.rank}. ${r.winner_label}${r.prize ? ` — ${r.prize}` : ""}`
      )
      .join("\n");
    const { error: err } = await supabase.from("pengumuman").insert({
      judul: `Juara ${selected.title} — ${edition.title}`,
      isi: lines,
    });
    if (err) {
      setError(getSupabaseErrorMessage(err) ?? "Gagal buat pengumuman");
      return;
    }
    setMessage("Pengumuman dibuat di menu Pengumuman.");
  }

  async function handleGalleryUpload(files: FileList | null) {
    if (!edition || !files?.length) return;
    setError(null);
    setGalleryUploading(true);
    let ok = 0;
    for (const file of Array.from(files)) {
      const { url, error: uploadError } = await uploadPortalImage(
        supabase,
        file,
        "agustusan"
      );
      if (uploadError || !url) {
        setError(uploadError ?? "Gagal upload");
        continue;
      }
      const nextOrder =
        gallery.reduce((m, g) => Math.max(m, g.sort_order), 0) + 1 + ok;
      const { error: err } = await supabase.from("event_gallery_items").insert({
        edition_id: edition.id,
        image_url: url,
        caption: galleryCaption.trim() || null,
        sort_order: nextOrder,
        is_published: true,
      });
      if (err) {
        setError(getSupabaseErrorMessage(err) ?? "Gagal simpan galeri");
        continue;
      }
      ok += 1;
    }
    setGalleryCaption("");
    setGalleryUploading(false);
    if (ok) {
      setMessage(`${ok} foto ditambahkan ke galeri.`);
      await loadGallery(edition.id);
    }
  }

  async function deleteGalleryItem(item: EventGalleryItem) {
    if (!confirm("Hapus foto ini dari galeri?")) return;
    setError(null);
    const { error: err } = await supabase
      .from("event_gallery_items")
      .delete()
      .eq("id", item.id);
    if (err) {
      setError(getSupabaseErrorMessage(err) ?? "Gagal hapus");
      return;
    }
    if (item.image_url.includes("/storage/")) {
      await removePortalImage(supabase, item.image_url);
    }
    if (edition) await loadGallery(edition.id);
    setMessage("Foto dihapus.");
  }

  async function toggleGalleryPublish(item: EventGalleryItem) {
    const { error: err } = await supabase
      .from("event_gallery_items")
      .update({ is_published: !item.is_published })
      .eq("id", item.id);
    if (err) {
      setError(getSupabaseErrorMessage(err) ?? "Gagal update");
      return;
    }
    if (edition) await loadGallery(edition.id);
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner className="h-8 w-8" />
      </div>
    );
  }

  if (!edition) {
    return <p className="py-12 text-center text-slate-600">Edisi tidak ditemukan.</p>;
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "lomba", label: "Lomba" },
    { id: "peserta", label: "Peserta" },
    { id: "juara", label: "Juara" },
    { id: "galeri", label: "Galeri" },
    { id: "sop", label: "SOP" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <Link href="/activities/agustusan" className="text-sm text-slate-500 hover:text-accent">
          ← Edisi
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">{edition.title}</h1>
        <p className="mt-1 text-sm text-slate-500">
          Public:{" "}
          <Link href={`/kegiatan/agustusan/${year}`} className="text-accent hover:underline">
            /kegiatan/agustusan/{year}
          </Link>
          {edition.registration_closes_at && (
            <> · Batas daftar {formatDateTime(edition.registration_closes_at)}</>
          )}
        </p>
      </div>

      {(message || error) && (
        <div
          className={`rounded-lg px-4 py-3 text-sm ${
            error ? "border border-red-200 bg-red-50 text-red-700" : "border border-green-200 bg-green-50 text-green-800"
          }`}
        >
          {error ?? message}
        </div>
      )}

      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => {
              setTab(t.id);
              setMessage(null);
              setError(null);
            }}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
              tab === t.id ? "bg-gold/15 text-gold-dark" : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {(tab === "peserta" || tab === "juara") && (
        <div>
          <label className="label">Pilih lomba</label>
          <select
            className="input max-w-md"
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
          >
            {contests.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title} ({CONTEST_CATEGORY_LABELS[c.category]})
              </option>
            ))}
          </select>
        </div>
      )}

      {tab === "lomba" && (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-4 py-3 font-medium text-slate-600">Lomba</th>
                <th className="px-4 py-3 font-medium text-slate-600">Jadwal</th>
                <th className="px-4 py-3 font-medium text-slate-600">Daftar</th>
                <th className="px-4 py-3 font-medium text-slate-600" />
              </tr>
            </thead>
            <tbody>
              {contests.map((c) => (
                <tr key={c.id} className="border-b border-slate-100">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900">{c.title}</p>
                    <p className="text-xs text-slate-500">
                      {CONTEST_CATEGORY_LABELS[c.category]}
                      {c.location ? ` · ${c.location}` : ""}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {c.starts_at ? formatDateTime(c.starts_at) : "—"}
                  </td>
                  <td className="px-4 py-3">
                    {!c.is_competition ? (
                      <span className="text-xs text-slate-400">N/A</span>
                    ) : c.registration_open ? (
                      <span className="text-xs font-medium text-green-700">Terbuka</span>
                    ) : (
                      <span className="text-xs font-medium text-red-600">Tutup</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {c.is_competition && (
                      <button
                        type="button"
                        className="btn-secondary text-xs"
                        onClick={() => toggleRegistration(c)}
                      >
                        {c.registration_open ? "Tutup daftar" : "Buka daftar"}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "peserta" && selected && (
        <div className="space-y-6">
          <form onSubmit={addEntry} className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-4">
            <input
              className="input"
              placeholder="Nama"
              required
              value={entryForm.display_name}
              onChange={(e) => setEntryForm({ ...entryForm, display_name: e.target.value })}
            />
            <input
              className="input"
              placeholder="Pasangan (opsional)"
              value={entryForm.partner_name}
              onChange={(e) => setEntryForm({ ...entryForm, partner_name: e.target.value })}
            />
            <input
              className="input"
              placeholder="Blok"
              value={entryForm.block_number}
              onChange={(e) => setEntryForm({ ...entryForm, block_number: e.target.value })}
            />
            <button type="submit" className="btn-primary">
              Tambah
            </button>
          </form>
          <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
            {entries.map((en) => (
              <li key={en.id} className="flex items-center justify-between px-4 py-3 text-sm">
                <div>
                  <span className={en.status === "withdrawn" ? "text-slate-400 line-through" : "font-medium"}>
                    {entryLabel(en)}
                  </span>
                  {en.block_number && (
                    <span className="ml-2 text-slate-500">{en.block_number}</span>
                  )}
                </div>
                {en.status === "registered" && (
                  <button
                    type="button"
                    className="text-xs text-red-600 hover:underline"
                    onClick={() => withdrawEntry(en.id)}
                  >
                    Withdraw
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {tab === "juara" && selected && (
        <div className="space-y-6">
          <form onSubmit={saveResult} className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-2">
            <div>
              <label className="label">Peringkat</label>
              <select
                className="input"
                value={resultForm.rank}
                onChange={(e) => setResultForm({ ...resultForm, rank: e.target.value })}
              >
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
              </select>
            </div>
            <div>
              <label className="label">Nama juara</label>
              <input
                className="input"
                required
                value={resultForm.winner_label}
                onChange={(e) => setResultForm({ ...resultForm, winner_label: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Hadiah</label>
              <input
                className="input"
                value={resultForm.prize}
                onChange={(e) => setResultForm({ ...resultForm, prize: e.target.value })}
              />
            </div>
            <div className="flex items-end gap-3">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={resultForm.published}
                  onChange={(e) =>
                    setResultForm({ ...resultForm, published: e.target.checked })
                  }
                />
                Publikasikan
              </label>
              <button type="submit" className="btn-primary">
                Simpan juara
              </button>
            </div>
          </form>
          <button type="button" className="btn-secondary" onClick={publishAnnouncement}>
            Buat pengumuman portal
          </button>
          <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
            {results.map((r) => (
              <li key={r.id} className="px-4 py-3 text-sm">
                <span className="font-bold text-[#7a1218]">#{r.rank}</span>{" "}
                {r.winner_label}
                {r.prize && <span className="text-slate-500"> — {r.prize}</span>}
                {!r.published && (
                  <span className="ml-2 text-xs text-slate-400">(draft)</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {tab === "galeri" && (
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
            <p className="text-sm text-slate-600">
              Upload dokumentasi (bisa banyak file sekaligus). Tampil di{" "}
              <Link
                href={`/kegiatan/agustusan/${year}/galeri`}
                className="text-accent hover:underline"
              >
                /kegiatan/agustusan/{year}/galeri
              </Link>
            </p>
            <div>
              <label className="label">Keterangan (opsional, untuk batch ini)</label>
              <input
                className="input"
                placeholder="Contoh: Lomba Jalan Silang — 8 Agu"
                value={galleryCaption}
                onChange={(e) => setGalleryCaption(e.target.value)}
              />
            </div>
            <label className="btn-primary inline-flex cursor-pointer">
              {galleryUploading ? "Mengunggah…" : "Pilih & upload foto"}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                multiple
                className="hidden"
                disabled={galleryUploading}
                onChange={(e) => {
                  handleGalleryUpload(e.target.files);
                  e.target.value = "";
                }}
              />
            </label>
          </div>

          {gallery.length === 0 ? (
            <p className="text-sm text-slate-500">Belum ada foto. Jalankan seed galeri atau upload di sini.</p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {gallery.map((item) => (
                <div
                  key={item.id}
                  className="overflow-hidden rounded-lg border border-slate-200 bg-white"
                >
                  {item.image_url.startsWith("/") ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.image_url}
                      alt={item.caption ?? ""}
                      className="aspect-[4/3] w-full object-cover"
                    />
                  ) : (
                    <StoredImage
                      src={item.image_url}
                      alt={item.caption ?? ""}
                      className="aspect-[4/3] w-full object-cover"
                    />
                  )}
                  <div className="space-y-2 p-2">
                    <p className="line-clamp-2 text-xs text-slate-600">
                      {item.caption || "Tanpa keterangan"}
                      {!item.is_published && (
                        <span className="ml-1 text-slate-400">(draft)</span>
                      )}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        className="text-xs text-accent hover:underline"
                        onClick={() => toggleGalleryPublish(item)}
                      >
                        {item.is_published ? "Sembunyikan" : "Publish"}
                      </button>
                      <button
                        type="button"
                        className="text-xs text-red-600 hover:underline"
                        onClick={() => deleteGalleryItem(item)}
                      >
                        Hapus
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "sop" && (
        <div className="space-y-3">
          <textarea
            className="input min-h-[280px] font-mono text-xs"
            value={sopText}
            onChange={(e) => setSopText(e.target.value)}
          />
          <button type="button" className="btn-primary" onClick={saveSop}>
            Simpan SOP
          </button>
        </div>
      )}
    </div>
  );
}
