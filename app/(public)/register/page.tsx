"use client";

import { useState } from "react";
import Link from "next/link";
import { RegistrationForm } from "@/components/RegistrationForm";
import { formatCurrency, formatDateTime } from "@/lib/utils";

type ConfirmationData = {
  name: string;
  activityTitle: string;
  activityDate: string;
  registrationFee: number;
};

export default function RegisterPage() {
  const [confirmed, setConfirmed] = useState<ConfirmationData | null>(null);

  if (confirmed) {
    return (
      <div className="mx-auto max-w-lg">
        <div className="card text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
            <svg className="h-7 w-7 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-slate-900">
            Pendaftaran Berhasil!
          </h2>
          <p className="mt-2 text-slate-600">
            Terima kasih, <strong>{confirmed.name}</strong>. Pendaftaran Anda
            telah tercatat.
          </p>
          <div className="mt-6 rounded-lg bg-slate-50 p-4 text-left text-sm">
            <p>
              <span className="text-slate-500">Kegiatan:</span>{" "}
              <span className="font-medium text-slate-900">
                {confirmed.activityTitle}
              </span>
            </p>
            <p className="mt-1">
              <span className="text-slate-500">Tanggal:</span>{" "}
              {formatDateTime(confirmed.activityDate)}
            </p>
            {confirmed.registrationFee > 0 && (
              <p className="mt-1">
                <span className="text-slate-500">Iuran:</span>{" "}
                {formatCurrency(confirmed.registrationFee)}
              </p>
            )}
          </div>
          {confirmed.registrationFee > 0 && (
            <p className="mt-4 text-sm text-amber-700">
              Silakan lakukan pembayaran iuran sesuai instruksi dari pengurus
              paguyuban.
            </p>
          )}
          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Link href="/register" className="btn-secondary">
              Daftar Lagi
            </Link>
            <Link href="/" className="btn-primary">
              Kembali ke Beranda
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-slate-900">Daftar Kegiatan</h1>
        <p className="mt-2 text-slate-600">
          Pilih kegiatan dan isi data diri untuk mendaftar.
        </p>
      </div>
      <RegistrationForm onSuccess={setConfirmed} />
    </div>
  );
}
