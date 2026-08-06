"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Check, Copy, CalendarDays, Trophy, Users, FileText, HeartHandshake } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Activity, DonasiCampaign, EventContest, EventEdition, Participant } from "@/lib/types";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { LOGO_SRC } from "@/lib/constants/brand";
import {
  AGUSTUSAN_BANK,
  AGUSTUSAN_TAGLINE,
  CONTEST_CATEGORY_LABELS,
} from "@/lib/constants/agustusan";
import { LoadingSpinner } from "@/components/ui/Loading";

type Donor = Pick<Participant, "id" | "name" | "block_number" | "payment_status">;

export default function AgustusanEditionPage() {
  const params = useParams();
  const year = Number(params.year);
  const supabase = useMemo(() => createClient(), []);

  const [edition, setEdition] = useState<EventEdition | null>(null);
  const [contests, setContests] = useState<EventContest[]>([]);
  const [activity, setActivity] = useState<Activity | null>(null);
  const [campaign, setCampaign] = useState<DonasiCampaign | null>(null);
  const [donors, setDonors] = useState<Donor[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!Number.isFinite(year)) {
      setLoading(false);
      return;
    }

    async function load() {
      setLoading(true);
      const { data: ed } = await supabase
        .from("event_editions")
        .select("*")
        .eq("year", year)
        .maybeSingle();

      const editionRow = (ed ?? null) as EventEdition | null;
      setEdition(editionRow);

      if (!editionRow) {
        setLoading(false);
        return;
      }

      const [contestsRes, activityRes, campaignRes] = await Promise.all([
        supabase
          .from("event_contests")
          .select("*")
          .eq("edition_id", editionRow.id)
          .order("sort_order"),
        editionRow.activity_id
          ? supabase.from("activities").select("*").eq("id", editionRow.activity_id).maybeSingle()
          : Promise.resolve({ data: null }),
        editionRow.campaign_id
          ? supabase
              .from("donasi_campaign")
              .select("*")
              .eq("id", editionRow.campaign_id)
              .maybeSingle()
          : Promise.resolve({ data: null }),
      ]);

      setContests((contestsRes.data ?? []) as EventContest[]);
      setActivity((activityRes.data ?? null) as Activity | null);
      setCampaign((campaignRes.data ?? null) as DonasiCampaign | null);

      if (editionRow.activity_id) {
        const { data: donorsData } = await supabase
          .from("participants")
          .select("id,name,block_number,payment_status")
          .eq("activity_id", editionRow.activity_id)
          .order("name");
        setDonors((donorsData ?? []) as Donor[]);
      }

      setLoading(false);
    }

    load();
  }, [supabase, year]);

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

  if (!edition) {
    return (
      <div className="py-12 text-center">
        <p className="text-slate-600">Edisi {year} tidak ditemukan.</p>
        <Link href="/kegiatan/agustusan" className="mt-4 inline-block text-accent hover:underline">
          Kembali ke hub Agustusan
        </Link>
      </div>
    );
  }

  const competitionCount = contests.filter((c) => c.is_competition).length;
  const collected = campaign?.collected_amount ?? 0;
  const target = campaign?.target_amount ?? collected;
  const pct = target > 0 ? Math.min(100, Math.round((collected / target) * 100)) : 0;
  const paidCount = donors.filter((d) => d.payment_status).length;
  const deadlineLabel = edition.registration_closes_at
    ? formatDateTime(edition.registration_closes_at)
    : null;

  return (
    <div className="-mx-4 -mt-6 space-y-0 lg:-mx-6 lg:-mt-8">
      <section className="relative isolate min-h-[min(70vh,560px)] overflow-hidden bg-[#7a1218] text-white">
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              "linear-gradient(180deg, #9b1b23 0%, #7a1218 45%, #c9a84c33 100%), repeating-linear-gradient(-18deg, transparent, transparent 12px, rgba(255,255,255,0.04) 12px, rgba(255,255,255,0.04) 13px)",
          }}
        />
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/35 to-transparent" />

        <div className="relative mx-auto flex min-h-[min(70vh,560px)] max-w-7xl flex-col justify-end px-4 pb-10 pt-8 lg:px-6 lg:pb-14">
          <Link href="/kegiatan/agustusan" className="mb-6 text-sm text-white/70 hover:text-white">
            ← Semua edisi
          </Link>
          <div className="mb-5 flex items-center gap-3">
            <Image
              src={LOGO_SRC}
              alt="Nahara"
              width={44}
              height={44}
              className="h-11 w-11 rounded-full bg-white/95 object-contain p-1"
              priority
            />
            <p className="font-display text-2xl font-bold">Nahara</p>
          </div>
          <p className="text-sm font-medium tracking-[0.2em] text-[#f0d78c] uppercase">
            Edisi {edition.year}
          </p>
          <h1 className="mt-2 font-display text-4xl font-bold leading-tight sm:text-5xl">
            {edition.title}
          </h1>
          {edition.description && (
            <p className="mt-3 max-w-xl text-white/85">{edition.description}</p>
          )}
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href={`/kegiatan/agustusan/${year}/lomba`}
              className="inline-flex items-center rounded-lg bg-[#c9a84c] px-5 py-3 text-sm font-semibold text-white hover:bg-[#b8963f]"
            >
              <Users className="mr-2 h-4 w-4" />
              Daftar Lomba ({competitionCount})
            </Link>
            <Link
              href={`/kegiatan/agustusan/${year}/juara`}
              className="inline-flex items-center rounded-lg border border-white/35 bg-white/10 px-5 py-3 text-sm font-medium backdrop-blur-sm hover:bg-white/20"
            >
              <Trophy className="mr-2 h-4 w-4" />
              Juara & Hadiah
            </Link>
            <a
              href="#donasi"
              className="inline-flex items-center rounded-lg border border-white/35 bg-white/10 px-5 py-3 text-sm font-medium backdrop-blur-sm hover:bg-white/20"
            >
              <HeartHandshake className="mr-2 h-4 w-4" />
              Donasi
            </a>
          </div>
        </div>
      </section>

      <section className="border-b border-[#c9a84c]/20 bg-[#faf7f0] px-4 py-4 lg:px-6">
        <div className="mx-auto flex max-w-7xl flex-wrap gap-x-8 gap-y-2 text-sm text-slate-700">
          {deadlineLabel && (
            <span className="inline-flex items-center gap-2 font-medium text-[#7a1218]">
              <CalendarDays className="h-4 w-4" />
              Batas daftar peserta: {deadlineLabel}
            </span>
          )}
          <span className="text-slate-500">{AGUSTUSAN_TAGLINE}</span>
        </div>
      </section>

      <div className="mx-auto max-w-7xl space-y-14 px-4 py-12 lg:px-6 lg:py-16">
        <section className="space-y-4">
          <h2 className="font-display text-2xl font-bold text-slate-900">Jadwal lomba</h2>
          <p className="text-sm text-slate-600">
            {competitionCount} perlombaan · lihat detail & daftar peserta per lomba.
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {contests
              .filter((c) => c.is_competition)
              .slice(0, 6)
              .map((c) => (
                <Link
                  key={c.id}
                  href={`/kegiatan/agustusan/${year}/lomba/${c.id}`}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-3 transition hover:border-[#c9a84c]/40"
                >
                  <p className="text-xs text-slate-500">
                    {CONTEST_CATEGORY_LABELS[c.category] ?? c.category}
                  </p>
                  <p className="mt-0.5 font-medium text-slate-900">{c.title}</p>
                  {c.starts_at && (
                    <p className="mt-1 text-xs text-slate-500">{formatDateTime(c.starts_at)}</p>
                  )}
                </Link>
              ))}
          </div>
          <Link
            href={`/kegiatan/agustusan/${year}/lomba`}
            className="inline-flex text-sm font-medium text-[#9a7b2e] hover:underline"
          >
            Lihat semua lomba →
          </Link>
        </section>

        {edition.sop_text && (
          <section className="space-y-3">
            <h2 className="font-display text-2xl font-bold text-slate-900">
              <FileText className="mr-2 inline h-6 w-6 text-[#9b1b23]" />
              SOP singkat
            </h2>
            <pre className="whitespace-pre-wrap rounded-xl border border-slate-200 bg-white p-5 font-sans text-sm leading-relaxed text-slate-700">
              {edition.sop_text}
            </pre>
          </section>
        )}

        {(activity || campaign) && (
          <>
            <section className="space-y-4">
              <h2 className="font-display text-2xl font-bold text-slate-900">Dana terkumpul</h2>
              <div className="rounded-2xl border border-[#c9a84c]/25 bg-gradient-to-br from-white to-[#faf7f0] p-6 sm:p-8">
                <p className="font-display text-3xl font-bold text-[#7a1218] sm:text-4xl">
                  {formatCurrency(collected)}
                </p>
                {target > 0 && (
                  <>
                    <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#9b1b23] to-[#c9a84c]"
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

            <section id="donasi" className="scroll-mt-24 space-y-4">
              <h2 className="font-display text-2xl font-bold text-slate-900">Transfer donasi</h2>
              <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
                <div>
                  <p className="text-xs font-medium tracking-wide text-slate-500 uppercase">
                    {AGUSTUSAN_BANK.bank}
                  </p>
                  <p className="mt-1 font-display text-2xl font-bold tracking-wide sm:text-3xl">
                    {AGUSTUSAN_BANK.number}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">a.n. {AGUSTUSAN_BANK.name}</p>
                  <p className="mt-3 text-xs text-slate-500">{AGUSTUSAN_BANK.contactNote}</p>
                </div>
                <button
                  type="button"
                  onClick={copyRekening}
                  className="inline-flex shrink-0 items-center justify-center rounded-lg bg-[#7a1218] px-5 py-3 text-sm font-medium text-white hover:bg-[#9b1b23]"
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

            <section id="donatur" className="scroll-mt-24 space-y-4">
              <h2 className="font-display text-2xl font-bold text-slate-900">Daftar donatur</h2>
              {donors.length === 0 ? (
                <p className="text-sm text-slate-500">Belum ada data donatur.</p>
              ) : (
                <ol className="columns-1 gap-x-8 sm:columns-2 lg:columns-3">
                  {donors.map((d, i) => (
                    <li
                      key={d.id}
                      className="mb-2 break-inside-avoid border-b border-slate-100 py-2.5 text-sm"
                    >
                      <span className="mr-2 tabular-nums text-slate-400">
                        {String(i + 1).padStart(2, "0")}.
                      </span>
                      <span className="font-medium text-slate-900">{d.name}</span>
                      {d.block_number && (
                        <span className="ml-1.5 text-slate-500">{d.block_number}</span>
                      )}
                      {d.payment_status && (
                        <Check className="ml-1 inline h-3.5 w-3.5 text-[#9b1b23]" strokeWidth={3} />
                      )}
                    </li>
                  ))}
                </ol>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}
