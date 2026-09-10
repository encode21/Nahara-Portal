"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Vendor, VendorKategori } from "@/lib/types";
import { LoadingSpinner } from "@/components/ui/Loading";
import { useAuth } from "@/lib/hooks/useAuth";
import { AdminLoginPrompt } from "@/components/AdminOnly";
import { getSupabaseErrorMessage } from "@/lib/supabase/errors";
import { MessageCircle, Pencil, Phone, Plus, Trash2 } from "lucide-react";

const KATEGORI_LABEL: Record<VendorKategori, string> = {
  tukang: "Tukang",
  galon: "Galon",
  taman: "Perawatan taman",
  gorden: "Gorden",
  furniture: "Furniture",
  lainnya: "Lainnya",
};

const KATEGORI_LIST = Object.keys(KATEGORI_LABEL) as VendorKategori[];

const emptyForm = {
  nama: "",
  kategori: "tukang" as VendorKategori,
  telepon: "",
  whatsapp: "",
  catatan: "",
  aktif: true,
};

function waLink(whatsapp: string | null | undefined): string | null {
  if (!whatsapp) return null;
  const digits = whatsapp.replace(/\D/g, "");
  if (!digits) return null;
  const normalized = digits.startsWith("0")
    ? `62${digits.slice(1)}`
    : digits;
  return `https://wa.me/${normalized}`;
}

export default function JasaPage() {
  const supabase = createClient();
  const { isWargaRegistry } = useAuth();
  const [list, setList] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [kategoriFilter, setKategoriFilter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [showInactive, setShowInactive] = useState(false);

  const canManage = isWargaRegistry;

  const fetchData = useCallback(async () => {
    setLoading(true);
    let q = supabase.from("vendor").select("*").order("kategori").order("nama");
    if (!canManage || !showInactive) {
      q = q.eq("aktif", true);
    }
    const { data } = await q;
    setList((data ?? []) as Vendor[]);
    setLoading(false);
  }, [supabase, canManage, showInactive]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filtered = useMemo(() => {
    if (!kategoriFilter) return list;
    return list.filter((v) => v.kategori === kategoriFilter);
  }, [list, kategoriFilter]);

  const grouped = useMemo(() => {
    const map = new Map<VendorKategori, Vendor[]>();
    for (const v of filtered) {
      const arr = map.get(v.kategori) ?? [];
      arr.push(v);
      map.set(v.kategori, arr);
    }
    return map;
  }, [filtered]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canManage) return;
    setError(null);
    const payload = {
      nama: form.nama.trim(),
      kategori: form.kategori,
      telepon: form.telepon.trim() || null,
      whatsapp: form.whatsapp.trim() || null,
      catatan: form.catatan.trim() || null,
      aktif: form.aktif,
      updated_at: new Date().toISOString(),
    };
    const result = editId
      ? await supabase.from("vendor").update(payload).eq("id", editId)
      : await supabase.from("vendor").insert(payload);
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

  function startEdit(v: Vendor) {
    setEditId(v.id);
    setForm({
      nama: v.nama,
      kategori: v.kategori,
      telepon: v.telepon ?? "",
      whatsapp: v.whatsapp ?? "",
      catatan: v.catatan ?? "",
      aktif: v.aktif,
    });
    setShowForm(true);
  }

  async function handleDelete(id: string) {
    if (!canManage || !confirm("Hapus vendor ini?")) return;
    await supabase.from("vendor").delete().eq("id", id);
    fetchData();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">
            Jasa & Vendor
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Penyedia jasa lingkungan Nahara — tukang, galon, taman, dan lainnya
          </p>
        </div>
        {canManage && (
          <button
            type="button"
            className="btn-primary"
            onClick={() => {
              setShowForm(true);
              setEditId(null);
              setForm(emptyForm);
            }}
          >
            <Plus className="mr-1.5 h-4 w-4" /> Tambah Vendor
          </button>
        )}
      </div>

      {!canManage && (
        <div className="glass-card flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-slate-400">
            Daftar di bawah untuk warga. Pengurus (Ketua / IT / Sekretaris)
            login di ops untuk menambah atau mengubah.
          </p>
          <AdminLoginPrompt message="Login Pengurus" />
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <select
          className="input w-auto"
          value={kategoriFilter}
          onChange={(e) => setKategoriFilter(e.target.value)}
        >
          <option value="">Semua kategori</option>
          {KATEGORI_LIST.map((k) => (
            <option key={k} value={k}>
              {KATEGORI_LABEL[k]}
            </option>
          ))}
        </select>
        {canManage && (
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
            />
            Tampilkan nonaktif
          </label>
        )}
      </div>

      {showForm && canManage && (
        <form onSubmit={handleSubmit} className="glass-card space-y-4">
          <h3 className="font-semibold text-slate-900">
            {editId ? "Edit" : "Tambah"} Vendor
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
              <label className="label">Kategori</label>
              <select
                className="input"
                value={form.kategori}
                onChange={(e) =>
                  setForm({
                    ...form,
                    kategori: e.target.value as VendorKategori,
                  })
                }
              >
                {KATEGORI_LIST.map((k) => (
                  <option key={k} value={k}>
                    {KATEGORI_LABEL[k]}
                  </option>
                ))}
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
            <div>
              <label className="label">WhatsApp</label>
              <input
                className="input"
                value={form.whatsapp}
                onChange={(e) =>
                  setForm({ ...form, whatsapp: e.target.value })
                }
                placeholder="08…"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Catatan</label>
              <textarea
                className="input min-h-[80px]"
                value={form.catatan}
                onChange={(e) => setForm({ ...form, catatan: e.target.value })}
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={form.aktif}
                onChange={(e) =>
                  setForm({ ...form, aktif: e.target.checked })
                }
              />
              Aktif (tampil di portal)
            </label>
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

      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner className="h-8 w-8" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card text-center text-sm text-slate-500">
          Belum ada vendor terdaftar.
        </div>
      ) : (
        <div className="space-y-8">
          {KATEGORI_LIST.filter((k) => grouped.has(k)).map((kategori) => (
            <section key={kategori} className="space-y-3">
              <h2 className="font-display text-lg font-semibold text-slate-900">
                {KATEGORI_LABEL[kategori]}
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {(grouped.get(kategori) ?? []).map((v) => {
                  const wa = waLink(v.whatsapp);
                  return (
                    <div key={v.id} className="glass-card-hover relative">
                      {canManage && (
                        <div className="absolute right-3 top-3 flex gap-1">
                          <button
                            type="button"
                            onClick={() => startEdit(v)}
                            className="rounded p-1 text-slate-400 hover:text-gold-dark"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleDelete(v.id)}
                            className="rounded p-1 text-slate-400 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                      <p className="pr-12 font-semibold text-slate-900">
                        {v.nama}
                        {!v.aktif && (
                          <span className="ml-2 text-xs font-normal text-slate-400">
                            (nonaktif)
                          </span>
                        )}
                      </p>
                      {v.catatan && (
                        <p className="mt-1 text-sm text-slate-500">
                          {v.catatan}
                        </p>
                      )}
                      <div className="mt-3 flex flex-wrap gap-2">
                        {v.telepon && (
                          <a
                            href={`tel:${v.telepon}`}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                          >
                            <Phone className="h-3.5 w-3.5" />
                            Telepon
                          </a>
                        )}
                        {wa && (
                          <a
                            href={wa}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-medium text-emerald-800 hover:bg-emerald-100"
                          >
                            <MessageCircle className="h-3.5 w-3.5" />
                            WhatsApp
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
