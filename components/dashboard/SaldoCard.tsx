"use client";

import Link from "next/link";
import { Wallet } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

type SaldoCardProps = {
  saldo: number;
  pemasukanBulan: number;
  pengeluaranBulan: number;
};

export function SaldoCard({ saldo, pemasukanBulan, pengeluaranBulan }: SaldoCardProps) {
  return (
    <div className="glass-card relative overflow-hidden">
      <div className="absolute right-4 top-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold/20 text-xs font-bold text-gold-dark">
          Rp
        </div>
      </div>
      <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Saldo Kas</p>
      <p className="mt-2 font-display text-3xl font-bold text-slate-900">{formatCurrency(saldo)}</p>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
          <p className="text-xs text-slate-500">Pemasukan Bulan Ini</p>
          <p className="mt-1 text-sm font-semibold text-gold-dark">{formatCurrency(pemasukanBulan)}</p>
        </div>
        <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
          <p className="text-xs text-slate-500">Pengeluaran Bulan Ini</p>
          <p className="mt-1 text-sm font-semibold text-red-600">{formatCurrency(pengeluaranBulan)}</p>
        </div>
      </div>
      <Link href="/keuangan" className="btn-secondary mt-4 w-full text-center text-xs">
        <Wallet className="mr-1.5 inline h-3.5 w-3.5" />
        Lihat Detail Keuangan
      </Link>
    </div>
  );
}
