"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type {
  Warga,
  WargaAnggota,
  WargaAnggotaHubungan,
  WargaDokumen,
  WargaDokumenJenis,
} from "@/lib/types";
import { BLOK_ROWS } from "@/lib/constants/cluster-layout";
import {
  FileText,
  Pencil,
  Plus,
  Search,
  Trash2,
  Upload,
  Users,
} from "lucide-react";
import { LoadingSpinner } from "@/components/ui/Loading";
import { useAuth } from "@/lib/hooks/useAuth";
import { AdminLoginPrompt } from "@/components/AdminOnly";
import { getSupabaseErrorMessage } from "@/lib/supabase/errors";
import {
  createWargaDokumenSignedUrl,
  removeWargaDokumenFile,
  uploadWargaDokumen,
} from "@/lib/supabase/storage";
import { StatusBadge, getHunianVariant } from "@/components/ui/StatusBadge";
import { useAppSurface } from "@/lib/hooks/useAppSurface";
import { buildOpsUrl } from "@/lib/host";

const HUBUNGAN_LABEL: Record<WargaAnggotaHubungan, string> = {
  kepala: "Kepala keluarga",
  istri: "Istri",
  anak: "Anak",
  lainnya: "Lainnya",
};

const emptyForm = {
  nama: "",
  blok: "",
  blok_row: "",
  nomor_kavling: "",
  status_hunian: "Tetap" as Warga["status_hunian"],
  telepon: "",
};

