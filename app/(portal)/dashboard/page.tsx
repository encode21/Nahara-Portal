import { createClient } from "@/lib/supabase/server";
import { KasEntry, Pengaduan, Pengumuman, Warga, Iuran, WargaWithIuran } from "@/lib/types";
import { getCurrentMonthStart, normalizeMonthDate } from "@/lib/utils";
import { getLingkunganSnapshot } from "@/lib/lingkungan/fetch";
import { SaldoCard } from "@/components/dashboard/SaldoCard";
import { PengaduanTerkini } from "@/components/dashboard/PengaduanTerkini";
import { PengumumanCard } from "@/components/dashboard/PengumumanCard";
import { LingkunganDashboardCard } from "@/components/dashboard/LingkunganDashboardCard";
import { PetaLingkunganCard } from "@/components/map/PetaLingkunganCard";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { Users, Megaphone } from "lucide-react";

type WargaWithIuranRows = Warga & { iuran: Pick<Iuran, "status" | "bulan">[] };

function mapWargaWithIuran(wargaList: WargaWithIuranRows[], bulanIni: string): WargaWithIuran[] {
  return wargaList.map((w) => ({
    id: w.id,
    nama: w.nama,
    blok: w.blok,
    blok_row: w.blok_row,
    nomor_kavling: w.nomor_kavling ?? 0,
    status_hunian: w.status_hunian,
    telepon: w.telepon ?? undefined,
    iuran_lunas:
      w.iuran?.some(
        (i) => normalizeMonthDate(i.bulan) === bulanIni && i.status,
      ) ?? false,
  }));
}

export default async function DashboardPage() {
  const supabase = createClient();
  const bulanIni = getCurrentMonthStart();

  const [kasRes, wargaRes, pengaduanRes, pengaduanBaruRes, pengumumanRes, lingkungan] =
    await Promise.all([
      supabase.from("kas_entries").select("*"),
      supabase
        .from("warga")
        .select("*, iuran (status, bulan)")
        .order("blok_row"),
      supabase
        .from("pengaduan")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(3),
      supabase
        .from("pengaduan")
        .select("id", { count: "exact", head: true })
        .eq("status", "Baru"),
      supabase.from("pengumuman").select("*").order("created_at", { ascending: false }).limit(5),
      getLingkunganSnapshot(),
    ]);

  const kasEntries = (kasRes.data ?? []) as KasEntry[];
  const wargaList = (wargaRes.data ?? []) as WargaWithIuranRows[];
  const pengaduanList = (pengaduanRes.data ?? []) as Pengaduan[];
  const pengumumanList = (pengumumanRes.data ?? []) as Pengumuman[];

  const wargaData = mapWargaWithIuran(wargaList, bulanIni);

  const totalPemasukan = kasEntries.filter((e) => e.type === "pemasukan").reduce((s, e) => s + e.amount, 0);
  const totalPengeluaran = kasEntries.filter((e) => e.type === "pengeluaran").reduce((s, e) => s + e.amount, 0);
  const saldo = totalPemasukan - totalPengeluaran;

  const monthStart = getCurrentMonthStart();
  const pemasukanBulan = kasEntries
    .filter((e) => e.type === "pemasukan" && e.date >= monthStart)
    .reduce((s, e) => s + e.amount, 0);
  const pengeluaranBulan = kasEntries
    .filter((e) => e.type === "pengeluaran" && e.date >= monthStart)
    .reduce((s, e) => s + e.amount, 0);

  const pengaduanBaru = pengaduanBaruRes.count ?? 0;

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="rounded-2xl border border-sand-200 bg-white p-5 shadow-soft sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold-dark">
          Paguyuban Warga Nahara
        </p>
        <h1 className="mt-1 font-display text-2xl font-bold text-ink sm:text-3xl">Dashboard</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Ringkasan harian Cluster Nahara, Cimanggis Golf Estate.
        </p>
      </div>

      <section>
        <h2 className="section-title">Situasi lingkungan</h2>
        <LingkunganDashboardCard data={lingkungan} />
      </section>

      <QuickActions />

      <section>
        <h2 className="section-title">Ringkasan</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <SaldoCard saldo={saldo} pemasukanBulan={pemasukanBulan} pengeluaranBulan={pengeluaranBulan} />
          <div className="glass-card flex items-start gap-3">
            <span className="icon-badge">
              <Users className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-ink-faint">
                Total Warga Terdaftar
              </p>
              <p className="mt-1 font-display text-2xl font-bold text-ink">{wargaList.length}</p>
            </div>
          </div>
          <div className="glass-card flex items-start gap-3">
            <span className="icon-badge">
              <Megaphone className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-ink-faint">
                Menunggu Validasi
              </p>
              <p className="mt-1 font-display text-2xl font-bold text-ink">
                {pengaduanBaru}
                <span className="ml-2 text-sm font-normal text-ink-soft">baru</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <PengaduanTerkini pengaduan={pengaduanList} />
        <PengumumanCard pengumuman={pengumumanList} />
      </div>

      <div className="glass-card">
        <h3 className="mb-4 font-display text-lg font-semibold text-ink">Peta Lingkungan</h3>
        <PetaLingkunganCard wargaData={wargaData} />
      </div>
    </div>
  );
}
