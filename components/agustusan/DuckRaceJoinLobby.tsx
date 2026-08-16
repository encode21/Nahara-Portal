"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { X } from "lucide-react";
import {
  DUCK_RACE_KAHOOT_JOIN_HOST,
  formatKahootPin,
  kahootJoinUrl,
  normalizeKahootPin,
} from "@/lib/agustusan/duck-race";

type Props = {
  pin: string;
  onPinChange?: (digits: string) => void;
  onClose?: () => void;
  onStart?: () => void;
  showStart?: boolean;
};

export function DuckRaceJoinLobby({
  pin,
  onPinChange,
  onClose,
  onStart,
  showStart,
}: Props) {
  const [qr, setQr] = useState<string | null>(null);
  const digits = normalizeKahootPin(pin);
  const joinUrl = kahootJoinUrl(digits);
  const pinLabel = digits ? formatKahootPin(digits) : "— — —";

  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(joinUrl, {
      width: 720,
      margin: 1,
      color: { dark: "#111111", light: "#ffffff" },
    }).then((url) => {
      if (!cancelled) setQr(url);
    });
    return () => {
      cancelled = true;
    };
  }, [joinUrl]);

  return (
    <div className="absolute inset-0 z-40 flex flex-col overflow-hidden bg-[#0e4d5c] text-white">
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        aria-hidden
        style={{
          backgroundImage:
            "radial-gradient(circle at 12% 80%, #e11d48 0 18%, transparent 19%), radial-gradient(circle at 88% 75%, #f59e0b 0 16%, transparent 17%), radial-gradient(circle at 50% 0%, #22c55e 0 8%, transparent 9%)",
        }}
      />
      <div className="relative z-10 flex items-center justify-between gap-3 bg-white px-4 py-3 text-[#111] sm:px-8">
        <p className="text-sm sm:text-lg">
          Join at <strong>{DUCK_RACE_KAHOOT_JOIN_HOST}</strong>
        </p>
        <p className="text-right">
          <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Game PIN
          </span>
          <span className="ml-3 font-display text-2xl font-bold tabular-nums sm:text-4xl">
            {pinLabel}
          </span>
        </p>
      </div>

      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-20 z-20 rounded-full bg-black/40 p-2 text-white hover:bg-black/60"
          aria-label="Tutup QR"
        >
          <X className="h-5 w-5" />
        </button>
      )}

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center gap-6 px-4 pb-10">
        <p className="text-center text-sm tracking-[0.2em] text-[#f0d78c] uppercase">
          Hadiah utama · Duck Race
        </p>
        <div className="rounded-2xl bg-white p-4 shadow-2xl sm:p-6">
          {qr ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={qr}
              alt={`QR join Kahoot PIN ${pinLabel}`}
              className="h-56 w-56 sm:h-80 sm:w-80 lg:h-96 lg:w-96"
            />
          ) : (
            <div className="h-56 w-56 animate-pulse bg-slate-100 sm:h-80 sm:w-80 lg:h-96 lg:w-96" />
          )}
        </div>
        <p className="max-w-md text-center text-sm text-white/80">
          Scan QR atau buka {DUCK_RACE_KAHOOT_JOIN_HOST} lalu masukkan PIN.
        </p>
        {onPinChange && (
          <label className="flex flex-col items-center gap-1 text-xs text-white/70">
            Game PIN Kahoot
            <input
              inputMode="numeric"
              autoComplete="off"
              placeholder="contoh 955754"
              value={digits}
              onChange={(e) => onPinChange(e.target.value)}
              className="w-48 rounded-lg bg-white px-3 py-2 text-center text-lg font-bold tabular-nums text-slate-900"
            />
          </label>
        )}
        {showStart && onStart && (
          <button
            type="button"
            onClick={onStart}
            className="rounded-xl bg-[#c9a84c] px-10 py-3 text-sm font-semibold text-[#1a0508] shadow-lg hover:bg-[#f0d78c]"
          >
            Start
          </button>
        )}
      </div>
    </div>
  );
}
