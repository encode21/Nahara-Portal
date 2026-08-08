"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle, Share2, Check } from "lucide-react";
import { LoadingSpinner } from "@/components/ui/Loading";
import { sharePengaduan } from "@/lib/pengaduan/share";
import type { Pengaduan } from "@/lib/types";

function PengaduanSuksesContent() {
  const searchParams = useSearchParams();
  const kode = searchParams.get("kode");
  const id = searchParams.get("id");
  const kategori = (searchParams.get("kategori") || "Lainnya") as Pengaduan["kategori"];
  const [shareLabel, setShareLabel] = useState("Bagikan ke warga");
  const [sharing, setSharing] = useState(false);

  async function handleShare() {
    if (!id || sharing) return;
    setSharing(true);
    const result = await sharePengaduan({
      id,
      kode,
      kategori,
      deskripsi: "Ada pengaduan baru di Cluster Nahara. Buka untuk lihat & balas.",
    });
    setSharing(false);
    if (result === "cancelled") return;
    setShareLabel(result === "copied" ? "Tautan disalin" : "Siap dibagikan");
    window.setTimeout(() => setShareLabel("Bagikan ke warga"), 2200);
  }

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
      <div className="mt-6 flex flex-col items-stretch gap-3 sm:items-center">
        {id && (
          <button
            type="button"
            onClick={handleShare}
            disabled={sharing}
            className="btn-primary inline-flex items-center justify-center gap-2"
          >
            {shareLabel.includes("disalin") || shareLabel.includes("Siap") ? (
              <Check className="h-4 w-4" />
            ) : (
              <Share2 className="h-4 w-4" />
            )}
            {sharing ? "Membuka..." : shareLabel}
          </button>
        )}
        <div className="flex flex-wrap items-center justify-center gap-3">
          {id && (
            <Link href={`/pengaduan/${id}`} className="btn-secondary inline-block">
              Lihat thread
            </Link>
          )}
          <Link href="/pengaduan/baru" className="btn-secondary inline-block">
            Kirim Pengaduan Lain
          </Link>
        </div>
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
