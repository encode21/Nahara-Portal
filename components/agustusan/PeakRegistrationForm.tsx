"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getSupabaseErrorMessage } from "@/lib/supabase/errors";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { StoredImage } from "@/components/ui/StoredImage";
import {
  PEAK_BLOK_ROWS,
  PEAK_EVENT,
  PEAK_TERMS,
  formatHouseholdLabel,
  twibbonLocalStorageKey,
} from "@/lib/constants/agustusan";
import { getPeakLotNumbers } from "@/lib/agustusan-peak";
import type {
  EventEdition,
  EventPeakRegistration,
  PeakParticipantRole,
  Warga,
} from "@/lib/types";
import { PUBLIC_LIMITS, clampText } from "@/lib/validation/publicForms";

type Props = {
  edition: EventEdition;
  year: number;
};

type FormState = {
  blok_row: string;
  nomor_kavling: string;
  participant_name: string;
  participant_role: PeakParticipantRole | "";
  phone: string;
  twibbon_url: string | null;
  warga_id: string | null;
  terms: boolean;
};

const INITIAL: FormState = {
  blok_row: "",
  nomor_kavling: "",
  participant_name: "",
  participant_role: "",
  phone: "",
  twibbon_url: null,
  warga_id: null,
  terms: false,
};

export function PeakRegistrationForm({ edition, year }: Props) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [form, setForm] = useState<FormState>(INITIAL);
  const [replaceTwibbon, setReplaceTwibbon] = useState(false);
  const [slotInfo, setSlotInfo] = useState<{ count: number; roles: string[] }>({
    count: 0,
    roles: [],
  });
  const [verifyOpen, setVerifyOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lots = form.blok_row ? getPeakLotNumbers(form.blok_row) : [];
  const householdLabel =
    form.blok_row && form.nomor_kavling
      ? formatHouseholdLabel(form.blok_row, Number(form.nomor_kavling))
      : null;
  const hasTwibbon = Boolean(form.twibbon_url) && !replaceTwibbon;
  const registrationClosed =
    !PEAK_EVENT.registrationOpen || edition.status === "archived";

  useEffect(() => {
    try {
      const saved = localStorage.getItem(twibbonLocalStorageKey(year));
      if (saved) {
        setForm((f) => (f.twibbon_url ? f : { ...f, twibbon_url: saved }));
      }
    } catch {
      /* ignore */
    }
  }, [year]);

  useEffect(() => {
    if (!form.blok_row || !form.nomor_kavling) {
      setSlotInfo({ count: 0, roles: [] });
      return;
    }
    let cancelled = false;
    (async () => {
      const nomor = Number(form.nomor_kavling);
      const [{ data: regs }, { data: wargaRows }] = await Promise.all([
        supabase
          .from("event_peak_registrations")
          .select("participant_role")
          .eq("edition_id", edition.id)
          .eq("blok_row", form.blok_row)
          .eq("nomor_kavling", nomor)
          .in("status", ["pending", "verified"]),
        supabase
          .from("warga")
          .select("id,nama,telepon,blok_row,nomor_kavling")
          .eq("blok_row", form.blok_row)
          .eq("nomor_kavling", nomor)
          .limit(5),
      ]);
      if (cancelled) return;
      const roles = ((regs ?? []) as { participant_role: string }[]).map(
        (r) => r.participant_role
      );
      setSlotInfo({ count: roles.length, roles });
      const warga = (wargaRows ?? []) as Pick<
        Warga,
        "id" | "nama" | "telepon" | "blok_row" | "nomor_kavling"
      >[];
      if (warga[0] && !form.participant_name) {
        setForm((f) => ({
          ...f,
          participant_name: warga[0].nama,
          phone: f.phone || warga[0].telepon || "",
          warga_id: warga[0].id,
        }));
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.blok_row, form.nomor_kavling, edition.id, supabase]);

  function validateClient(): string | null {
    if (registrationClosed) return "Pendaftaran sudah ditutup.";
    if (!form.blok_row) return "Pilih blok terlebih dahulu.";
    if (!form.nomor_kavling) return "Pilih nomor rumah.";
    if (!form.participant_name.trim() || form.participant_name.trim().length < 2) {
      return "Isi nama peserta (minimal 2 karakter).";
    }
    if (!form.participant_role) return "Pilih peran peserta (suami/istri).";
    if (slotInfo.count >= 2) {
      return `Rumah ${householdLabel} sudah memiliki 2 peserta terdaftar. Maksimal 2 peserta per rumah.`;
    }
    if (slotInfo.roles.includes(form.participant_role)) {
      return `Data ini sudah terdaftar pada acara Agustusan 2026.`;
    }
    if (!form.twibbon_url) {
      return "Silakan upload Twibbon terlebih dahulu untuk melanjutkan pendaftaran.";
    }
    if (!form.terms) {
      return "Anda harus menyetujui Syarat & Ketentuan.";
    }
    return null;
  }

  function openVerify(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const err = validateClient();
    if (err) {
      setError(err);
      return;
    }
    setVerifyOpen(true);
  }

  async function submitConfirmed() {
    setError(null);
    setSubmitting(true);
    const { data, error: rpcError } = await supabase.rpc("register_peak_participant", {
      p_edition_id: edition.id,
      p_blok_row: form.blok_row,
      p_nomor_kavling: Number(form.nomor_kavling),
      p_participant_name: clampText(form.participant_name, PUBLIC_LIMITS.nama),
      p_participant_role: form.participant_role,
      p_phone: form.phone.trim()
        ? clampText(form.phone, PUBLIC_LIMITS.phone)
        : null,
      p_twibbon_url: form.twibbon_url,
      p_warga_id: form.warga_id,
    });
    setSubmitting(false);
    if (rpcError) {
      setError(getSupabaseErrorMessage(rpcError) ?? "Gagal mendaftar. Coba lagi.");
      return;
    }
    const row = data as EventPeakRegistration;
    setVerifyOpen(false);
    router.push(
      `/kegiatan/agustusan/${year}/daftar/sukses?code=${encodeURIComponent(row.registration_code)}`
    );
  }

  if (registrationClosed) {
    return (
      <div className="card text-center">
        <p className="font-medium text-slate-900">Pendaftaran ditutup</p>
        <p className="mt-2 text-sm text-slate-600">
          Pendaftaran Acara Puncak untuk edisi ini sudah tidak dibuka.
        </p>
        <Link href={`/kegiatan/agustusan/${year}`} className="btn-secondary mt-4 inline-flex">
          Kembali ke hub
        </Link>
      </div>
    );
  }

  return (
    <>
      <form onSubmit={openVerify} className="space-y-6">
        <div className="card space-y-4">
          <h2 className="font-display text-lg font-semibold text-slate-900">
            1. Pilih rumah
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="blok_row">
                Blok
              </label>
              <select
                id="blok_row"
                className="input"
                value={form.blok_row}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    blok_row: e.target.value,
                    nomor_kavling: "",
                    warga_id: null,
                  }))
                }
                required
              >
                <option value="">Pilih blok</option>
                {PEAK_BLOK_ROWS.map((row) => (
                  <option key={row} value={row}>
                    {row}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="nomor_kavling">
                Nomor rumah
              </label>
              <select
                id="nomor_kavling"
                className="input"
                value={form.nomor_kavling}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    nomor_kavling: e.target.value,
                    warga_id: null,
                    participant_name: "",
                  }))
                }
                required
                disabled={!form.blok_row}
              >
                <option value="">Pilih nomor</option>
                {lots.map((n) => (
                  <option key={n} value={String(n)}>
                    {String(n).padStart(2, "0")}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {householdLabel && (
            <p className="text-sm text-slate-600">
              Rumah: <span className="font-semibold text-slate-900">{householdLabel}</span>
              {" · "}
              Slot terisi: {slotInfo.count}/2
            </p>
          )}
        </div>

        <div className="card space-y-4">
          <h2 className="font-display text-lg font-semibold text-slate-900">
            2. Data peserta
          </h2>
          <div>
            <label className="label" htmlFor="participant_name">
              Nama
            </label>
            <input
              id="participant_name"
              className="input"
              value={form.participant_name}
              onChange={(e) =>
                setForm((f) => ({ ...f, participant_name: e.target.value }))
              }
              maxLength={PUBLIC_LIMITS.nama}
              required
            />
          </div>
          <div>
            <label className="label" htmlFor="participant_role">
              Peserta
            </label>
            <select
              id="participant_role"
              className="input"
              value={form.participant_role}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  participant_role: e.target.value as PeakParticipantRole | "",
                }))
              }
              required
            >
              <option value="">Pilih</option>
              <option value="suami" disabled={slotInfo.roles.includes("suami")}>
                Suami
              </option>
              <option value="istri" disabled={slotInfo.roles.includes("istri")}>
                Istri
              </option>
            </select>
          </div>
          <div>
            <label className="label" htmlFor="phone">
              WhatsApp (opsional)
            </label>
            <input
              id="phone"
              className="input"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              maxLength={PUBLIC_LIMITS.phone}
              placeholder="08…"
            />
          </div>
        </div>

        <div className="card space-y-4">
          <h2 className="font-display text-lg font-semibold text-slate-900">
            3. Twibbon
          </h2>
          {hasTwibbon ? (
            <div className="space-y-3">
              <p className="text-sm font-medium text-emerald-700">
                Twibbon sudah tersedia — langkah ini bisa dilewati
              </p>
              <div className="mx-auto aspect-square w-40 overflow-hidden rounded-xl ring-1 ring-slate-200">
                <StoredImage
                  src={form.twibbon_url!}
                  alt="Twibbon"
                  className="h-full w-full object-cover"
                />
              </div>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setReplaceTwibbon(true)}
              >
                Ganti foto
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="rounded-lg bg-[#faf7f0] px-3 py-2 text-sm text-slate-700">
                Sudah buat twibbon? Unduh di halaman Twibbon dulu (otomatis tersimpan),
                lalu kembali ke sini. Atau pilih file PNG/JPG hasil unduh dari galeri HP.
              </p>
              <ImageUpload
                folder="agustusan"
                value={form.twibbon_url}
                onChange={(url) => {
                  setForm((f) => ({ ...f, twibbon_url: url }));
                  setReplaceTwibbon(false);
                  if (url) {
                    try {
                      localStorage.setItem(twibbonLocalStorageKey(year), url);
                    } catch {
                      /* ignore */
                    }
                  }
                }}
                label="Pilih / upload twibbon"
                hint="Pilih file twibbon dari HP, atau upload baru. JPG/PNG/WebP, maks. 5 MB."
              />
            </div>
          )}
          <p className="text-xs text-slate-500">
            Belum punya twibbon?{" "}
            <Link
              href={`/kegiatan/agustusan/${year}/twibbon`}
              className="font-medium text-[#9a7b2e] hover:underline"
            >
              Buat di halaman Twibbon
            </Link>
            {" · "}
            setelah unduh, kembali ke halaman ini.
          </p>
        </div>

        <div className="card space-y-4">
          <h2 className="font-display text-lg font-semibold text-slate-900">
            4. Syarat & Ketentuan
          </h2>
          <ol className="list-decimal space-y-2 pl-5 text-sm text-slate-700">
            {PEAK_TERMS.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ol>
          <label className="flex items-start gap-3 text-sm text-slate-800">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 rounded border-slate-300"
              checked={form.terms}
              onChange={(e) => setForm((f) => ({ ...f, terms: e.target.checked }))}
            />
            <span>Saya telah membaca dan menyetujui Syarat & Ketentuan.</span>
          </label>
        </div>

        {error && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </p>
        )}

        <button type="submit" className="btn-primary w-full py-3 text-base" disabled={submitting}>
          Daftar
        </button>
      </form>

      {verifyOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl sm:p-6">
            <h3 className="font-display text-xl font-semibold text-slate-900">
              Verifikasi Data Pendaftaran
            </h3>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Nama</dt>
                <dd className="font-medium text-slate-900">{form.participant_name}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Blok</dt>
                <dd className="font-medium text-slate-900">{form.blok_row}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Nomor Rumah</dt>
                <dd className="font-medium text-slate-900">
                  {String(form.nomor_kavling).padStart(2, "0")}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Peserta</dt>
                <dd className="font-medium capitalize text-slate-900">
                  {form.participant_role}
                </dd>
              </div>
              {form.phone && (
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500">WhatsApp</dt>
                  <dd className="font-medium text-slate-900">{form.phone}</dd>
                </div>
              )}
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Twibbon</dt>
                <dd className="font-medium text-emerald-700">✓ Sudah diupload</dd>
              </div>
            </dl>
            {form.twibbon_url && (
              <div className="mx-auto mt-4 aspect-square w-28 overflow-hidden rounded-lg ring-1 ring-slate-200">
                <StoredImage
                  src={form.twibbon_url}
                  alt="Preview twibbon"
                  className="h-full w-full object-cover"
                />
              </div>
            )}
            <p className="mt-4 text-sm text-slate-600">Apakah seluruh data sudah benar?</p>
            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                className="btn-secondary flex-1"
                disabled={submitting}
                onClick={() => setVerifyOpen(false)}
              >
                Kembali Edit
              </button>
              <button
                type="button"
                className="btn-primary flex-1"
                disabled={submitting}
                onClick={submitConfirmed}
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Mendaftarkan...
                  </>
                ) : (
                  "Data Sudah Benar"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
