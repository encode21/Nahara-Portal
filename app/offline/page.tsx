import Link from "next/link";
import { SITE_TITLE } from "@/lib/constants/brand";

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-6 text-center">
      <h1 className="font-display text-xl font-bold text-slate-900">{SITE_TITLE}</h1>
      <p className="mt-3 max-w-sm text-sm text-slate-600">
        Tidak ada koneksi internet. Periksa jaringan Anda lalu coba lagi.
      </p>
      <Link href="/dashboard" className="btn-primary mt-6">
        Muat ulang
      </Link>
    </div>
  );
}
