"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Check, Copy, MapPin, CalendarDays, HeartHandshake } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Activity, DonasiCampaign, Participant } from "@/lib/types";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { LOGO_SRC } from "@/lib/constants/brand";
import {
  AGUSTUSAN_ACTIVITY_ID,
  AGUSTUSAN_BANK,
  AGUSTUSAN_CAMPAIGN_ID,
  AGUSTUSAN_TAGLINE,
  AGUSTUSAN_TITLE,
} from "@/lib/constants/agustusan";
import { LoadingSpinner } from "@/components/ui/Loading";

type Donor = Pick<Participant, "id" | "name" | "block_number" | "payment_status">;

export default function AgustusanPage() {
  const supabase = useMemo(() => createClient(), []);
  const [activity, setActivity] = useState<Activity | null>(null);
  const [campaign, setCampaign] = useState<DonasiCampaign | null>(null);
  const [donors, setDonors] = useState<Donor[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [actRes, campRes, donorsRes] = await Promise.all([
        supabase.from("activities").select("*").eq("id", AGUSTUSAN_ACTIVITY_ID).maybeSingle(),
        supabase.from("donasi_campaign").select("*").eq("id", AGUSTUSAN_CAMPAIGN_ID).maybeSingle(),
        supabase
          .from("participants")
          .select("id,name,block_number,payment_status")
          .eq("activity_id", AGUSTUSAN_ACTIVITY_ID)
          .order("name", { ascending: true }),
      ]);

      setActivity((actRes.data ?? null) as Activity | null);
      setCampaign((campRes.data ?? null) as DonasiCampaign | null);
      setDonors((donorsRes.data ?? []) as Donor[]);
      setLoading(false);
    }

    load();
  }, [supabase]);

  async function copyRekening() {
    try {
      await navigator.clipboard.writeText(AGUSTUSAN_BANK.number);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner className="h-8 w-8" />
      </div>
    );
  }

  if (!activity) {
    return (
      <div className="mx-auto max-w-lg space-y-4 py-12 text-center">
        <h1 className="font-display text-2xl font-bold text-slate-900">{AGUSTUSAN_TITLE}</h1>
        <p className="text-sm text-slate-600">
          Data kegiatan belum ada di database. Jalankan migration{" "}
          <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">
            20260806_seed_agustusan_hut_ri.sql
          </code>{" "}
          di Supabase SQL Editor.
        </p>
        <Link href="/kegiatan" className="btn-primary inline-flex">
          Kembali ke Kegiatan
        </Link>
      </div>
    );
  }

  const collected = campaign?.collected_amount ?? 0;
  const target = campaign?.target_amount ?? collected;
  const pct =
    target > 0 ? Math.min(100, Math.round((collected / target) * 100)) : 0;
  const paidCount = donors.filter((d) => d.payment_status).length;

  return (
    <div className="agustusan-page -mx-4 -mt-6 space-y-0 lg:-mx-6 lg:-mt-8">
      {/* Hero — one composition */}
      <section className="relative isolate min-h-[min(92vh,720px)] overflow-hidden bg-[#7a1218] text-white">
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              "linear-gradient(180deg, #9b1b23 0%, #7a1218 42%, #c9a84c33 100%), repeating-linear-gradient(-18deg, transparent, transparent 12px, rgba(255,255,255,0.04) 12px, rgba(255,255,255,0.04) 13px)",
          }}
        />
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/35 to-transparent" />
        <div className="absolute -right-16 top-10 h-64 w-64 rounded-full bg-[#c9a84c]/25 blur-3xl animate-[fadeIn_1.2s_ease-out]" />
        <div className="absolute -left-10 bottom-20 h-48 w-48 rounded-full bg-white/10 blur-3xl animate-[fadeIn_1.6s_ease-out]" />

        <div className="relative mx-auto flex min-h-[min(92vh,720px)] max-w-7xl flex-col justify-end px-4 pb-12 pt-10 lg:px-6 lg:pb-16">
          <div className="max-w-2xl animate-[slideIn_0.7s_ease-out]">
            <div className="mb-6 flex items-center gap-3">
              <Image
                src={LOGO_SRC}
                alt="Nahara"
                width={48}
                height={48}
                className="h-12 w-12 rounded-full bg-white/95 object-contain p-1 shadow-lg"
                priority
              />
              <p className="font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
                Nahara
              </p>
            </div>

            <p className="text-sm font-medium tracking-[0.2em] text-[#f0d78c] uppercase">
              HUT RI ke-81 · 2026
            </p>
            <h1 className="mt-3 font-display text-4xl font-bold leading-[1.1] tracking-tight text-white sm:text-5xl lg:text-6xl">
              {activity.title}
            </h1>
            <p className="mt-4 max-w-lg text-base text-white/85 sm:text-lg">
              Donasi terbuka warga Cluster Nahara. Semoga menjadi berkah bagi kita semua.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#donasi" className="inline-flex items-center justify-center rounded-lg bg-[#c9a84c] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-black/20 transition hover:bg-[#b8963f]">
                <HeartHandshake className="mr-2 h-4 w-4" />
                Ikut Donasi
              </a>
              <a
                href="#donatur"
                className="inline-flex items-center justify-center rounded-lg border border-white/35 bg-white/10 px-5 py-3 text-sm font-medium text-white backdrop-blur-sm transition hover:bg-white/20"
              >
                Lihat Donatur ({paidCount})
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Meta strip */}
      <section className="border-b border-[#c9a84c]/20 bg-[#faf7f0] px-4 py-5 lg:px-6">
        <div className="mx-auto flex max-w-7xl flex-wrap gap-x-8 gap-y-3 text-sm text-slate-700">
          <span className="inline-flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-[#9b1b23]" />
            {formatDateTime(activity.date)}
            <span className="text-slate-400">(bisa diedit admin)</span>
          </span>
          {activity.location && (
            <span className="inline-flex items-center gap-2">
              <MapPin className="h-4 w-4 text-[#9b1b23]" />
              {activity.location}
            </span>
          )}
          <span className="text-slate-500">{AGUSTUSAN_TAGLINE}</span>
        </div>
      </section>

      <div className="mx-auto max-w-7xl space-y-14 px-4 py-12 lg:px-6 lg:py-16">
        {/* Dana terkumpul */}
        <section className="space-y-4">
          <h2 className="font-display text-2xl font-bold text-slate-900">Dana terkumpul</h2>
          <p className="max-w-xl text-sm text-slate-600">
            Update per 6 Agustus 2026 · open donation — nominal bebas.
          </p>
          <div className="rounded-2xl border border-[#c9a84c]/25 bg-gradient-to-br from-white to-[#faf7f0] p-6 sm:p-8">
            <p className="font-display text-3xl font-bold tracking-tight text-[#7a1218] sm:text-4xl">
              {formatCurrency(collected)}
            </p>
            {target > 0 && (
              <>
                <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#9b1b23] to-[#c9a84c] transition-all duration-1000 ease-out"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p className="mt-2 text-sm text-slate-500">
                  {pct}% dari {formatCurrency(target)} · {paidCount} donatur
                </p>
              </>
            )}
          </div>
        </section>

        {/* Transfer */}
        <section id="donasi" className="scroll-mt-24 space-y-4">
          <h2 className="font-display text-2xl font-bold text-slate-900">Transfer donasi</h2>
          <p className="max-w-xl text-sm text-slate-600">
            Mohon dana donasi ditransfer ke rekening berikut.
          </p>
          <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
            <div>
              <p className="text-xs font-medium tracking-wide text-slate-500 uppercase">
                {AGUSTUSAN_BANK.bank}
              </p>
              <p className="mt-1 font-display text-2xl font-bold tracking-wide text-slate-900 sm:text-3xl">
                {AGUSTUSAN_BANK.number}
              </p>
              <p className="mt-1 text-sm text-slate-600">a.n. {AGUSTUSAN_BANK.name}</p>
              <p className="mt-3 text-xs text-slate-500">{AGUSTUSAN_BANK.contactNote}</p>
            </div>
            <button
              type="button"
              onClick={copyRekening}
              className="inline-flex shrink-0 items-center justify-center rounded-lg bg-[#7a1218] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#9b1b23]"
            >
              {copied ? (
                <>
                  <Check className="mr-2 h-4 w-4" /> Tersalin
                </>
              ) : (
                <>
                  <Copy className="mr-2 h-4 w-4" /> Salin No. Rek
                </>
              )}
            </button>
          </div>
        </section>

        {/* Donatur */}
        <section id="donatur" className="scroll-mt-24 space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="font-display text-2xl font-bold text-slate-900">
                Daftar donatur
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Terima kasih kepada warga yang sudah berpartisipasi.
              </p>
            </div>
            <Link href="/kegiatan" className="text-sm text-[#9a7b2e] hover:underline">
              ← Semua kegiatan
            </Link>
          </div>

          {donors.length === 0 ? (
            <p className="text-sm text-slate-500">Belum ada data donatur.</p>
          ) : (
            <ol className="columns-1 gap-x-8 sm:columns-2 lg:columns-3">
              {donors.map((d, i) => (
                <li
                  key={d.id}
                  className="mb-2 break-inside-avoid border-b border-slate-100 py-2.5 text-sm animate-[fadeIn_0.5s_ease-out]"
                  style={{ animationDelay: `${Math.min(i, 20) * 20}ms` }}
                >
                  <span className="mr-2 tabular-nums text-slate-400">
                    {String(i + 1).padStart(2, "0")}.
                  </span>
                  <span className="font-medium text-slate-900">{d.name}</span>
                  {d.block_number && (
                    <span className="ml-1.5 text-slate-500">{d.block_number}</span>
                  )}
                  {d.payment_status && (
                    <span className="ml-2 inline-flex items-center text-[#9b1b23]" title="Sudah transfer">
                      <Check className="h-3.5 w-3.5" strokeWidth={3} />
                    </span>
                  )}
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </div>
  );
}
