"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Check,
  ChevronDown,
  FileText,
  Search,
  Share2,
} from "lucide-react";
import { getLpjByYear } from "@/lib/agustusan/lpj-2026";
import { shareAgustusanLpj } from "@/lib/agustusan/lpj-share";
import { formatCurrency } from "@/lib/utils";

type Props = {
  year: number;
  backHref: string;
  backLabel?: string;
  overlayHeader?: boolean;
};

const JUMP_LINKS = [
  { id: "ringkasan", label: "Ringkasan" },
  { id: "donatur", label: "Donatur" },
  { id: "barang", label: "Barang" },
  { id: "belanja", label: "Belanja" },
] as const;

function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function AgustusanLpjPage({
  year,
  backHref,
  backLabel = "Kembali",
  overlayHeader = false,
}: Props) {
  const lpj = getLpjByYear(year);
  const [query, setQuery] = useState("");
  const [shareStatus, setShareStatus] = useState<"idle" | "copied" | "shared">("idle");

  const donorsSorted = useMemo(() => {
    if (!lpj) return [];
    return [...lpj.donors].sort((a, b) => {
      if (b.amount !== a.amount) return b.amount - a.amount;
      return a.name.localeCompare(b.name, "id");
    });
  }, [lpj]);

  const donorsFiltered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return donorsSorted;
    return donorsSorted.filter((d) => d.name.toLowerCase().includes(q));
  }, [donorsSorted, query]);

  async function handleShare() {
    const result = await shareAgustusanLpj(year);
    if (result === "cancelled") return;
    if (result === "copied") {
      setShareStatus("copied");
      window.setTimeout(() => setShareStatus("idle"), 2000);
      return;
    }
    if (result === "shared" || result === "whatsapp") {
      setShareStatus("shared");
      window.setTimeout(() => setShareStatus("idle"), 2000);
    }
  }

  if (!lpj) {
    return (
      <div className="mx-auto max-w-lg px-4 py-12 text-center">
        <p className="text-slate-600">
          LPJ edisi {year} belum tersedia.
        </p>
        <Link href={backHref} className="mt-4 inline-block text-[#7a1218] hover:underline">
          {backLabel}
        </Link>
      </div>
    );
  }

  const shareDone = shareStatus === "copied" || shareStatus === "shared";

  return (
    <div className="pb-20">
      <section
        className={`bg-[#7a1218] text-white ${overlayHeader ? "pt-16 sm:pt-20" : "pt-5"}`}
      >
        <div className="mx-auto max-w-xl px-4 pb-8">
          <Link
            href={backHref}
            className="inline-block text-sm font-medium text-white/80 hover:text-white hover:underline"
          >
            ← {backLabel}
          </Link>
          <p className="mt-4 flex items-center gap-1.5 text-xs font-medium tracking-[0.18em] text-[#f0d78c] uppercase">
            <FileText className="h-3.5 w-3.5 shrink-0" />
            LPJ · Edisi {lpj.year}
          </p>
          <h1 className="mt-1.5 font-display text-2xl font-bold leading-tight sm:text-3xl">
            {lpj.title}
          </h1>
          <p className="mt-1.5 text-sm text-white/85">
            {lpj.event}
            <span className="text-white/60"> · </span>
            {lpj.location}
          </p>
          <button
            type="button"
            onClick={handleShare}
            className="mt-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-[#7a1218] hover:bg-[#faf7f0]"
          >
            {shareDone ? (
              <>
                <Check className="h-4 w-4 text-emerald-600" />
                {shareStatus === "copied" ? "Tautan disalin" : "Siap dibagikan"}
              </>
            ) : (
              <>
                <Share2 className="h-4 w-4" />
                Bagikan LPJ
              </>
            )}
          </button>
        </div>
      </section>

      <div
        className={`sticky z-30 border-b border-[#c9a84c]/25 bg-[#f4f1ec]/95 py-2 backdrop-blur-md ${
          overlayHeader ? "top-0" : "top-14"
        }`}
      >
        <nav
          className="mx-auto flex max-w-xl gap-1.5 overflow-x-auto px-4 pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          aria-label="Bagian LPJ"
        >
          {JUMP_LINKS.map((link) => (
            <a
              key={link.id}
              href={`#${link.id}`}
              onClick={(e) => {
                e.preventDefault();
                scrollToId(link.id);
              }}
              className="shrink-0 rounded-full border border-[#7a1218]/15 bg-white px-3 py-1.5 text-xs font-medium text-[#7a1218] hover:bg-[#7a1218] hover:text-white"
            >
              {link.label}
            </a>
          ))}
        </nav>
      </div>

      <div className="mx-auto max-w-xl space-y-8 px-4 pt-5">
        <section id="ringkasan" className="scroll-mt-28 space-y-4">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <SummaryCard label="Pemasukan" amount={lpj.incomeTotal} tone="neutral" />
            <SummaryCard label="Pengeluaran" amount={lpj.expenseTotal} tone="neutral" />
            <SummaryCard label="Sisa dana" amount={lpj.surplus} tone="surplus" />
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <h2 className="font-display text-lg font-bold text-slate-900">Pemasukan</h2>
            <ul className="mt-3 divide-y divide-slate-100">
              {lpj.income.map((line) => (
                <li key={line.id} className="flex items-baseline justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                  <span className="text-sm text-slate-700">{line.label}</span>
                  <span className="shrink-0 text-sm font-semibold tabular-nums text-slate-900">
                    {formatCurrency(line.amount)}
                  </span>
                </li>
              ))}
              <li className="flex items-baseline justify-between gap-3 border-t border-slate-200 pt-2.5">
                <span className="text-sm font-semibold text-slate-900">Total pemasukan</span>
                <span className="shrink-0 text-sm font-bold tabular-nums text-[#7a1218]">
                  {formatCurrency(lpj.incomeTotal)}
                </span>
              </li>
            </ul>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <h2 className="font-display text-lg font-bold text-slate-900">Pengeluaran per seksi</h2>
            <ul className="mt-4 space-y-4">
              {lpj.sections.map((section) => {
                const total = lpj.sectionTotals[section.id];
                const pct =
                  lpj.expenseTotal > 0
                    ? Math.round((total / lpj.expenseTotal) * 100)
                    : 0;
                return (
                  <li key={section.id}>
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="text-sm text-slate-700">{section.label}</span>
                      <span className="shrink-0 text-sm font-semibold tabular-nums text-slate-900">
                        {formatCurrency(total)}
                      </span>
                    </div>
                    <div className="mt-1.5 flex items-center gap-2">
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[#9b1b23] to-[#c9a84c]"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="w-8 shrink-0 text-right text-xs text-slate-500">
                        {pct}%
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
            <p className="mt-4 flex items-baseline justify-between border-t border-slate-200 pt-3 text-sm font-semibold">
              <span>Total pengeluaran</span>
              <span className="tabular-nums text-[#7a1218]">
                {formatCurrency(lpj.expenseTotal)}
              </span>
            </p>
          </div>
        </section>

        <section id="donatur" className="scroll-mt-28 space-y-3">
          <div>
            <h2 className="font-display text-xl font-bold text-slate-900">Donatur tunai</h2>
            <p className="mt-1 text-sm text-slate-600">
              {lpj.donors.length} warga · {formatCurrency(lpj.donorTotal)}. Diurutkan dari
              nominal terbesar.
            </p>
          </div>

          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari nama donatur"
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none ring-[#7a1218]/20 placeholder:text-slate-400 focus:border-[#7a1218]/40 focus:ring-2"
            />
          </div>

          <div className="rounded-2xl border border-[#c9a84c]/30 bg-[#faf7f0] px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Bukan donasi warga
            </p>
            <div className="mt-1 flex items-baseline justify-between gap-3">
              <span className="text-sm font-medium text-slate-800">Subsidi Kas Nahara</span>
              <span className="shrink-0 text-sm font-bold tabular-nums text-[#7a1218]">
                {formatCurrency(lpj.income.find((l) => l.id === "kas")?.amount ?? 0)}
              </span>
            </div>
          </div>

          <ol className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            {donorsFiltered.length === 0 ? (
              <li className="px-4 py-8 text-center text-sm text-slate-500">
                Nama tidak ditemukan.
              </li>
            ) : (
              donorsFiltered.map((donor, i) => (
                <li
                  key={`${donor.name}-${i}`}
                  className="flex items-baseline justify-between gap-3 border-b border-slate-100 px-4 py-2.5 last:border-b-0"
                >
                  <span className="min-w-0 text-sm text-slate-800">
                    <span className="mr-2 tabular-nums text-slate-400">{i + 1}. </span>
                    {donor.name}
                  </span>
                  <span className="shrink-0 text-sm font-semibold tabular-nums text-slate-900">
                    {formatCurrency(donor.amount)}
                  </span>
                </li>
              ))
            )}
          </ol>
        </section>

        <section id="barang" className="scroll-mt-28 space-y-3">
          <div>
            <h2 className="font-display text-xl font-bold text-slate-900">
              Donasi barang & konsumsi
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Sumbangan non-uang. Tidak dinilai dalam rupiah di laporan ini.
            </p>
          </div>

          {lpj.inKind.map((group) => (
            <div key={group.id} className="rounded-2xl border border-slate-200 bg-white p-4">
              <h3 className="font-display text-base font-bold text-slate-900">
                {group.label}
              </h3>
              <p className="mt-0.5 text-xs text-slate-500">{group.items.length} item</p>
              <ul className="mt-3 divide-y divide-slate-100">
                {group.items.map((row, i) => (
                  <li key={`${group.id}-${i}`} className="py-2.5 first:pt-0 last:pb-0">
                    <p className="text-sm text-slate-800">
                      {row.name}
                      {row.qty != null ? (
                        <span className="ml-1.5 text-xs text-slate-500">×{row.qty}</span>
                      ) : null}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">{row.donor}</p>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>

        <section id="belanja" className="scroll-mt-28 space-y-3">
          <div>
            <h2 className="font-display text-xl font-bold text-slate-900">
              Rincian belanja
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Nilai per item dari laporan panitia. Qty hanya keterangan, bukan harga satuan.
            </p>
          </div>

          <div className="space-y-2">
            {lpj.sections.map((section) => {
              const total = lpj.sectionTotals[section.id];
              return (
                <details
                  key={section.id}
                  className="group overflow-hidden rounded-2xl border border-slate-200 bg-white"
                >
                  <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 [&::-webkit-details-marker]:hidden">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-900">{section.label}</p>
                      <p className="text-xs text-slate-500">
                        {section.items.length} item · {formatCurrency(total)}
                      </p>
                    </div>
                    <ChevronDown className="h-4 w-4 shrink-0 text-slate-400 transition group-open:rotate-180" />
                  </summary>
                  <ul className="border-t border-slate-100 px-4 pb-3">
                    {section.items.map((row, i) => (
                      <li
                        key={`${section.id}-${i}`}
                        className="flex items-start justify-between gap-3 border-b border-slate-50 py-2.5 last:border-b-0"
                      >
                        <div className="min-w-0">
                          <p className="text-sm text-slate-800">{row.name}</p>
                          <p className="mt-0.5 text-xs text-slate-500">
                            {row.pic}
                            {row.qty != null ? ` · ${row.qty} pcs` : ""}
                          </p>
                        </div>
                        <span
                          className={`shrink-0 text-sm font-semibold tabular-nums ${
                            row.amount < 0 ? "text-emerald-700" : "text-slate-900"
                          }`}
                        >
                          {formatCurrency(row.amount)}
                        </span>
                      </li>
                    ))}
                    <li className="flex items-baseline justify-between gap-3 pt-2">
                      <span className="text-sm font-semibold text-slate-900">Total seksi</span>
                      <span className="text-sm font-bold tabular-nums text-[#7a1218]">
                        {formatCurrency(total)}
                      </span>
                    </li>
                  </ul>
                </details>
              );
            })}
          </div>
        </section>

        <p className="text-center text-xs leading-relaxed text-slate-500">
          Disusun dari laporan panitia {lpj.event}, {lpj.location}.
          Sisa dana ditampilkan sesuai saldo akhir laporan, tanpa alokasi lanjutan.
        </p>
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  amount,
  tone,
}: {
  label: string;
  amount: number;
  tone: "neutral" | "surplus";
}) {
  return (
    <div
      className={`flex min-w-0 items-baseline justify-between gap-3 rounded-xl border px-3 py-2.5 sm:flex-col sm:items-start sm:p-3 ${
        tone === "surplus"
          ? "border-emerald-200 bg-emerald-50"
          : "border-slate-200 bg-white"
      }`}
    >
      <p className="shrink-0 text-[10px] font-medium uppercase tracking-wide text-slate-500 sm:text-xs">
        {label}
      </p>
      <p
        className={`min-w-0 text-right font-display text-base font-bold leading-tight tabular-nums sm:mt-1 sm:text-left ${
          tone === "surplus" ? "text-emerald-800" : "text-slate-900"
        }`}
      >
        {formatCurrency(amount)}
      </p>
    </div>
  );
}
