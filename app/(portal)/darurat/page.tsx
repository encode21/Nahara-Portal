"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Flame,
  HeartPulse,
  MapPin,
  Phone,
  Shield,
  Siren,
  Waves,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { useWargaIdentity } from "@/lib/hooks/useWargaIdentity";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { getSupabaseErrorMessage } from "@/lib/supabase/errors";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { useNaharaLoaderOptional } from "@/components/ui/NaharaLoaderProvider";
import {
  EMERGENCY_KIND_LABEL,
  EMERGENCY_STATUS_FLOW,
} from "@/lib/constants/emergency";
import type { EmergencyIncident, EmergencyKind } from "@/lib/types";

const KINDS: {
  id: EmergencyKind;
  label: string;
  icon: typeof Flame;
  tone: string;
}[] = [
  {
    id: "kebakaran",
    label: "Kebakaran",
    icon: Flame,
    tone: "bg-orange-50 text-orange-700 ring-orange-100",
  },
  {
    id: "medis",
    label: "Medis",
    icon: HeartPulse,
    tone: "bg-rose-50 text-rose-700 ring-rose-100",
  },
  {
    id: "keamanan",
    label: "Keamanan",
    icon: Shield,
    tone: "bg-sky-50 text-sky-700 ring-sky-100",
  },
  {
    id: "bencana",
    label: "Bencana",
    icon: Waves,
    tone: "bg-cyan-50 text-cyan-800 ring-cyan-100",
  },
  {
    id: "lainnya",
    label: "Lainnya",
    icon: AlertTriangle,
    tone: "bg-sand-100 text-ink-soft ring-sand-200",
  },
];

const CALLS: { label: string; tel: string; hint: string; kinds?: EmergencyKind[] }[] =
  [
    {
      label: "Pemadam Kebakaran",
      tel: "113",
      hint: "Damkar",
      kinds: ["kebakaran"],
    },
    {
      label: "Ambulans / Medis",
      tel: "118",
      hint: "atau 119",
      kinds: ["medis"],
    },
    { label: "Polisi", tel: "110", hint: "Darurat", kinds: ["keamanan"] },
    { label: "Pemadam Kebakaran", tel: "113", hint: "Damkar" },
    { label: "Ambulans / Medis", tel: "118", hint: "atau 119" },
    { label: "Polisi", tel: "110", hint: "Darurat" },
  ];

type Step = "confirm" | "kind" | "details" | "calls";

function uniqueCalls(kind: EmergencyKind | null) {
  const prioritized = CALLS.filter((c) => kind && c.kinds?.includes(kind));
  const general = CALLS.filter((c) => !c.kinds);
  const seen = new Set<string>();
  const out: typeof CALLS = [];
  for (const c of [...prioritized, ...general]) {
    if (seen.has(c.tel)) continue;
    seen.add(c.tel);
    out.push(c);
  }
  return out;
}

async function tryGetCoords(): Promise<{ lat: number; lng: number } | null> {
  if (typeof navigator === "undefined" || !navigator.geolocation) return null;
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60_000 },
    );
  });
}

