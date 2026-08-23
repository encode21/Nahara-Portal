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
  EventEditionFeedback,
  EventGalleryItem,
  GalleryMediaType,
} from "@/lib/types";
import { formatDateTime } from "@/lib/utils";
import {
  AGUSTUSAN_ACTIVITY_ID,
  AGUSTUSAN_YEAR,
  CONTEST_CATEGORY_LABELS,
  GALLERY_CATEGORIES,
  GALLERY_CATEGORY_LABELS,
  type GalleryCategory,
} from "@/lib/constants/agustusan";
import { entryLabel } from "@/lib/agustusan";
import { getSupabaseErrorMessage } from "@/lib/supabase/errors";
import { uploadPortalImage, uploadPortalVideo, removePortalImage } from "@/lib/supabase/storage";
import { normalizeGoogleDriveUrl } from "@/lib/validation/driveUrl";
import { LoadingSpinner } from "@/components/ui/Loading";
import { StoredImage } from "@/components/ui/StoredImage";
import { AgustusanFeedbackShareButton } from "@/components/agustusan/AgustusanFeedbackShareButton";
import {
  ContestEditForm,
  type ContestEditPayload,
} from "@/components/agustusan/ContestEditForm";

type Tab = "lomba" | "peserta" | "juara" | "galeri" | "sop" | "masukan";

const NEW_CONTEST_ID = "__new__";

function blankContest(editionId: string, sortOrder: number): EventContest {
  return {
    id: "",
    edition_id: editionId,
    sort_order: sortOrder,
    title: "",
    category: "umum",
    category_note: null,
    location: null,
    starts_at: null,
    ends_at: null,
    equipment: null,
    rules: null,
    team_size: 1,
    max_entries: null,
    registration_open: true,
    is_competition: true,
    created_at: "",
  };
}

