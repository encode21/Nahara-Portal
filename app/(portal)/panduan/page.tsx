import Link from "next/link";
import { Shield, Users } from "lucide-react";

export const metadata = {
  title: "Panduan Penggunaan",
  description:
    "Panduan memakai Nahara Portal — pilih Panduan Warga (tanpa login) atau Panduan Pengurus (kelola data setelah login).",
};

export default function PanduanHubPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-900 sm:text-3xl">Panduan Penggunaan</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-500">
          Pilih panduan sesuai peran Anda. Warga tidak perlu login; pengurus mengelola data setelah masuk akun.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link href="/panduan/warga" className="glass-card-hover group block">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold/10 text-gold-dark">
            <Users className="h-5 w-5" />
          </div>
          <h2 className="mt-4 font-display text-lg font-semibold text-slate-900 group-hover:text-gold-dark">
            Panduan Warga
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-500">
            Cara melihat informasi lingkungan, membuat pengaduan, daftar kegiatan, dan memakai fitur Agustusan — tanpa akun.
          </p>
          <span className="mt-4 inline-block text-sm font-medium text-gold-dark">Buka panduan →</span>
        </Link>

        <Link href="/panduan/pengurus" className="glass-card-hover group block">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold/10 text-gold-dark">
            <Shield className="h-5 w-5" />
          </div>
          <h2 className="mt-4 font-display text-lg font-semibold text-slate-900 group-hover:text-gold-dark">
            Panduan Pengurus
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-500">
            Login, kelola pengaduan, pengumuman, iuran, kas, warga, CCTV, kegiatan, dan Agustusan.
          </p>
          <span className="mt-4 inline-block text-sm font-medium text-gold-dark">Buka panduan →</span>
        </Link>
      </div>
    </div>
  );
}
