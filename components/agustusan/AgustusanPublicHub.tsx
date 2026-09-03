"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  CalendarDays,
  Camera,
  Check,
  ChevronDown,
  Copy,
  ExternalLink,
  FileText,
  HeartHandshake,
  Images,
  MessageSquare,
  Play,
  Trophy,
  Users,
} from "lucide-react";
import { ContestEntryPanel } from "@/components/agustusan/ContestEntryPanel";
import { GalleryVideoReels } from "@/components/agustusan/GalleryVideoReels";
import { AgustusanFeedbackForm } from "@/components/agustusan/AgustusanFeedbackForm";
import { AgustusanFeedbackList } from "@/components/agustusan/AgustusanFeedbackList";
import { AgustusanFeedbackShareButton } from "@/components/agustusan/AgustusanFeedbackShareButton";
import { LoadingSpinner } from "@/components/ui/Loading";
import { StoredImage } from "@/components/ui/StoredImage";
import { groupContestsByDay } from "@/lib/agustusan";
import {
  AGUSTUSAN_ACTIVITY_ID,
  AGUSTUSAN_BANK,
  AGUSTUSAN_CAMPAIGN_ID,
  AGUSTUSAN_MEDIA,
  AGUSTUSAN_TAGLINE,
  AGUSTUSAN_YEAR,
  CONTEST_CATEGORY_LABELS,
} from "@/lib/constants/agustusan";
import { createClient } from "@/lib/supabase/client";
import type {
  Activity,
  DonasiCampaign,
  EventContest,
  EventContestResult,
  EventEdition,
  EventGalleryItem,
  Participant,
} from "@/lib/types";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { normalizeGoogleDriveUrl } from "@/lib/validation/driveUrl";

const TwibbonMaker = dynamic(
  () =>
    import("@/components/agustusan/TwibbonMaker").then((m) => m.TwibbonMaker),
  {
    ssr: false,
    loading: () => (
      <div className="flex justify-center py-12">
        <LoadingSpinner className="h-7 w-7" />
      </div>
    ),
  }
);

type Donor = Pick<Participant, "id" | "name" | "block_number" | "payment_status">;
type ResultRow = EventContestResult & { contest?: EventContest | null };

