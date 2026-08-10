import Image from "next/image";
import Link from "next/link";
import {
  AGUSTUSAN_MEDIA,
  AGUSTUSAN_TAGLINE,
  AGUSTUSAN_TITLE,
} from "@/lib/constants/agustusan";
import { createClient } from "@/lib/supabase/server";

type PengumumanRow = {
  id: string;
  judul: string;
  isi: string | null;
  created_at: string;
};

type KegiatanRow = {
  id: string;
  title: string;
  starts_on: string | null;
  status: string | null;
};

function excerpt(text: string | null | undefined, max = 120): string {
  if (!text) return "";
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max).trim()}…`;
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

export async function LandingPage() {
  const supabase = createClient();

  const [{ data: pengumuman }, { data: kegiatan }] = await Promise.all([
    supabase
      .from("pengumuman")
      .select("id, judul, isi, created_at")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("activities")
      .select("id, title, starts_on, status")
      .order("starts_on", { ascending: false, nullsFirst: false })
      .limit(3),
  ]);

  const pengumumanList = (pengumuman ?? []) as PengumumanRow[];
  const kegiatanList = (kegiatan ?? []) as KegiatanRow[];

  // Foto suasana (bukan graphic poster yang sudah penuh teks)
  const heroPhoto =
    AGUSTUSAN_MEDIA.gallery[0]?.src ?? AGUSTUSAN_MEDIA.videoPoster;

  return (
    <div className="w-full bg-white">
      {/* Compact community banner — brand first for SEO */}
      <section className="relative isolate w-full overflow-hidden bg-slate-900">
        <div className="relative h-[300px] w-full sm:h-[360px] lg:h-[400px]">
          <Image
            src={heroPhoto}
            alt="Cluster Nahara di Cimanggis Golf Estate berhias bendera Merah Putih"
            fill
            priority
            quality={70}
            className="object-cover object-[center_40%]"
            sizes="100vw"
          />
          <div
            className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/70 to-slate-950/35"
            aria-hidden
          />
          <div
            className="absolute inset-0 bg-gradient-to-t from-slate-950/50 via-transparent to-slate-950/20"
            aria-hidden
          />

          <div className="absolute inset-0 z-10 flex items-end">
            <div className="mx-auto w-full max-w-5xl px-5 pb-8 pt-20 sm:px-6 sm:pb-10">
              <p className="font-display text-[11px] font-semibold tracking-[0.2em] text-gold sm:text-xs">
                PAGUYUBAN WARGA · CIMANGGIS GOLF ESTATE
              </p>
              <h1 className="mt-2 max-w-2xl font-display text-2xl font-bold leading-tight text-white sm:text-3xl lg:text-4xl">
                Cluster Nahara
              </h1>
              <p className="mt-2 max-w-lg text-sm leading-relaxed text-white/85 sm:text-[15px]">
                Komunitas warga di Cimanggis Golf Estate (CGE). Pengumuman,
                kegiatan, dan info lingkungan — resmi di nahara.id.
              </p>
              <div className="mt-5 flex flex-wrap gap-2.5">
                <Link
                  href="/pengumuman"
                  className="inline-flex items-center justify-center rounded-md bg-gold px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-gold/90"
                >
                  Pengumuman warga
                </Link>
                <Link
                  href="/agustusan"
                  className="inline-flex items-center justify-center rounded-md border border-white/40 bg-black/25 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-black/40"
                >
                  {AGUSTUSAN_TITLE}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Kampanye singkat */}
      <section className="border-b border-slate-200 bg-[#f8f5ef] px-5 py-6 sm:px-6">
        <div className="mx-auto flex max-w-5xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-800/80">
              Sedang berlangsung
            </p>
            <p className="mt-0.5 font-display text-base font-semibold text-slate-900 sm:text-lg">
              {AGUSTUSAN_TITLE}
            </p>
            <p className="text-sm text-slate-600">{AGUSTUSAN_TAGLINE}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/agustusan"
              className="inline-flex items-center justify-center rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Lihat kegiatan
            </Link>
            <Link
              href="/agustusan#twibbon"
              className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:border-gold/50"
            >
              Buat twibbon
            </Link>
          </div>
        </div>
      </section>

      {/* Berita / pengumuman — fokus untuk share */}
      <section className="border-b border-slate-200 bg-white px-5 py-12 sm:px-6 sm:py-14">
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-wrap items-end justify-between gap-3 border-b border-slate-200 pb-4">
            <div>
              <h2 className="font-display text-xl font-bold text-slate-900 sm:text-2xl">
                Pengumuman & berita warga
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Informasi yang bisa dibagikan ke tetangga dan grup warga.
              </p>
            </div>
            <Link
              href="/pengumuman"
              className="text-sm font-semibold text-gold-dark underline decoration-gold/35 underline-offset-4 hover:decoration-gold"
            >
              Semua pengumuman
            </Link>
          </div>

          <ul className="divide-y divide-slate-200">
            {pengumumanList.length === 0 ? (
              <li className="py-8 text-sm text-slate-500">
                Belum ada pengumuman terbaru.
              </li>
            ) : (
              pengumumanList.map((item) => (
                <li key={item.id}>
                  <Link
                    href="/pengumuman"
                    className="group flex flex-col gap-1 py-5 sm:flex-row sm:items-baseline sm:gap-6"
                  >
                    <time className="shrink-0 text-xs font-medium tabular-nums text-slate-400 sm:w-28">
                      {formatDate(item.created_at)}
                    </time>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-display text-base font-semibold text-slate-900 group-hover:text-gold-dark sm:text-lg">
                        {item.judul}
                      </h3>
                      {item.isi && (
                        <p className="mt-1 text-sm leading-relaxed text-slate-600">
                          {excerpt(item.isi)}
                        </p>
                      )}
                    </div>
                  </Link>
                </li>
              ))
            )}
          </ul>
        </div>
      </section>

      {/* Pintasan paguyuban */}
      <section className="bg-[#f3f1ec] px-5 py-12 sm:px-6 sm:py-14">
        <div className="mx-auto max-w-5xl">
          <h2 className="font-display text-xl font-bold text-slate-900 sm:text-2xl">
            Untuk warga sehari-hari
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            Tanpa akun — baca pengumuman dan pantau status pengaduan lingkungan.
          </p>
          <div className="mt-8 grid gap-8 border-t border-slate-300/70 pt-8 sm:grid-cols-2">
            <div>
              <h3 className="font-display text-base font-semibold text-slate-900">
                Pengumuman
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                Kabar keamanan, kebersihan, dan agenda dari pengurus.
              </p>
              <Link
                href="/pengumuman"
                className="mt-3 inline-block text-sm font-semibold text-gold-dark underline decoration-gold/35 underline-offset-4"
              >
                Baca pengumuman
              </Link>
            </div>
            <div>
              <h3 className="font-display text-base font-semibold text-slate-900">
                Pengaduan
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                Lihat status laporan infrastruktur, kebersihan, atau keamanan.
              </p>
              <Link
                href="/pengaduan"
                className="mt-3 inline-block text-sm font-semibold text-gold-dark underline decoration-gold/35 underline-offset-4"
              >
                Lihat pengaduan
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Kegiatan */}
      <section className="border-t border-slate-200 bg-white px-5 py-12 sm:px-6 sm:py-14">
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 className="font-display text-xl font-bold text-slate-900 sm:text-2xl">
              Kegiatan warga
            </h2>
            <Link
              href="/agustusan"
              className="text-sm font-semibold text-gold-dark underline decoration-gold/35 underline-offset-4"
            >
              Lihat Agustusan
            </Link>
          </div>
          <ul className="mt-6 divide-y divide-slate-200 border-y border-slate-200">
            <li>
              <Link
                href="/agustusan"
                className="flex flex-col gap-1 py-4 sm:flex-row sm:items-baseline sm:justify-between"
              >
                <span className="font-display font-semibold text-slate-900">
                  {AGUSTUSAN_TITLE}
                </span>
                <span className="text-xs font-medium text-amber-700 sm:text-sm">
                  Sedang berlangsung
                </span>
              </Link>
            </li>
            {kegiatanList
              .filter((k) => !k.title.toLowerCase().includes("agustusan"))
              .slice(0, 2)
              .map((k) => (
                <li
                  key={k.id}
                  className="flex flex-col gap-1 py-4 sm:flex-row sm:items-baseline sm:justify-between"
                >
                  <span className="font-display font-semibold text-slate-900">
                    {k.title}
                  </span>
                  <span className="text-xs text-slate-500 sm:text-sm">
                    {formatDate(k.starts_on) || "Informasi menyusul"}
                  </span>
                </li>
              ))}
          </ul>
        </div>
      </section>

      {/* Tentang — konten indeks untuk frasa pencarian lokal */}
      <section className="border-t border-slate-200 bg-white px-5 py-12 sm:px-6 sm:py-14">
        <div className="mx-auto max-w-5xl">
          <h2 className="font-display text-xl font-bold text-slate-900 sm:text-2xl">
            Tentang Cluster Nahara
          </h2>
          <div className="mt-4 max-w-3xl space-y-3 text-sm leading-relaxed text-slate-600">
            <p>
              <strong className="font-semibold text-slate-800">Cluster Nahara</strong>{" "}
              adalah komunitas warga di kawasan{" "}
              <strong className="font-semibold text-slate-800">
                Cimanggis Golf Estate (CGE)
              </strong>
              , Cimanggis, Depok. Situs{" "}
              <strong className="font-semibold text-slate-800">nahara.id</strong>{" "}
              adalah kanal resmi Paguyuban Warga Cluster Nahara untuk pengumuman,
              kegiatan warga, dan layanan pengaduan lingkungan.
            </p>
            <p>
              Pencarian seperti{" "}
              <em>cluster nahara</em>, <em>cimanggis golf estate nahara</em>,{" "}
              <em>nahara cimanggis</em>, atau <em>cluster cimanggis golf estate</em>{" "}
              mengarah ke informasi paguyuban yang sama — dikelola warga, untuk warga.
            </p>
          </div>
        </div>
      </section>

      {/* Galeri ringkas */}
      <section className="bg-slate-950">
        <div className="mx-auto grid max-w-5xl sm:grid-cols-3">
          {AGUSTUSAN_MEDIA.gallery.slice(0, 3).map((item) => (
            <div
              key={item.src}
              className="relative aspect-[16/11] overflow-hidden"
            >
              <Image
                src={item.src}
                alt={item.alt}
                fill
                quality={65}
                className="object-cover opacity-95 transition duration-500 hover:scale-[1.03] hover:opacity-100"
                sizes="(max-width: 640px) 100vw, 33vw"
              />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