export default function DaruratPage() {
  const { identity, change } = useWargaIdentity();
  const loader = useNaharaLoaderOptional();
  const [step, setStep] = useState<Step>("confirm");
  const [kind, setKind] = useState<EmergencyKind | null>(null);
  const [note, setNote] = useState("");
  const [fotoUrl, setFotoUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [incident, setIncident] = useState<EmergencyIncident | null>(null);

  const kindMeta = useMemo(
    () => KINDS.find((k) => k.id === kind) ?? null,
    [kind],
  );

  const callOptions = useMemo(() => uniqueCalls(kind), [kind]);

  function goDetails(next: EmergencyKind) {
    setKind(next);
    setError(null);
    setStep("details");
  }

  async function submitIncident() {
    if (!kind) return;
    if (!identity) {
      setError("Pilih identitas rumah terlebih dahulu.");
      return;
    }

    setSubmitting(true);
    setError(null);
    loader?.start("Mengirim laporan darurat");

    try {
      const coords = await tryGetCoords();
      const supabase = createClient();
      const { data, error: insertError } = await supabase
        .from("emergency_incidents")
        .insert({
          kind,
          status: "Dilaporkan",
          warga_id: identity.wargaId,
          reporter_nama: identity.nama.trim(),
          reporter_blok: identity.blok.trim(),
          note: note.trim() || null,
          foto_url: fotoUrl,
          lat: coords?.lat ?? null,
          lng: coords?.lng ?? null,
        })
        .select("*")
        .single();

      if (insertError || !data) {
        throw new Error(
          getSupabaseErrorMessage(insertError) || "Gagal menyimpan laporan.",
        );
      }

      setIncident(data as EmergencyIncident);
      setStep("calls");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal menyimpan laporan.");
    } finally {
      setSubmitting(false);
      loader?.done();
    }
  }

  const statusIndex = incident
    ? EMERGENCY_STATUS_FLOW.indexOf(
        incident.status as (typeof EMERGENCY_STATUS_FLOW)[number],
      )
    : 0;

  return (
    <div className="mx-auto max-w-lg space-y-5 pb-4">
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-sand-100 text-ink-soft hover:bg-sand-200"
          aria-label="Kembali"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-red-600">
            Nahara Emergency
          </p>
          <h1 className="font-display text-xl font-bold text-ink">Darurat</h1>
        </div>
      </div>

      <div className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs leading-relaxed text-red-900">
        Hanya untuk keadaan darurat nyata. Laporan non-darurat gunakan{" "}
        <Link href="/pengaduan" className="font-semibold underline">
          Pengaduan
        </Link>
        . Panggilan telepon tidak otomatis — Anda tetap konfirmasi di dialer.
      </div>

      {step === "confirm" && (
        <section className="glass-card space-y-4">
          <div className="flex items-start gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-red-600">
              <Siren className="h-6 w-6" />
            </span>
            <div>
              <h2 className="font-display text-lg font-semibold text-ink">
                Apakah ini keadaan darurat?
              </h2>
              <p className="mt-1 text-sm text-ink-soft">
                Untuk laporan non-darurat (kerusakan, kebersihan, dll), gunakan{" "}
                <Link
                  href="/pengaduan"
                  className="font-medium text-gold-dark underline"
                >
                  Pengaduan
                </Link>
                .
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setStep("kind")}
            className="flex w-full items-center justify-center rounded-xl bg-red-600 px-4 py-3.5 text-sm font-semibold text-white shadow-soft hover:bg-red-700"
          >
            Ya, ini darurat
          </button>
          <Link href="/pengaduan" className="btn-secondary w-full text-center">
            Bukan darurat — buat Pengaduan
          </Link>
        </section>
      )}

      {step === "kind" && (
        <section className="space-y-3">
          <h2 className="font-display text-lg font-semibold text-ink">
            Apa keadaan daruratnya?
          </h2>
          <div className="grid grid-cols-2 gap-2.5">
            {KINDS.map(({ id, label, icon: Icon, tone }) => (
              <button
                key={id}
                type="button"
                onClick={() => goDetails(id)}
                className="surface-tile flex flex-col items-start gap-3 px-3.5 py-4 text-left"
              >
                <span
                  className={cn(
                    "flex h-11 w-11 items-center justify-center rounded-xl ring-1",
                    tone,
                  )}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <span className="text-sm font-semibold text-ink">{label}</span>
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setStep("confirm")}
            className="btn-secondary w-full"
          >
            Kembali
          </button>
        </section>
      )}

      {step === "details" && kindMeta && (
        <section className="glass-card space-y-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-ink-faint">
              Jenis
            </p>
            <p className="mt-0.5 text-base font-semibold text-ink">
              {kindMeta.label}
            </p>
          </div>

          <div className="rounded-xl border border-sand-200 bg-sand-50 px-3.5 py-3">
            <p className="flex items-center gap-1.5 text-xs font-medium text-ink-faint">
              <MapPin className="h-3.5 w-3.5" />
              Lokasi pelapor
            </p>
            {identity ? (
              <p className="mt-1 text-sm font-semibold text-ink">
                {identity.nama} · {identity.blok}
              </p>
            ) : (
              <p className="mt-1 text-sm text-ink-soft">
                Identitas rumah belum dipilih.{" "}
                <button
                  type="button"
                  onClick={change}
                  className="font-medium text-gold-dark underline"
                >
                  Pilih sekarang
                </button>
              </p>
            )}
            <p className="mt-1 text-[11px] text-ink-faint">
              {new Date().toLocaleString("id-ID", {
                timeZone: "Asia/Jakarta",
                dateStyle: "medium",
                timeStyle: "short",
              })}{" "}
              WIB · GPS diminta saat kirim (opsional)
            </p>
          </div>

          <div>
            <label htmlFor="darurat-note" className="label">
              Keterangan singkat (opsional)
            </label>
            <textarea
              id="darurat-note"
              className="input min-h-[88px] resize-y"
              placeholder="Contoh: asap di lantai 2, pintu depan"
              value={note}
              onChange={(e) => setNote(e.target.value.slice(0, 500))}
              maxLength={500}
              disabled={submitting}
            />
          </div>

          <ImageUpload
            folder="darurat"
            value={fotoUrl}
            onChange={setFotoUrl}
            disabled={submitting}
            label="Foto / bukti (opsional)"
            hint="Unggah foto situasi bila aman. JPG/PNG/WebP — maks. 5 MB."
          />

          {error && (
            <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          <button
            type="button"
            onClick={() => void submitIncident()}
            disabled={submitting || !identity}
            className="flex w-full items-center justify-center rounded-xl bg-red-600 px-4 py-3.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
          >
            {submitting ? "Mengirim laporan…" : "Kirim laporan & lanjut panggilan"}
          </button>
          <button
            type="button"
            onClick={() => setStep("kind")}
            disabled={submitting}
            className="btn-secondary w-full"
          >
            Ganti jenis
          </button>
        </section>
      )}

      {step === "calls" && incident && (
        <section className="space-y-4">
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3.5">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />
              <div>
                <p className="text-sm font-semibold text-emerald-900">
                  Laporan tersimpan
                </p>
                <p className="mt-0.5 text-xs text-emerald-800/80">
                  {EMERGENCY_KIND_LABEL[incident.kind] ?? incident.kind}
                  {" · "}
                  {incident.reporter_blok}
                  {" · "}
                  {new Date(incident.created_at).toLocaleTimeString("id-ID", {
                    timeZone: "Asia/Jakarta",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}{" "}
                  WIB
                </p>
                {incident.kode && (
                  <p className="mt-2 font-display text-lg font-bold tracking-wide text-emerald-950">
                    {incident.kode}
                  </p>
                )}
                <p className="mt-1 text-[11px] leading-relaxed text-emerald-800/70">
                  Pengurus/security dapat melihat laporan ini. Ketuk nomor di
                  bawah untuk membuka dialer — panggilan tidak otomatis.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-sand-200 bg-white px-4 py-3.5 shadow-soft">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-faint">
              Status laporan
            </p>
            <ol className="mt-3 space-y-2">
              {EMERGENCY_STATUS_FLOW.map((s, i) => {
                const done = i <= Math.max(0, statusIndex);
                const current = i === Math.max(0, statusIndex);
                return (
                  <li key={s} className="flex items-center gap-2.5 text-sm">
                    <span
                      className={cn(
                        "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
                        done
                          ? "bg-red-600 text-white"
                          : "bg-sand-100 text-ink-faint",
                        current && "ring-2 ring-red-200",
                      )}
                    >
                      {i + 1}
                    </span>
                    <span
                      className={cn(
                        done ? "font-medium text-ink" : "text-ink-faint",
                      )}
                    >
                      {s}
                    </span>
                  </li>
                );
              })}
            </ol>
          </div>

          <div className="space-y-2">
            <h2 className="text-sm font-semibold text-ink">One tap call</h2>
            {callOptions.map((c) => (
              <a
                key={c.tel}
                href={`tel:${c.tel}`}
                className="flex items-center gap-3 rounded-2xl border border-sand-200 bg-white px-4 py-3.5 shadow-soft transition hover:border-gold/40"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-red-600">
                  <Phone className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-ink">
                    {c.label}
                  </span>
                  <span className="block text-xs text-ink-faint">
                    {c.tel}
                    {c.hint ? ` · ${c.hint}` : ""}
                  </span>
                </span>
              </a>
            ))}
            <Link
              href="/info-security"
              className="flex items-center gap-3 rounded-2xl border border-sand-200 bg-white px-4 py-3.5 shadow-soft transition hover:border-gold/40"
            >
              <span className="icon-badge h-11 w-11">
                <Shield className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-ink">
                  Kontak Security Nahara
                </span>
                <span className="block text-xs text-ink-faint">
                  Buka Info Security
                </span>
              </span>
            </Link>
          </div>

          <Link href="/dashboard" className="btn-secondary w-full text-center">
            Kembali ke Dashboard
          </Link>
        </section>
      )}
    </div>
  );
}