export default function AdminEditionPage() {
  const params = useParams();
  const year = Number(params.year);
  const supabase = useMemo(() => createClient(), []);

  const [tab, setTab] = useState<Tab>("lomba");
  const [edition, setEdition] = useState<EventEdition | null>(null);
  const [contests, setContests] = useState<EventContest[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [savingContest, setSavingContest] = useState(false);
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
  const [editingResultId, setEditingResultId] = useState<string | null>(null);
  const [gallery, setGallery] = useState<EventGalleryItem[]>([]);
  const [galleryCaption, setGalleryCaption] = useState("");
  const [galleryCategory, setGalleryCategory] =
    useState<GalleryCategory>("dokumentasi");
  const [galleryMediaType, setGalleryMediaType] =
    useState<GalleryMediaType>("image");
  const [galleryUploading, setGalleryUploading] = useState(false);
  const [driveUrlDraft, setDriveUrlDraft] = useState("");
  const [savingDrive, setSavingDrive] = useState(false);
  const [feedback, setFeedback] = useState<EventEditionFeedback[]>([]);

  const selected = contests.find((c) => c.id === selectedId) ?? null;
  const editing =
    editingId === NEW_CONTEST_ID && edition
      ? blankContest(
          edition.id,
          contests.reduce((max, c) => Math.max(max, c.sort_order), 0) + 1,
        )
      : contests.find((c) => c.id === editingId) ?? null;

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

  const loadFeedback = useCallback(
    async (editionId: string) => {
      const { data } = await supabase
        .from("event_edition_feedback")
        .select("*")
        .eq("edition_id", editionId)
        .order("created_at", { ascending: false });
      setFeedback((data ?? []) as EventEditionFeedback[]);
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
    setDriveUrlDraft(editionRow?.gallery_drive_url ?? "");
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
    setSelectedId((prev) => (list.some((c) => c.id === prev) ? prev : list[0]?.id || ""));
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
    if (tab === "masukan" && edition?.id) loadFeedback(edition.id);
  }, [tab, edition?.id, loadGallery, loadFeedback]);

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

  async function saveContest(payload: ContestEditPayload) {
    if (!editingId || !edition) return;
    setSavingContest(true);
    setError(null);
    const isNew = editingId === NEW_CONTEST_ID;
    const { data, error: err } = isNew
      ? await supabase
          .from("event_contests")
          .insert({ ...payload, edition_id: edition.id })
          .select("id")
          .maybeSingle()
      : await supabase.from("event_contests").update(payload).eq("id", editingId).select("id").maybeSingle();
    setSavingContest(false);
    if (err) {
      setError(getSupabaseErrorMessage(err) ?? "Gagal menyimpan lomba");
      return;
    }
    setMessage(isNew ? "Lomba ditambahkan." : "Lomba diperbarui.");
    setEditingId(null);
    if (data?.id) setSelectedId(data.id);
    await loadEdition();
  }

  async function deleteContest(contest: EventContest) {
    if (!confirm(`Hapus lomba “${contest.title}”? Peserta dan juara lomba ini ikut terhapus.`)) return;
    setError(null);
    const { error: err } = await supabase.from("event_contests").delete().eq("id", contest.id);
    if (err) {
      setError(getSupabaseErrorMessage(err) ?? "Gagal menghapus lomba");
      return;
    }
    if (editingId === contest.id) setEditingId(null);
    setMessage("Lomba dihapus.");
    await loadEdition();
  }

  async function deleteFeedback(row: EventEditionFeedback) {
    if (!confirm("Hapus masukan ini?")) return;
    setError(null);
    const { error: err } = await supabase.from("event_edition_feedback").delete().eq("id", row.id);
    if (err) {
      setError(getSupabaseErrorMessage(err) ?? "Gagal menghapus masukan");
      return;
    }
    setMessage("Masukan dihapus.");
    if (edition) await loadFeedback(edition.id);
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

  function resetResultForm() {
    setEditingResultId(null);
    setResultForm({ rank: "1", winner_label: "", prize: "", published: true });
  }

  function startEditResult(r: EventContestResult) {
    setEditingResultId(r.id);
    setResultForm({
      rank: String(r.rank),
      winner_label: r.winner_label,
      prize: r.prize ?? "",
      published: r.published,
    });
    setError(null);
    setMessage(null);
  }

  async function saveResult(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedId) return;
    setError(null);
    const rank = parseInt(resultForm.rank, 10);
    if (!Number.isFinite(rank) || rank < 1) {
      setError("Peringkat tidak valid.");
      return;
    }
    const winnerLabel = resultForm.winner_label.trim();
    if (!winnerLabel) {
      setError("Nama juara wajib diisi.");
      return;
    }
    const wasEditing = Boolean(editingResultId);
    const payload = {
      contest_id: selectedId,
      rank,
      winner_label: winnerLabel,
      prize: resultForm.prize.trim() || null,
      published: resultForm.published,
      announced_at: new Date().toISOString(),
    };

    let result;
    if (editingResultId) {
      result = await supabase
        .from("event_contest_results")
        .update(payload)
        .eq("id", editingResultId);
    } else {
      const existing = results.find((r) => r.rank === rank);
      result = existing
        ? await supabase
            .from("event_contest_results")
            .update(payload)
            .eq("id", existing.id)
        : await supabase.from("event_contest_results").insert(payload);
    }

    if (result.error) {
      setError(getSupabaseErrorMessage(result.error) ?? "Gagal simpan juara");
      return;
    }
    resetResultForm();
    await loadResults(selectedId);
    setMessage(wasEditing ? "Juara diperbarui." : "Juara disimpan.");
  }

  async function deleteResult(id: string) {
    if (!confirm("Hapus juara ini?")) return;
    setError(null);
    const { error: err } = await supabase
      .from("event_contest_results")
      .delete()
      .eq("id", id);
    if (err) {
      setError(getSupabaseErrorMessage(err) ?? "Gagal hapus juara");
      return;
    }
    if (editingResultId === id) resetResultForm();
    if (selectedId) await loadResults(selectedId);
    setMessage("Juara dihapus.");
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

  async function saveGalleryDriveUrl() {
    if (!edition) return;
    setError(null);
    const raw = driveUrlDraft.trim();
    let normalized: string | null = null;
    if (raw) {
      normalized = normalizeGoogleDriveUrl(raw);
      if (!normalized) {
        setError(
          "URL Google Drive tidak valid. Gunakan link folder (drive.google.com)."
        );
        return;
      }
    }
    setSavingDrive(true);
    const { error: err } = await supabase
      .from("event_editions")
      .update({ gallery_drive_url: normalized })
      .eq("id", edition.id);
    setSavingDrive(false);
    if (err) {
      setError(getSupabaseErrorMessage(err) ?? "Gagal simpan link Drive");
      return;
    }
    setEdition({ ...edition, gallery_drive_url: normalized });
    setDriveUrlDraft(normalized ?? "");
    setMessage(
      normalized
        ? "Link folder Google Drive disimpan."
        : "Link Google Drive dikosongkan."
    );
  }

  async function handleGalleryUpload(files: FileList | null) {
    if (!edition || !files?.length) return;
    setError(null);
    setGalleryUploading(true);
    let ok = 0;

    if (galleryMediaType === "video") {
      const videoFile = files[0];
      const posterInput = document.getElementById(
        "gallery-video-poster"
      ) as HTMLInputElement | null;
      const posterFile = posterInput?.files?.[0] ?? null;
      if (!posterFile) {
        setError("Video perlu poster (gambar thumbnail).");
        setGalleryUploading(false);
        return;
      }

      const { url: videoUrl, error: videoErr } = await uploadPortalVideo(
        supabase,
        videoFile,
        "agustusan"
      );
      if (videoErr || !videoUrl) {
        setError(videoErr ?? "Gagal upload video");
        setGalleryUploading(false);
        return;
      }

      const { url: posterUrl, error: posterErr } = await uploadPortalImage(
        supabase,
        posterFile,
        "agustusan"
      );
      if (posterErr || !posterUrl) {
        await removePortalImage(supabase, videoUrl);
        setError(posterErr ?? "Gagal upload poster");
        setGalleryUploading(false);
        return;
      }

      const nextOrder =
        gallery.reduce((m, g) => Math.max(m, g.sort_order), 0) + 1;
      const { error: err } = await supabase.from("event_gallery_items").insert({
        edition_id: edition.id,
        media_type: "video",
        image_url: posterUrl,
        video_url: videoUrl,
        caption: galleryCaption.trim() || null,
        category: galleryCategory,
        sort_order: nextOrder,
        is_published: true,
      });
      if (err) {
        await removePortalImage(supabase, videoUrl);
        await removePortalImage(supabase, posterUrl);
        setError(getSupabaseErrorMessage(err) ?? "Gagal simpan video");
        setGalleryUploading(false);
        return;
      }
      ok = 1;
      if (posterInput) posterInput.value = "";
    } else {
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
          media_type: "image",
          image_url: url,
          video_url: null,
          caption: galleryCaption.trim() || null,
          category: galleryCategory,
          sort_order: nextOrder,
          is_published: true,
        });
        if (err) {
          setError(getSupabaseErrorMessage(err) ?? "Gagal simpan galeri");
          continue;
        }
        ok += 1;
      }
    }

    setGalleryCaption("");
    setGalleryUploading(false);
    if (ok) {
      setMessage(
        galleryMediaType === "video"
          ? "Video ditambahkan ke galeri."
          : `${ok} foto ditambahkan ke galeri.`
      );
      await loadGallery(edition.id);
    }
  }

  async function deleteGalleryItem(item: EventGalleryItem) {
    if (!confirm("Hapus item ini dari galeri?")) return;
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
    if (item.video_url?.includes("/storage/")) {
      await removePortalImage(supabase, item.video_url);
    }
    if (edition) await loadGallery(edition.id);
    setMessage("Item galeri dihapus.");
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

  async function updateGalleryCategory(
    item: EventGalleryItem,
    category: GalleryCategory
  ) {
    if (item.category === category) return;
    const { error: err } = await supabase
      .from("event_gallery_items")
      .update({ category })
      .eq("id", item.id);
    if (err) {
      setError(getSupabaseErrorMessage(err) ?? "Gagal ubah kategori");
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
    { id: "masukan", label: "Masukan" },
    { id: "sop", label: "SOP" },
  ];

  const activityId =
    edition.activity_id ??
    (year === AGUSTUSAN_YEAR ? AGUSTUSAN_ACTIVITY_ID : null);

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
        <div className="mt-3 flex flex-wrap gap-2">
          {activityId && (
            <Link
              href={`/activities/${activityId}`}
              className="rounded-lg border border-gold/40 bg-gold/10 px-3 py-1.5 text-sm font-medium text-gold-dark hover:bg-gold/20"
            >
              Kelola donatur
            </Link>
          )}
          <Link
            href={`/activities/agustusan/${year}/malam-puncak`}
            className="rounded-lg border border-[#7a1218]/30 bg-[#7a1218]/10 px-3 py-1.5 text-sm font-medium text-[#7a1218] hover:bg-[#7a1218]/15"
          >
            Operator Malam Puncak
          </Link>
          <Link
            href={`/activities/agustusan/${year}/doorprize`}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Door Prize / Acara Puncak
          </Link>
          <Link
            href={`/activities/agustusan/${year}/duck-race`}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Duck Race
          </Link>
          <Link
            href={`/activities/agustusan/${year}/qr`}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            QR Daftar
          </Link>
          <Link
            href="/donasi"
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Kelola donasi
          </Link>
        </div>
        {!activityId && (
          <p className="mt-2 text-xs text-amber-700">
            Edisi ini belum tertaut ke kegiatan — tautkan activity_id agar kelola
            donatur muncul.
          </p>
        )}
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
              if (t.id !== "lomba") setEditingId(null);
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
            onChange={(e) => {
              setSelectedId(e.target.value);
              resetResultForm();
            }}
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
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              type="button"
              className="btn-primary text-sm"
              disabled={!edition}
              onClick={() => {
                setEditingId(NEW_CONTEST_ID);
                setMessage(null);
                setError(null);
              }}
            >
              Tambah lomba
            </button>
          </div>
          {editing && (
            <ContestEditForm
              contest={editing}
              saving={savingContest}
              onCancel={() => setEditingId(null)}
              onSave={saveContest}
            />
          )}
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
                  <tr
                    key={c.id}
                    className={`border-b border-slate-100 ${
                      editingId === c.id ? "bg-gold/5" : ""
                    }`}
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900">{c.title}</p>
                      <p className="text-xs text-slate-500">
                        {CONTEST_CATEGORY_LABELS[c.category]}
                        {c.location ? ` · ${c.location}` : ""}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {c.starts_at ? formatDateTime(c.starts_at) : "—"}
                      {c.ends_at ? (
                        <span className="block text-xs text-slate-400">
                          s/d {formatDateTime(c.ends_at)}
                        </span>
                      ) : null}
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
                      <div className="flex flex-wrap justify-end gap-2">
                        <button
                          type="button"
                          className="btn-secondary text-xs"
                          onClick={() => {
                            setEditingId(c.id);
                            setMessage(null);
                            setError(null);
                          }}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="btn-secondary text-xs text-red-700"
                          onClick={() => deleteContest(c)}
                        >
                          Hapus
                        </button>
                        {c.is_competition && (
                          <button
                            type="button"
                            className="btn-secondary text-xs"
                            onClick={() => toggleRegistration(c)}
                          >
                            {c.registration_open ? "Tutup daftar" : "Buka daftar"}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
            {editingResultId && (
              <p className="sm:col-span-2 text-sm font-medium text-[#7a1218]">
                Mengedit juara — ubah nama/hadiah lalu simpan.
              </p>
            )}
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
            <div className="flex flex-wrap items-end gap-3">
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
                {editingResultId ? "Update juara" : "Simpan juara"}
              </button>
              {editingResultId && (
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={resetResultForm}
                >
                  Batal
                </button>
              )}
            </div>
          </form>
          <button type="button" className="btn-secondary" onClick={publishAnnouncement}>
            Buat pengumuman portal
          </button>
          <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
            {results.length === 0 ? (
              <li className="px-4 py-6 text-sm text-slate-500">Belum ada juara.</li>
            ) : (
              results.map((r) => (
                <li
                  key={r.id}
                  className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm"
                >
                  <div>
                    <span className="font-bold text-[#7a1218]">#{r.rank}</span>{" "}
                    {r.winner_label}
                    {r.prize && <span className="text-slate-500"> — {r.prize}</span>}
                    {!r.published && (
                      <span className="ml-2 text-xs text-slate-400">(draft)</span>
                    )}
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      className="text-xs text-accent hover:underline"
                      onClick={() => startEditResult(r)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="text-xs text-red-600 hover:underline"
                      onClick={() => deleteResult(r.id)}
                    >
                      Hapus
                    </button>
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>
      )}

      {tab === "galeri" && (
        <div className="space-y-6">
          <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
            <div>
              <label className="label">Folder arsip Google Drive</label>
              <p className="mb-2 text-xs text-slate-500">
                Satu link folder untuk warga (isi subfolder Foto & Video di Drive).
                Pastikan share: Anyone with the link can view.
              </p>
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  className="input flex-1"
                  placeholder="https://drive.google.com/drive/folders/…"
                  value={driveUrlDraft}
                  onChange={(e) => setDriveUrlDraft(e.target.value)}
                />
                <button
                  type="button"
                  className="btn-secondary shrink-0"
                  disabled={savingDrive}
                  onClick={saveGalleryDriveUrl}
                >
                  {savingDrive ? "Menyimpan…" : "Simpan link Drive"}
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-sm text-slate-600">
              Highlight portal (foto/video singkat). Arsip lengkap tetap di Drive. Tampil di{" "}
              <Link
                href={`/kegiatan/agustusan/${year}/galeri`}
                className="text-accent hover:underline"
              >
                /kegiatan/agustusan/{year}/galeri
              </Link>
            </p>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  { id: "image" as const, label: "Foto" },
                  { id: "video" as const, label: "Video" },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setGalleryMediaType(opt.id)}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                    galleryMediaType === opt.id
                      ? "bg-accent text-white"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <div>
              <label className="label">Keterangan (opsional)</label>
              <input
                className="input"
                placeholder={
                  galleryMediaType === "video"
                    ? "Contoh: Teaser malam puncak"
                    : "Contoh: Lomba Jalan Silang — 8 Agu"
                }
                value={galleryCaption}
                onChange={(e) => setGalleryCaption(e.target.value)}
              />
            </div>
            <div>
              <label className="label">Kategori</label>
              <select
                className="input"
                value={galleryCategory}
                onChange={(e) =>
                  setGalleryCategory(e.target.value as GalleryCategory)
                }
              >
                {GALLERY_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {GALLERY_CATEGORY_LABELS[cat]}
                  </option>
                ))}
              </select>
            </div>
            {galleryMediaType === "video" ? (
              <div className="space-y-3">
                <div>
                  <label className="label">Poster / thumbnail (wajib)</label>
                  <input
                    id="gallery-video-poster"
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="block w-full text-sm text-slate-600"
                    disabled={galleryUploading}
                  />
                </div>
                <label className="btn-primary inline-flex cursor-pointer">
                  {galleryUploading ? "Mengunggah…" : "Pilih & upload video (MP4)"}
                  <input
                    type="file"
                    accept="video/mp4,video/webm"
                    className="hidden"
                    disabled={galleryUploading}
                    onChange={(e) => {
                      handleGalleryUpload(e.target.files);
                      e.target.value = "";
                    }}
                  />
                </label>
                <p className="text-xs text-slate-500">Maksimal 50 MB · MP4 / WebM</p>
              </div>
            ) : (
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
            )}
          </div>

          {gallery.length === 0 ? (
            <p className="text-sm text-slate-500">
              Belum ada item. Upload highlight atau andalkan folder Drive.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {gallery.map((item) => (
                <div
                  key={item.id}
                  className="overflow-hidden rounded-lg border border-slate-200 bg-white"
                >
                  <div className="relative">
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
                    <span className="absolute left-2 top-2 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                      {item.media_type === "video" ? "Video" : "Foto"}
                    </span>
                  </div>
                  <div className="space-y-2 p-2">
                    <p className="line-clamp-2 text-xs text-slate-600">
                      {item.caption || "Tanpa keterangan"}
                      {!item.is_published && (
                        <span className="ml-1 text-slate-400">(draft)</span>
                      )}
                    </p>
                    <select
                      className="input py-1 text-xs"
                      value={
                        GALLERY_CATEGORIES.includes(
                          item.category as GalleryCategory
                        )
                          ? item.category
                          : "dokumentasi"
                      }
                      onChange={(e) =>
                        updateGalleryCategory(
                          item,
                          e.target.value as GalleryCategory
                        )
                      }
                    >
                      {GALLERY_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {GALLERY_CATEGORY_LABELS[cat]}
                        </option>
                      ))}
                    </select>
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

      {tab === "masukan" && (
        <div className="space-y-4">
          <div className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-slate-900">Tautan publik rating</p>
              <p className="text-xs text-slate-500">
                Bagikan ke warga supaya mereka bisa kirim usulan dan lihat review bersama.
              </p>
            </div>
            {edition && (
              <AgustusanFeedbackShareButton
                year={edition.year}
                title={edition.title}
                label="Bagikan ke warga"
              />
            )}
          </div>
          {feedback.length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm">
              <span className="font-semibold text-slate-900">
                {(
                  feedback.reduce((s, r) => s + r.rating, 0) / feedback.length
                ).toFixed(1)}
              </span>
              <span className="text-slate-500"> / 5 rata-rata</span>
              <span className="text-slate-400"> · {feedback.length} masukan</span>
            </div>
          )}
          {feedback.length === 0 ? (
            <p className="text-sm text-slate-500">Belum ada masukan.</p>
          ) : (
            <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
              {feedback.map((row) => (
                <li key={row.id} className="space-y-2 px-4 py-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        {"★".repeat(row.rating)}
                        <span className="ml-2 font-normal text-slate-400">
                          {row.display_name || "Anonim"}
                        </span>
                      </p>
                      <p className="text-xs text-slate-400">
                        {formatDateTime(row.created_at)} · {row.source}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="text-xs text-red-600 hover:underline"
                      onClick={() => deleteFeedback(row)}
                    >
                      Hapus
                    </button>
                  </div>
                  <p className="whitespace-pre-wrap text-sm text-slate-700">{row.body}</p>
                </li>
              ))}
            </ul>
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