function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function AgustusanPublicHub({ year = AGUSTUSAN_YEAR }: { year?: number }) {
  const supabase = useMemo(() => createClient(), []);

  const [edition, setEdition] = useState<EventEdition | null>(null);
  const [contests, setContests] = useState<EventContest[]>([]);
  const [entryCounts, setEntryCounts] = useState<Record<string, number>>({});
  const [results, setResults] = useState<ResultRow[]>([]);
  const [gallery, setGallery] = useState<EventGalleryItem[]>([]);
  const [campaign, setCampaign] = useState<DonasiCampaign | null>(null);
  const [donors, setDonors] = useState<Donor[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [openContestId, setOpenContestId] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<EventGalleryItem | null>(null);
  const [galleryMediaTab, setGalleryMediaTab] = useState<"image" | "video">("image");
  const [feedbackRefreshKey, setFeedbackRefreshKey] = useState(0);

  useEffect(() => {
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

      let activityId =
        editionRow.activity_id ??
        (editionRow.year === AGUSTUSAN_YEAR ? AGUSTUSAN_ACTIVITY_ID : null);
      let campaignId =
        editionRow.campaign_id ??
        (editionRow.year === AGUSTUSAN_YEAR ? AGUSTUSAN_CAMPAIGN_ID : null);

      const [contestsRes, campaignRes, galleryRes] = await Promise.all([
        supabase
          .from("event_contests")
          .select("*")
          .eq("edition_id", editionRow.id)
          .order("sort_order"),
        campaignId
          ? supabase.from("donasi_campaign").select("*").eq("id", campaignId).maybeSingle()
          : Promise.resolve({ data: null }),
        supabase
          .from("event_gallery_items")
          .select("*")
          .eq("edition_id", editionRow.id)
          .eq("is_published", true)
          .order("sort_order", { ascending: true })
          .order("created_at", { ascending: false }),
      ]);

      const contestList = (contestsRes.data ?? []) as EventContest[];
      setContests(contestList);

      let campaignData = (campaignRes.data ?? null) as DonasiCampaign | null;
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
      setCampaign(campaignData);

      if (!activityId && editionRow.year === AGUSTUSAN_YEAR) {
        const { data: byTitle } = await supabase
          .from("activities")
          .select("id")
          .ilike("title", "%Agustusan%HUT%")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        activityId = (byTitle as Pick<Activity, "id"> | null)?.id ?? null;
      }

      if (activityId) {
        const { data: donorsData } = await supabase
          .from("participants")
          .select("id,name,block_number,payment_status")
          .eq("activity_id", activityId)
          .order("name");
        setDonors((donorsData ?? []) as Donor[]);
      }

      if (contestList.length > 0) {
        const contestIds = contestList.map((c) => c.id);
        const [{ data: entries }, { data: resultRows }] = await Promise.all([
          supabase
            .from("event_contest_entries")
            .select("contest_id")
            .eq("status", "registered")
            .in("contest_id", contestIds),
          supabase
            .from("event_contest_results")
            .select("*")
            .eq("published", true)
            .in("contest_id", contestIds)
            .order("rank"),
        ]);

        const map: Record<string, number> = {};
        (entries ?? []).forEach((e: { contest_id: string }) => {
          map[e.contest_id] = (map[e.contest_id] ?? 0) + 1;
        });
        setEntryCounts(map);

        const contestMap = Object.fromEntries(contestList.map((c) => [c.id, c]));
        setResults(
          ((resultRows ?? []) as EventContestResult[]).map((r) => ({
            ...r,
            contest: contestMap[r.contest_id] ?? null,
          }))
        );
      }

      const galleryRows = ((galleryRes.data ?? []) as EventGalleryItem[]).map(
        (item) => ({
          ...item,
          media_type:
            item.media_type === "video" ? ("video" as const) : ("image" as const),
          video_url: item.video_url ?? null,
        })
      );
      if (galleryRows.length > 0) {
        setGallery(galleryRows);
      } else if (year === AGUSTUSAN_YEAR) {
        setGallery(
          AGUSTUSAN_MEDIA.gallery.map((g, i) => ({
            id: `local-${i}`,
            edition_id: editionRow.id,
            image_url: g.src,
            media_type: "image" as const,
            video_url: null,
            caption: g.alt,
            category: "dokumentasi",
            sort_order: i,
            is_published: true,
            created_at: new Date().toISOString(),
          }))
        );
      } else {
        setGallery([]);
      }

      setLoading(false);
    }

    if (Number.isFinite(year)) load();
  }, [supabase, year]);

  useEffect(() => {
    if (loading) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("media") === "video") {
      setGalleryMediaTab("video");
    }
    const hash = window.location.hash.replace(/^#/, "");
    if (!hash) return;
    // Delay until layout paints
    window.requestAnimationFrame(() => scrollToId(hash));
  }, [loading]);

  async function copyRekening() {
    try {
      await navigator.clipboard.writeText(AGUSTUSAN_BANK.number);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  function onNavClick(e: React.MouseEvent, id: string) {
    e.preventDefault();
    history.replaceState(null, "", `#${id}`);
    scrollToId(id);
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
      <div className="px-5 py-16 text-center">
        <p className="text-slate-600">Edisi {year} tidak ditemukan.</p>
        <Link href="/" className="mt-4 inline-block text-[#9a7b2e] hover:underline">
          ← Kembali ke beranda
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
  const showMedia = year === AGUSTUSAN_YEAR;
  const days = groupContestsByDay(contests);
  const driveUrl = normalizeGoogleDriveUrl(edition.gallery_drive_url);
  const galleryImages = gallery.filter((g) => g.media_type !== "video");
  const galleryVideos = gallery
    .filter((g) => g.media_type === "video")
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  const galleryTabItems =
    galleryMediaTab === "video" ? galleryVideos : galleryImages;

  const byContest = new Map<string, ResultRow[]>();
  for (const r of results) {
    const list = byContest.get(r.contest_id) ?? [];
    list.push(r);
    byContest.set(r.contest_id, list);
  }

  return (
    <div className="w-full overflow-x-clip bg-white">
      <section className="relative bg-[#f4f1ec] pb-2 sm:pb-4">
        <Link
          href="/"
          className="absolute left-3 top-3 z-20 rounded-md bg-white/95 px-2.5 py-1.5 text-xs font-medium text-[#7a1218] shadow-sm hover:bg-white sm:left-4 sm:top-4 sm:text-sm"
        >
          ← Beranda
        </Link>

        <div className="relative h-[220px] w-full overflow-hidden sm:h-[280px] lg:h-[340px] xl:h-[380px]">
          {showMedia ? (
            <Image
              src={AGUSTUSAN_MEDIA.hero}
              alt="Cluster Nahara Cimanggis Golf Estate — Agustusan HUT RI"
              fill
              priority
              quality={70}
              className="object-cover object-[center_22%]"
              sizes="100vw"
            />
          ) : (
            <div className="h-full w-full bg-[#7a1218]" />
          )}
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/30 to-transparent sm:h-28"
            aria-hidden
          />
        </div>

        <div className="relative z-10 mx-auto -mt-12 max-w-7xl px-4 sm:-mt-16 lg:-mt-20 lg:px-6">
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
                href="/agustusan/lpj"
                className="inline-flex items-center justify-center rounded-lg bg-[#c9a84c] px-5 py-3 text-sm font-semibold text-[#1a0508] hover:bg-[#f0d78c]"
              >
                <FileText className="mr-2 h-4 w-4" />
                LPJ Dana
              </Link>
              <a
                href="#daftar"
                onClick={(e) => onNavClick(e, "daftar")}
                className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-white/40 bg-white/10 px-5 py-3 text-sm font-medium hover:bg-white/20"
              >
                <Users className="mr-2 h-4 w-4" />
                Daftar Lomba ({competitionCount})
              </a>
              <a
                href="#juara"
                onClick={(e) => onNavClick(e, "juara")}
                className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-white/40 bg-white/10 px-5 py-3 text-sm font-medium hover:bg-white/20"
              >
                <Trophy className="mr-2 h-4 w-4" />
                Juara & Hadiah
              </a>
              <a
                href="#galeri"
                onClick={(e) => onNavClick(e, "galeri")}
                className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-white/40 bg-white/10 px-5 py-3 text-sm font-medium hover:bg-white/20"
              >
                <Images className="mr-2 h-4 w-4" />
                Galeri & Dokumentasi
              </a>
              <a
                href="#twibbon"
                onClick={(e) => onNavClick(e, "twibbon")}
                className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-white/40 bg-white/10 px-5 py-3 text-sm font-medium hover:bg-white/20"
              >
                <Camera className="mr-2 h-4 w-4" />
                Buat Twibbon
              </a>
              <a
                href="#donasi"
                onClick={(e) => onNavClick(e, "donasi")}
                className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-white/40 bg-white/10 px-5 py-3 text-sm font-medium hover:bg-white/20"
              >
                <HeartHandshake className="mr-2 h-4 w-4" />
                Donasi
              </a>
              <a
                href="#masukan"
                onClick={(e) => onNavClick(e, "masukan")}
                className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-white/40 bg-white/10 px-5 py-3 text-sm font-medium hover:bg-white/20"
              >
                <MessageSquare className="mr-2 h-4 w-4" />
                Rating & usulan
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
          <section className="space-y-4">
            <h2 className="font-display text-2xl font-bold text-slate-900">Video teaser</h2>
            <p className="text-sm text-slate-600">
              Cuplikan suasana Cluster Nahara menyambut HUT RI.
            </p>
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
              seeAllHref={`?media=video#galeri`}
              onSeeAll={() => setGalleryMediaTab("video")}
              onSelect={(item) => {
                setLightbox(item);
              }}
            />
          </section>
        )}

        <section id="daftar" className="scroll-mt-24 space-y-6">
          <div>
            <h2 className="font-display text-2xl font-bold text-slate-900">Daftar Lomba</h2>
            <p className="mt-1 text-sm text-slate-600">
              Pilih lomba untuk melihat aturan, peserta, dan mendaftar di halaman ini.
              {deadlineLabel ? ` Batas daftar: ${deadlineLabel}.` : ""}
            </p>
          </div>

          {days.map((day) => (
            <div key={day.key} className="space-y-3">
              <h3 className="font-display text-xl font-semibold text-[#7a1218]">{day.label}</h3>
              <ul className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 bg-white">
                {day.contests.map((c) => {
                  const open = openContestId === c.id;
                  return (
                    <li key={c.id}>
                      <button
                        type="button"
                        onClick={() => setOpenContestId(open ? null : c.id)}
                        className="flex w-full flex-col gap-1 px-4 py-3.5 text-left transition hover:bg-[#faf7f0] sm:flex-row sm:items-center sm:justify-between"
                        aria-expanded={open}
                      >
                        <div>
                          <p className="text-xs text-slate-500">
                            {CONTEST_CATEGORY_LABELS[c.category] ?? c.category}
                            {!c.is_competition && " · Acara"}
                          </p>
                          <p className="font-medium text-slate-900">{c.title}</p>
                          {c.category_note && (
                            <p className="mt-0.5 text-xs text-slate-500">{c.category_note}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-left text-xs text-slate-500 sm:text-right">
                          <div>
                            {c.location && <p>{c.location}</p>}
                            {c.starts_at && <p>{formatDateTime(c.starts_at)}</p>}
                            {c.is_competition && (
                              <p className="mt-0.5 font-medium text-[#9a7b2e]">
                                {entryCounts[c.id] ?? 0} peserta
                              </p>
                            )}
                          </div>
                          <ChevronDown
                            className={`h-4 w-4 shrink-0 text-slate-400 transition ${open ? "rotate-180" : ""}`}
                          />
                        </div>
                      </button>
                      {open && (
                        <div className="px-4 pb-4">
                          <ContestEntryPanel edition={edition} contest={c} />
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </section>

        <section id="juara" className="scroll-mt-24 space-y-6">
          <div>
            <h2 className="flex items-center gap-2 font-display text-2xl font-bold text-slate-900">
              <Trophy className="h-6 w-6 text-[#c9a84c]" />
              Juara & Hadiah
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Pengumuman resmi pemenang lomba HUT RI Cluster Nahara.
            </p>
          </div>

          {byContest.size === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 px-6 py-12 text-center text-sm text-slate-500">
              Belum ada juara yang dipublikasikan. Panitia akan mengumumkan setelah lomba selesai.
            </div>
          ) : (
            Array.from(byContest.entries()).map(([contestId, rows]) => {
              const contest = rows[0]?.contest;
              return (
                <div key={contestId} className="space-y-3">
                  <div>
                    <p className="text-xs text-slate-500">
                      {contest
                        ? CONTEST_CATEGORY_LABELS[contest.category] ?? contest.category
                        : ""}
                    </p>
                    <h3 className="font-display text-xl font-semibold text-slate-900">
                      {contest?.title ?? "Lomba"}
                    </h3>
                  </div>
                  <ol className="space-y-2">
                    {rows
                      .slice()
                      .sort((a, b) => a.rank - b.rank)
                      .map((r) => (
                        <li
                          key={r.id}
                          className="flex flex-wrap items-baseline justify-between gap-2 border-b border-slate-100 py-3"
                        >
                          <div>
                            <span className="mr-3 font-display text-lg font-bold text-[#7a1218]">
                              #{r.rank}
                            </span>
                            <span className="font-medium text-slate-900">{r.winner_label}</span>
                          </div>
                          {r.prize && (
                            <span className="text-sm text-[#9a7b2e]">{r.prize}</span>
                          )}
                        </li>
                      ))}
                  </ol>
                </div>
              );
            })
          )}
        </section>

        <section id="galeri" className="scroll-mt-24 space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="font-display text-2xl font-bold text-slate-900">
                Galeri & Dokumentasi
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Suasana cluster & semangat Agustusan.
              </p>
            </div>
            {driveUrl && (
              <a
                href={driveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#9a7b2e] hover:underline"
              >
                Arsip lengkap di Google Drive
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
          </div>

          {(galleryImages.length > 0 || galleryVideos.length > 0) && (
            <div className="flex flex-wrap gap-2">
              {(
                [
                  { id: "image" as const, label: "Foto", count: galleryImages.length },
                  { id: "video" as const, label: "Video", count: galleryVideos.length },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setGalleryMediaTab(tab.id)}
                  className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
                    galleryMediaTab === tab.id
                      ? "bg-[#9b1b23] text-white"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {tab.label}
                  <span
                    className={`ml-1.5 tabular-nums ${
                      galleryMediaTab === tab.id ? "text-white/80" : "text-slate-500"
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>
          )}

          {galleryTabItems.length === 0 ? (
            <p className="text-sm text-slate-500">
              {galleryMediaTab === "video"
                ? "Belum ada video highlight."
                : "Belum ada foto di galeri."}
              {driveUrl && (
                <>
                  {" "}
                  Buka{" "}
                  <a
                    href={driveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-[#9a7b2e] hover:underline"
                  >
                    arsip Google Drive
                  </a>
                  .
                </>
              )}
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {galleryTabItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setLightbox(item)}
                  className="relative aspect-[4/3] overflow-hidden rounded-xl bg-slate-100 text-left"
                >
                  {item.image_url.startsWith("/") ? (
                    <Image
                      src={item.image_url}
                      alt={item.caption || "Galeri Agustusan Cluster Nahara"}
                      fill
                      quality={65}
                      className="object-cover transition duration-500 hover:scale-[1.03]"
                      sizes="(max-width: 640px) 100vw, 33vw"
                    />
                  ) : (
                    <StoredImage
                      src={item.image_url}
                      alt={item.caption || "Galeri Agustusan Cluster Nahara"}
                      className="h-full w-full object-cover transition duration-500 hover:scale-[1.03]"
                    />
                  )}
                  {item.media_type === "video" && (
                    <span className="absolute inset-0 flex items-center justify-center">
                      <span className="rounded-full bg-black/55 p-3 text-white">
                        <Play className="h-5 w-5 fill-current" />
                      </span>
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </section>

        <section id="twibbon" className="scroll-mt-24 space-y-4">
          <div>
            <h2 className="font-display text-2xl font-bold text-slate-900">Buat Twibbon</h2>
            <p className="mt-1 text-sm text-slate-600">
              Pakai frame HUT ke-81 RI Nahara. Unggah foto, atur posisi, lalu unduh atau bagikan.
            </p>
          </div>
          <TwibbonMaker year={year} shareTitle={edition.title} editionId={edition.id} />
        </section>

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

        <section id="masukan" className="scroll-mt-24 space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="font-display text-2xl font-bold text-slate-900">
                Rating & usulan warga
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Tanpa login. Boleh anonim. Review warga ditampilkan agar Agustusan berikutnya
                lebih proper.
              </p>
            </div>
            <AgustusanFeedbackShareButton year={edition.year} title={edition.title} />
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
            <AgustusanFeedbackForm
              editionId={edition.id}
              source="hub"
              onSubmitted={() => setFeedbackRefreshKey((k) => k + 1)}
            />
          </div>
          <div className="space-y-3">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <h3 className="font-display text-lg font-bold text-slate-900">
                Review & usulan warga
              </h3>
              <Link
                href="/agustusan/masukan"
                className="text-sm font-medium text-[#9a7b2e] hover:underline"
              >
                Buka halaman rating →
              </Link>
            </div>
            <AgustusanFeedbackList
              editionId={edition.id}
              refreshKey={feedbackRefreshKey}
              limit={12}
              compact
            />
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

      {lightbox && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 p-4"
          role="dialog"
          aria-modal
          onClick={() => setLightbox(null)}
        >
          <button
            type="button"
            className="absolute right-4 top-4 rounded-md bg-white/10 px-3 py-1.5 text-sm text-white hover:bg-white/20"
            onClick={() => setLightbox(null)}
          >
            Tutup
          </button>
          <div
            className="relative max-h-[85vh] w-full max-w-4xl"
            onClick={(e) => e.stopPropagation()}
          >
            {lightbox.media_type === "video" && lightbox.video_url ? (
              <video
                className="mx-auto max-h-[80vh] w-full max-w-md bg-black"
                controls
                autoPlay
                playsInline
                poster={lightbox.image_url}
                src={lightbox.video_url}
              >
                Browser Anda tidak mendukung pemutar video.
              </video>
            ) : lightbox.image_url.startsWith("/") ? (
              <Image
                src={lightbox.image_url}
                alt={lightbox.caption || "Galeri Agustusan"}
                width={1600}
                height={1200}
                className="max-h-[80vh] w-full object-contain"
              />
            ) : (
              <StoredImage
                src={lightbox.image_url}
                alt={lightbox.caption || "Galeri Agustusan"}
                className="max-h-[80vh] w-full object-contain"
              />
            )}
            {lightbox.caption && (
              <p className="mt-3 text-center text-sm text-white/85">{lightbox.caption}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