export default function DataWargaPage() {
  const supabase = createClient();
  const surface = useAppSurface();
  const { isWargaRegistry, loading: authLoading } = useAuth();
  const [wargaList, setWargaList] = useState<Warga[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [blokFilter, setBlokFilter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dokumen, setDokumen] = useState<WargaDokumen[]>([]);
  const [anggota, setAnggota] = useState<WargaAnggota[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [uploadJenis, setUploadJenis] = useState<WargaDokumenJenis>("kk");
  const [uploadNomor, setUploadNomor] = useState("");
  const [uploadNama, setUploadNama] = useState("");
  const [uploading, setUploading] = useState(false);
  const [anggotaForm, setAnggotaForm] = useState({
    nama: "",
    hubungan: "kepala" as WargaAnggotaHubungan,
    nik: "",
  });

  const canManage = isWargaRegistry;

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("warga").select("*").order("blok");
    setWargaList((data ?? []) as Warga[]);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const loadDetail = useCallback(
    async (wargaId: string) => {
      setDetailLoading(true);
      const [dokRes, angRes] = await Promise.all([
        supabase
          .from("warga_dokumen")
          .select("*")
          .eq("warga_id", wargaId)
          .order("created_at", { ascending: false }),
        supabase
          .from("warga_anggota")
          .select("*")
          .eq("warga_id", wargaId)
          .order("created_at"),
      ]);
      setDokumen((dokRes.data ?? []) as WargaDokumen[]);
      setAnggota((angRes.data ?? []) as WargaAnggota[]);
      setDetailLoading(false);
    },
    [supabase]
  );

  useEffect(() => {
    if (!selectedId || !canManage) {
      setDokumen([]);
      setAnggota([]);
      return;
    }
    void loadDetail(selectedId);
  }, [selectedId, canManage, loadDetail]);

  const filtered = wargaList.filter((w) => {
    const matchSearch =
      !search ||
      w.nama.toLowerCase().includes(search.toLowerCase()) ||
      w.blok.toLowerCase().includes(search.toLowerCase());
    const matchBlok = !blokFilter || w.blok_row === blokFilter;
    return matchSearch && matchBlok;
  });

  const selected = wargaList.find((w) => w.id === selectedId) ?? null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canManage) return;
    setError(null);
    const payload = {
      nama: form.nama,
      blok: form.blok,
      blok_row: form.blok_row,
      nomor_kavling: form.nomor_kavling
        ? parseInt(form.nomor_kavling, 10)
        : null,
      status_hunian: form.status_hunian,
      telepon: form.telepon || null,
    };
    const result = editId
      ? await supabase.from("warga").update(payload).eq("id", editId)
      : await supabase.from("warga").insert(payload);

    const err = getSupabaseErrorMessage(result.error);
    if (err) {
      setError(err);
      return;
    }
    setShowForm(false);
    setEditId(null);
    setForm(emptyForm);
    fetchData();
  }

  async function handleDelete(id: string) {
    if (!canManage || !confirm("Hapus warga ini beserta dokumen terkait?"))
      return;
    await supabase.from("warga").delete().eq("id", id);
    if (selectedId === id) setSelectedId(null);
    fetchData();
  }

  function startEdit(w: Warga) {
    setEditId(w.id);
    setForm({
      nama: w.nama,
      blok: w.blok,
      blok_row: w.blok_row,
      nomor_kavling: w.nomor_kavling ? String(w.nomor_kavling) : "",
      status_hunian: w.status_hunian,
      telepon: w.telepon ?? "",
    });
    setShowForm(true);
  }

  async function handleUploadDokumen(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !selectedId || !canManage) return;
    setUploading(true);
    setError(null);
    const { path, error: upErr } = await uploadWargaDokumen(
      supabase,
      file,
      selectedId
    );
    if (upErr || !path) {
      setError(upErr ?? "Gagal unggah dokumen.");
      setUploading(false);
      return;
    }
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { error: insertErr } = await supabase.from("warga_dokumen").insert({
      warga_id: selectedId,
      jenis: uploadJenis,
      nomor: uploadNomor.trim() || null,
      nama_tertera: uploadNama.trim() || null,
      storage_path: path,
      uploaded_by: user?.id ?? null,
    });
    if (insertErr) {
      await removeWargaDokumenFile(supabase, path);
      setError(getSupabaseErrorMessage(insertErr) ?? "Gagal simpan metadata.");
      setUploading(false);
      return;
    }
    setUploadNomor("");
    setUploadNama("");
    setUploading(false);
    await loadDetail(selectedId);
  }

  async function handleViewDokumen(doc: WargaDokumen) {
    const url = await createWargaDokumenSignedUrl(supabase, doc.storage_path);
    if (!url) {
      setError("Tidak bisa membuka dokumen.");
      return;
    }
    window.open(url, "_blank", "noopener,noreferrer");
  }

  async function handleDeleteDokumen(doc: WargaDokumen) {
    if (!canManage || !confirm("Hapus dokumen ini?")) return;
    await supabase.from("warga_dokumen").delete().eq("id", doc.id);
    await removeWargaDokumenFile(supabase, doc.storage_path);
    if (selectedId) await loadDetail(selectedId);
  }

  async function handleAddAnggota(e: React.FormEvent) {
    e.preventDefault();
    if (!canManage || !selectedId || !anggotaForm.nama.trim()) return;
    const { error: insertErr } = await supabase.from("warga_anggota").insert({
      warga_id: selectedId,
      nama: anggotaForm.nama.trim(),
      hubungan: anggotaForm.hubungan,
      nik: anggotaForm.nik.trim() || null,
    });
    if (insertErr) {
      setError(getSupabaseErrorMessage(insertErr));
      return;
    }
    setAnggotaForm({ nama: "", hubungan: "kepala", nik: "" });
    await loadDetail(selectedId);
  }

  async function handleDeleteAnggota(id: string) {
    if (!canManage || !confirm("Hapus anggota ini?")) return;
    await supabase.from("warga_anggota").delete().eq("id", id);
    if (selectedId) await loadDetail(selectedId);
  }

  if (authLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner className="h-8 w-8" />
      </div>
    );
  }

  if (!canManage) {
    return (
      <div className="glass-card space-y-3">
        <h1 className="font-display text-2xl font-bold text-slate-900">
          Data Warga
        </h1>
        <p className="text-sm text-slate-500">
          Halaman ini hanya untuk Ketua, IT, Sekretaris, atau Admin. Login di
          ops.nahara.id.
        </p>
        {surface !== "ops" ? (
          <a href={buildOpsUrl("/login")} className="btn-primary inline-flex">
            Masuk ops
          </a>
        ) : (
          <AdminLoginPrompt message="Login pengurus" />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">
            Data Warga
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Registry KK/KTP & anggota — akses terbatas pengurus
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setShowForm(true);
            setEditId(null);
            setForm(emptyForm);
          }}
          className="btn-primary"
        >
          <Plus className="mr-1.5 h-4 w-4" /> Tambah Warga
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            className="input pl-10"
            placeholder="Cari nama atau blok..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="input w-auto"
          value={blokFilter}
          onChange={(e) => setBlokFilter(e.target.value)}
        >
          <option value="">Semua Blok</option>
          {BLOK_ROWS.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="glass-card space-y-4">
          <h3 className="font-semibold text-slate-900">
            {editId ? "Edit" : "Tambah"} Warga
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Nama</label>
              <input
                className="input"
                value={form.nama}
                onChange={(e) => setForm({ ...form, nama: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="label">Blok (e.g. NHT-1/05)</label>
              <input
                className="input"
                value={form.blok}
                onChange={(e) => setForm({ ...form, blok: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="label">Blok Row</label>
              <select
                className="input"
                value={form.blok_row}
                onChange={(e) => setForm({ ...form, blok_row: e.target.value })}
                required
              >
                <option value="">Pilih</option>
                {BLOK_ROWS.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Nomor Kavling</label>
              <input
                type="number"
                className="input"
                value={form.nomor_kavling}
                onChange={(e) =>
                  setForm({ ...form, nomor_kavling: e.target.value })
                }
              />
            </div>
            <div>
              <label className="label">Status Hunian</label>
              <select
                className="input"
                value={form.status_hunian}
                onChange={(e) =>
                  setForm({
                    ...form,
                    status_hunian: e.target.value as Warga["status_hunian"],
                  })
                }
              >
                <option value="Tetap">Tetap</option>
                <option value="Kontrak">Kontrak</option>
                <option value="Kosong">Kosong</option>
              </select>
            </div>
            <div>
              <label className="label">Telepon</label>
              <input
                className="input"
                value={form.telepon}
                onChange={(e) => setForm({ ...form, telepon: e.target.value })}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="btn-primary">
              Simpan
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setShowForm(false)}
            >
              Batal
            </button>
          </div>
        </form>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-3">
          {loading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner className="h-8 w-8" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="glass-card text-center text-sm text-slate-500">
              Belum ada data warga.
            </div>
          ) : (
            filtered.map((w) => (
              <button
                key={w.id}
                type="button"
                onClick={() => setSelectedId(w.id)}
                className={`glass-card-hover w-full text-left ${
                  selectedId === w.id ? "ring-2 ring-gold/40" : ""
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-slate-900">{w.nama}</p>
                    <p className="mt-1 text-sm text-gold-dark">{w.blok}</p>
                    <div className="mt-2">
                      <StatusBadge
                        status={w.status_hunian}
                        variant={getHunianVariant(w.status_hunian)}
                      />
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => {
                        e.stopPropagation();
                        startEdit(w);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.stopPropagation();
                          startEdit(w);
                        }
                      }}
                      className="rounded p-1 text-slate-400 hover:text-gold-dark"
                    >
                      <Pencil className="h-4 w-4" />
                    </span>
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => {
                        e.stopPropagation();
                        void handleDelete(w.id);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.stopPropagation();
                          void handleDelete(w.id);
                        }
                      }}
                      className="rounded p-1 text-slate-400 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </span>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>

        <div className="glass-card space-y-5">
          {!selected ? (
            <p className="text-sm text-slate-500">
              Pilih warga di kiri untuk kelola dokumen KK/KTP dan anggota
              keluarga.
            </p>
          ) : detailLoading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner className="h-8 w-8" />
            </div>
          ) : (
            <>
              <div>
                <h2 className="font-display text-lg font-semibold text-slate-900">
                  {selected.nama}
                </h2>
                <p className="text-sm text-slate-500">{selected.blok}</p>
              </div>

              <section className="space-y-3">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                  <FileText className="h-4 w-4" /> Dokumen KK / KTP
                </h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="label">Jenis</label>
                    <select
                      className="input"
                      value={uploadJenis}
                      onChange={(e) =>
                        setUploadJenis(e.target.value as WargaDokumenJenis)
                      }
                    >
                      <option value="kk">Kartu Keluarga</option>
                      <option value="ktp">KTP</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Nomor (opsional)</label>
                    <input
                      className="input"
                      value={uploadNomor}
                      onChange={(e) => setUploadNomor(e.target.value)}
                      placeholder="No KK / NIK"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="label">Nama tertera (opsional)</label>
                    <input
                      className="input"
                      value={uploadNama}
                      onChange={(e) => setUploadNama(e.target.value)}
                    />
                  </div>
                </div>
                <label className="btn-secondary inline-flex cursor-pointer items-center gap-2">
                  <Upload className="h-4 w-4" />
                  {uploading ? "Mengunggah…" : "Unggah file"}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,application/pdf"
                    className="hidden"
                    disabled={uploading}
                    onChange={(e) => void handleUploadDokumen(e)}
                  />
                </label>
                <ul className="space-y-2">
                  {dokumen.length === 0 ? (
                    <li className="text-xs text-slate-500">
                      Belum ada dokumen.
                    </li>
                  ) : (
                    dokumen.map((d) => (
                      <li
                        key={d.id}
                        className="flex items-center justify-between gap-2 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-sm"
                      >
                        <div>
                          <span className="font-medium uppercase text-slate-800">
                            {d.jenis}
                          </span>
                          {d.nama_tertera && (
                            <span className="text-slate-500">
                              {" "}
                              · {d.nama_tertera}
                            </span>
                          )}
                          {d.nomor && (
                            <p className="text-xs text-slate-400">{d.nomor}</p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            className="text-xs font-medium text-gold-dark"
                            onClick={() => void handleViewDokumen(d)}
                          >
                            Lihat
                          </button>
                          <button
                            type="button"
                            className="text-xs text-red-600"
                            onClick={() => void handleDeleteDokumen(d)}
                          >
                            Hapus
                          </button>
                        </div>
                      </li>
                    ))
                  )}
                </ul>
              </section>

              <section className="space-y-3 border-t border-slate-100 pt-4">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                  <Users className="h-4 w-4" /> Anggota keluarga
                </h3>
                <form
                  onSubmit={handleAddAnggota}
                  className="grid gap-3 sm:grid-cols-3"
                >
                  <input
                    className="input sm:col-span-1"
                    placeholder="Nama"
                    value={anggotaForm.nama}
                    onChange={(e) =>
                      setAnggotaForm({ ...anggotaForm, nama: e.target.value })
                    }
                    required
                  />
                  <select
                    className="input"
                    value={anggotaForm.hubungan}
                    onChange={(e) =>
                      setAnggotaForm({
                        ...anggotaForm,
                        hubungan: e.target.value as WargaAnggotaHubungan,
                      })
                    }
                  >
                    {(
                      Object.keys(HUBUNGAN_LABEL) as WargaAnggotaHubungan[]
                    ).map((h) => (
                      <option key={h} value={h}>
                        {HUBUNGAN_LABEL[h]}
                      </option>
                    ))}
                  </select>
                  <div className="flex gap-2">
                    <input
                      className="input flex-1"
                      placeholder="NIK (opsional)"
                      value={anggotaForm.nik}
                      onChange={(e) =>
                        setAnggotaForm({ ...anggotaForm, nik: e.target.value })
                      }
                    />
                    <button type="submit" className="btn-primary shrink-0">
                      +
                    </button>
                  </div>
                </form>
                <ul className="space-y-2">
                  {anggota.length === 0 ? (
                    <li className="text-xs text-slate-500">
                      Belum ada anggota.
                    </li>
                  ) : (
                    anggota.map((a) => (
                      <li
                        key={a.id}
                        className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2 text-sm"
                      >
                        <div>
                          <p className="font-medium text-slate-900">{a.nama}</p>
                          <p className="text-xs text-slate-500">
                            {HUBUNGAN_LABEL[a.hubungan]}
                            {a.nik ? ` · ${a.nik}` : ""}
                          </p>
                        </div>
                        <button
                          type="button"
                          className="text-xs text-red-600"
                          onClick={() => void handleDeleteAnggota(a.id)}
                        >
                          Hapus
                        </button>
                      </li>
                    ))
                  )}
                </ul>
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
