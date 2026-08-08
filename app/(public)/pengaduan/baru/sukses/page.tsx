"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle } from "lucide-react";
import { LoadingSpinner } from "@/components/ui/Loading";

function PengaduanSuksesContent() {
  const searchParams = useSearchParams();
  const kode = searchParams.get("kode");
  const id = searchParams.get("id");

  return (
    <div className="mx-auto max-w-md py-12 text-center">
      <CheckCircle className="mx-auto h-16 w-16 text-gold" />
      <h1 className="mt-4 font-display text-2xl font-bold text-slate-900">
        Pengaduan Terkirim
      </h1>
      {kode && (
        <p className="mt-3 font-mono text-sm font-semibold text-gold-dark">
          {kode}
        </p>
      )}
      <p className="mt-2 text-sm text-slate-500">
        Terima kasih. Pengaduan Anda masuk antrean validasi pengurus dan tetap
        tampil di daftar untuk ditindaklanjuti.
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        {id && (
          <Link href={`/pengaduan/${id}`} className="btn-primary inline-block">
            Lihat thread
          </Link>
        )}
        <Link href="/pengaduan/baru" className="btn-secondary inline-block">
          Kirim Pengaduan Lain
        </Link>
      </div>
    </div>
  );
}

export default function PengaduanSuksesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-12">
          <LoadingSpinner className="h-8 w-8" />
        </div>
      }
    >
      <PengaduanSuksesContent />
    </Suspense>
  );
}
