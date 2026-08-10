"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Check, Copy, CalendarDays, Trophy, Users, FileText, HeartHandshake, Images, Camera, ExternalLink } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type {
  Activity,
  DonasiCampaign,
  EventContest,
  EventEdition,
  EventGalleryItem,
  Participant,
} from "@/lib/types";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import {
  AGUSTUSAN_ACTIVITY_ID,
  AGUSTUSAN_BANK,
  AGUSTUSAN_CAMPAIGN_ID,
  AGUSTUSAN_MEDIA,
  AGUSTUSAN_TAGLINE,
  AGUSTUSAN_YEAR,
  CONTEST_CATEGORY_LABELS,
} from "@/lib/constants/agustusan";
import { normalizeGoogleDriveUrl } from "@/lib/validation/driveUrl";
import { LoadingSpinner } from "@/components/ui/Loading";
import { AgustusanFab } from "@/components/agustusan/AgustusanFab";
import { GalleryVideoReels } from "@/components/agustusan/GalleryVideoReels";

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
  const [galleryVideos, setGalleryVideos] = useState<EventGalleryItem[]>([]);
  const [activeVideo, setActiveVideo] = useState<EventGalleryItem | null>(null);
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

      // Fallback: seed lomba sering dijalankan sebelum seed donasi → FK null.
      // Untuk edisi 2026, pakai ID campaign/activity Agustusan; kalau ID beda (dibuat via admin), cari by judul.
      let activityId =
        editionRow.activity_id ??
        (editionRow.year === AGUSTUSAN_YEAR ? AGUSTUSAN_ACTIVITY_ID : null);
      let campaignId =
        editionRow.campaign_id ??
        (editionRow.year === AGUSTUSAN_YEAR ? AGUSTUSAN_CAMPAIGN_ID : null);

      const [contestsRes, activityRes, campaignRes, videosRes] = await Promise.all([
        supabase
          .from("event_contests")
          .select("*")
          .eq("edition_id", editionRow.id)
          .order("sort_order"),
        activityId
          ? supabase.from("activities").select("*").eq("id", activityId).maybeSingle()
          : Promise.resolve({ data: null }),
        campaignId
          ? supabase.from("donasi_campaign").select("*").eq("id", campaignId).maybeSingle()
          : Promise.resolve({ data: null }),
        supabase
          .from("event_gallery_items")
          .select("*")
          .eq("edition_id", editionRow.id)
          .eq("is_published", true)
          .eq("media_type", "video")
          .order("created_at", { ascending: false })
          .limit(12),
      ]);

      let activityData = (activityRes.data ?? null) as Activity | null;
      let campaignData = (campaignRes.data ?? null) as DonasiCampaign | null;
      setGalleryVideos(((videosRes.data ?? []) as EventGalleryItem[]).map((item) => ({
        ...item,
        media_type: "video" as const,
        video_url: item.video_url ?? null,
      })));

      if (!campaignData && editionRow.year === AGUSTUSAN_YEAR) {
        const { data: byTitle } = await supabase
          .from("donasi_campaign")
          .select("*")
          .ilike("judul", "%Agustusan%HUT%")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        campaignData = (byTitle ?? null) as DonasiCampaign | null;
        if (campaignData) campaignId = campaignData.id;
      }

      if (!activityData && editionRow.year === AGUSTUSAN_YEAR) {
        const { data: byTitle } = await supabase
          .from("activities")
          .select("*")
          .ilike("title", "%Agustusan%HUT%")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        activityData = (byTitle ?? null) as Activity | null;
        if (activityData) activityId = activityData.id;
      }

      setContests((contestsRes.data ?? []) as EventContest[]);
      setActivity(activityData);
      setCampaign(campaignData);

      if (activityId) {
        const { data: donorsData } = await supabase
          .from("participants")
          .select("id,name,block_number,payment_status")
          .eq("activity_id", activityId)
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

  function scrollToDonasi(e: React.MouseEvent) {
    e.preventDefault();
    document.getElementById("donasi")?.scrollIntoView({ behavior: "smooth", block: "start" });
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
  const showMedia = year === 2026;
  const driveUrl = normalizeGoogleDriveUrl(edition.gallery_drive_url);

  return (
    <div className="-mx-4 -mt-6 overflow-x-clip lg:-mx-6 lg:-mt-8">
      {/* Poster + card overlay (hemat tinggi di HP & desktop) */}
      <section className="relative bg-[#f4f1ec] pb-2 sm:pb-4">
        <Link
          href="/kegiatan/agustusan"
          className="absolute left-3 top-3 z-20 rounded-md bg-white/95 px-2.5 py-1.5 text-xs font-medium text-[#7a1218] shadow-sm hover:bg-white sm:left-4 sm:top-4 sm:text-sm"
        >
          ← Semua edisi
        </Link>

        <div className="relative w-full">
          {showMedia ? (
            <Image
              src={AGUSTUSAN_MEDIA.hero}
              alt="Dirgahayu Republik Indonesia ke-81 — Nahara"
              width={1600}
              height={1000}
              priority
              className="h-auto w-full"
              sizes="100vw"
            />
          ) : (
            <div className="min-h-[220px] bg-[#7a1218] sm:min-h-[320px]" />
          )}
          {/* Soft fade biar card lebih nyatu, tanpa menutup full poster */}
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/25 to-transparent sm:h-32"
            aria-hidden
          />
        </div>

        <div className="relative z-10 mx-auto -mt-14 max-w-7xl px-4 sm:-mt-20 lg:-mt-24 lg:px-6">
          <div className="rounded-2xl bg-[#7a1218] p-5 text-white shadow-xl ring-1 ring-black/10 sm:p-7 lg:p-8">
            <p className="text-xs font-medium tracking-[0.2em] text-[#f0d78c] uppercase sm:text-sm">
              Edisi {edition.year}
            </p>
            <h1 className="mt-1.5 font-display text-2xl font-bold leading-tight sm:text-3xl lg:text-4xl">
              {edition.title}
            </h1>
            {edition.description && (
              <>
                <p className="mt-2 max-w-xl text-sm text-white/85 sm:text-base">
                  {edition.description}
                </p>
                <p className="mt-1 text-xs text-white/75">#HajatanNaharaMerdeka</p>
              </>
            )}
            <div className="mt-5 flex flex-col gap-2.5 sm:mt-6 sm:flex-row sm:flex-wrap sm:gap-3">
              <Link
                href={`/kegiatan/agustusan/${year}/lomba`}
                className="inline-flex items-center justify-center rounded-lg bg-[#c9a84c] px-5 py-3 text-sm font-semibold text-white hover:bg-[#b8963f]"
              >
                <Users className="mr-2 h-4 w-4" />
                Daftar Lomba ({competitionCount})
              </Link>
              <Link
                href={`/kegiatan/agustusan/${year}/juara`}
                className="inline-flex items-center justify-center rounded-lg border border-white/40 bg-white/10 px-5 py-3 text-sm font-medium hover:bg-white/20"
              >
                <Trophy className="mr-2 h-4 w-4" />
                Juara & Hadiah
              </Link>
              <Link
                href={`/kegiatan/agustusan/${year}/galeri`}
                className="inline-flex items-center justify-center rounded-lg border border-white/40 bg-white/10 px-5 py-3 text-sm font-medium hover:bg-white/20"
              >
                <Images className="mr-2 h-4 w-4" />
                Galeri & Dokumentasi
              </Link>
              <Link
                href={`/kegiatan/agustusan/${year}/twibbon`}
                className="inline-flex items-center justify-center rounded-lg border border-white/40 bg-white/10 px-5 py-3 text-sm font-medium hover:bg-white/20"
              >
                <Camera className="mr-2 h-4 w-4" />
                Buat Twibbon
              </Link>
              <a
                href="#donasi"
                onClick={scrollToDonasi}
                className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-white/40 bg-white/10 px-5 py-3 text-sm font-medium hover:bg-white/20"
              >
                <HeartHandshake className="mr-2 h-4 w-4" />
                Donasi
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-4 border-b border-[#c9a84c]/20 bg-[#faf7f0] px-4 py-4 lg:px-6">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 text-sm text-slate-700 sm:flex-row sm:flex-wrap sm:gap-x-8">
          {deadlineLabel && (
            <span className="inline-flex items-start gap-2 font-medium text-[#7a1218] sm:items-center">
              <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 sm:mt-0" />
              Batas daftar peserta: {deadlineLabel}
            </span>
          )}
          <span className="text-slate-500">{AGUSTUSAN_TAGLINE}</span>
        </div>
      </section>

      <div className="mx-auto max-w-7xl space-y-14 px-4 py-12 lg:px-6 lg:py-16">
        {showMedia && (
          <>
            <section className="space-y-4">
              <h2 className="font-display text-2xl font-bold text-slate-900">Video teaser</h2>
              <p className="text-sm text-slate-600">Cuplikan suasana Cluster Nahara menyambut HUT RI.</p>
              <div className="overflow-hidden rounded-2xl bg-black shadow-sm">
                <video
                  className="aspect-video w-full"
                  controls
                  playsInline
                  preload="metadata"
                  poster={AGUSTUSAN_MEDIA.videoPoster}
                >
                  <source src={AGUSTUSAN_MEDIA.video} type="video/mp4" />
                  Browser Anda tidak mendukung pemutar video.
                </video>
              </div>
              <GalleryVideoReels
                videos={galleryVideos}
                seeAllHref={`/kegiatan/agustusan/${year}/galeri?media=video`}
                onSelect={setActiveVideo}
              />
            </section>

            <section className="space-y-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="font-display text-2xl font-bold text-slate-900">Galeri</h2>
                  <p className="text-sm text-slate-600">Suasana cluster & semangat Agustusan.</p>
                </div>
                <div className="flex flex-col items-start gap-1 sm:items-end">
                  <Link
                    href={`/kegiatan/agustusan/${year}/galeri`}
                    className="inline-flex text-sm font-medium text-[#9a7b2e] hover:underline"
                  >
                    Lihat galeri / dokumentasi →
                  </Link>
                  {driveUrl && (
                    <a
                      href={driveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm font-medium text-[#9a7b2e] hover:underline"
                    >
                      Arsip Google Drive
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {AGUSTUSAN_MEDIA.gallery.slice(0, 3).map((img) => (
                  <Link
                    key={img.src}
                    href={`/kegiatan/agustusan/${year}/galeri`}
                    className="relative aspect-[4/3] overflow-hidden"
                  >
                    <Image
                      src={img.src}
                      alt={img.alt}
                      fill
                      className="object-cover transition duration-500 hover:scale-[1.03]"
                      sizes="(max-width: 640px) 100vw, 33vw"
                    />
                  </Link>
                ))}
              </div>
            </section>
          </>
        )}

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
            <pre className="overflow-x-auto whitespace-pre-wrap break-words rounded-xl border border-slate-200 bg-white p-5 font-sans text-sm leading-relaxed text-slate-700">
              {edition.sop_text}
            </pre>
          </section>
        )}

        {/* Always render so #donasi / tombol hero selalu bisa scroll */}
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
                  {pct}% dari {formatCurrency(target)}
                  {paidCount > 0 ? ` · ${paidCount} donatur` : ""}
                </p>
              </>
            )}
            {target === 0 && !campaign && (
              <p className="mt-2 text-sm text-slate-500">
                Open donation — transfer ke rekening di bawah.
              </p>
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
      </div>

      <AgustusanFab year={year} title={edition.title} />

      {activeVideo?.video_url && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 p-4"
          role="dialog"
          aria-modal
          onClick={() => setActiveVideo(null)}
        >
          <div
            className="relative max-h-[90vh] w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <video
              className="max-h-[80vh] w-full rounded-xl bg-black"
              controls
              autoPlay
              playsInline
              poster={activeVideo.image_url}
              src={activeVideo.video_url}
            >
              Browser Anda tidak mendukung pemutar video.
            </video>
            {activeVideo.caption && (
              <p className="mt-3 text-center text-sm text-white/90">
                {activeVideo.caption}
              </p>
            )}
            <button
              type="button"
              onClick={() => setActiveVideo(null)}
              className="absolute -top-2 right-0 rounded-lg bg-white/90 px-3 py-1.5 text-sm font-medium text-slate-800"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
