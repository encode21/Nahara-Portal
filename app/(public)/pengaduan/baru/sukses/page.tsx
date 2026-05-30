import Link from "next/link";
import { CheckCircle } from "lucide-react";

export default function PengaduanSuksesPage() {
  return (
    <div className="mx-auto max-w-md py-12 text-center">
      <CheckCircle className="mx-auto h-16 w-16 text-gold" />
      <h1 className="mt-4 font-display text-2xl font-bold text-slate-900">Pengaduan Terkirim</h1>
      <p className="mt-2 text-sm text-slate-500">
        Terima kasih. Pengaduan Anda telah diterima dan akan segera ditindaklanjuti oleh pengurus.
      </p>
      <Link href="/pengaduan/baru" className="btn-secondary mt-6 inline-block">
        Kirim Pengaduan Lain
      </Link>
    </div>
  );
}
