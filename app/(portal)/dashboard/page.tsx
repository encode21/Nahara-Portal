import { createClient } from "@/lib/supabase/server";
import { KasEntry, Pengaduan, Pengumuman, Warga, Iuran, WargaWithIuran, EventEdition } from "@/lib/types";
import { getCurrentMonthStart, normalizeMonthDate } from "@/lib/utils";
import { SaldoCard } from "@/components/dashboard/SaldoCard";
import { PengaduanTerkini } from "@/components/dashboard/PengaduanTerkini";
import { PengumumanCard } from "@/components/dashboard/PengumumanCard";
import { PetaLingkunganCard } from "@/components/map/PetaLingkunganCard";
import { AgustusanDashboardCard } from "@/components/dashboard/AgustusanDashboardCard";
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

  const [kasRes, wargaRes, pengaduanRes, pengaduanBaruRes, pengumumanRes, editionRes] =
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
      supabase
        .from("event_editions")
        .select("id, year, title, status, starts_on, ends_on")
        .eq("status", "active")
        .order("year", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

  const kasEntries = (kasRes.data ?? []) as KasEntry[];
  const wargaList = (wargaRes.data ?? []) as WargaWithIuranRows[];
  const pengaduanList = (pengaduanRes.data ?? []) as Pengaduan[];
  const pengumumanList = (pengumumanRes.data ?? []) as Pengumuman[];
  const activeEdition = (editionRes.data ?? null) as Pick<
    EventEdition,
    "id" | "year" | "title" | "status" | "starts_on" | "ends_on"
  > | null;

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
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-400">Ringkasan paguyuban Cluster Nahara</p>
      </div>

      {activeEdition && <AgustusanDashboardCard edition={activeEdition} />}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <SaldoCard saldo={saldo} pemasukanBulan={pemasukanBulan} pengeluaranBulan={pengeluaranBulan} />
        <div className="glass-card">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold/15">
              <Users className="h-5 w-5 text-gold-dark" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Total Warga Terdaftar</p>
              <p className="font-display text-2xl font-bold text-slate-900">{wargaList.length}</p>
            </div>
          </div>
        </div>
        <div className="glass-card">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold/15">
              <Megaphone className="h-5 w-5 text-gold-dark" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Menunggu Validasi</p>
              <p className="font-display text-2xl font-bold text-slate-900">
                {pengaduanBaru}
                <span className="ml-2 text-sm font-normal text-slate-500">baru</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <PengaduanTerkini pengaduan={pengaduanList} />
        <PengumumanCard pengumuman={pengumumanList} />
      </div>

      <div className="glass-card">
        <h3 className="mb-4 font-display text-lg font-semibold text-slate-900">Peta Lingkungan</h3>
        <PetaLingkunganCard wargaData={wargaData} />
      </div>
    </div>
  );
}
