"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import QRCode from "qrcode";
import { getPortalOrigin } from "@/lib/host";
import { isPeakRegistrationOpen } from "@/lib/constants/agustusan";
import { LoadingSpinner } from "@/components/ui/Loading";

export default function AdminPeakQrPage() {
  const params = useParams();
  const year = Number(params.year);
  const regOpen = isPeakRegistrationOpen();
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const targetUrl = useMemo(() => {
    const path = `/kegiatan/agustusan/${year}/daftar`;
    try {
      return `${getPortalOrigin()}${path}`;
    } catch {
      return path;
    }
  }, [year]);

  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(targetUrl, {
      width: 512,
      margin: 2,
      color: { dark: "#7a1218", light: "#ffffff" },
    }).then((url) => {
      if (!cancelled) setDataUrl(url);
    });
    return () => {
      cancelled = true;
    };
  }, [targetUrl]);

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <Link
          href={`/activities/agustusan/${year}/doorprize`}
          className="text-sm text-slate-500 hover:underline"
        >
          ← Door Prize
        </Link>
        <h1 className="mt-1 font-display text-2xl font-bold text-slate-900">
          QR Pendaftaran Acara Puncak
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Scan untuk mendaftar Acara Puncak & Door Prize
        </p>
      </div>

      <div
        className={`rounded-xl px-4 py-3 text-sm ${
          regOpen
            ? "bg-emerald-50 text-emerald-800"
            : "bg-amber-50 text-amber-900"
        }`}
      >
        Status:{" "}
        <strong>{regOpen ? "Pendaftaran DIBUKA" : "Pendaftaran DITUTUP"}</strong>
        {!regOpen && (
          <span className="mt-1 block text-xs">
            Set{" "}
            <code className="rounded bg-white/70 px-1">
              NEXT_PUBLIC_PEAK_REGISTRATION_OPEN=true
            </code>{" "}
            lalu restart/redeploy sebelum acara.
          </span>
        )}
      </div>

      <div className="card flex flex-col items-center gap-4 text-center">
        {dataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={dataUrl} alt="QR pendaftaran" className="h-64 w-64" />
        ) : (
          <LoadingSpinner className="h-8 w-8" />
        )}
        <p className="break-all text-xs text-slate-500">{targetUrl}</p>
        {dataUrl && (
          <a href={dataUrl} download={`qr-daftar-agustusan-${year}.png`} className="btn-secondary">
            Unduh QR
          </a>
        )}
      </div>
    </div>
  );
}
