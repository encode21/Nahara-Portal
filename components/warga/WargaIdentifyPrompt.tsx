"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { BLOK_ROWS, SITEPLAN_ROWS, isAllowedLotNumber } from "@/lib/constants/cluster-layout";
import { useWargaIdentity } from "@/lib/hooks/useWargaIdentity";
import { useAppSurface } from "@/lib/hooks/useAppSurface";
import type { Warga } from "@/lib/types";
import { X } from "lucide-react";

function lotNumbersForBlok(blokRow: string): number[] {
  const row = SITEPLAN_ROWS.find((r) => r.id === blokRow);
  const max = row?.maxLotNo ?? 56;
  const out: number[] = [];
  for (let n = 1; n <= max; n++) {
    if (isAllowedLotNumber(n)) out.push(n);
  }
  return out;
}

export function WargaIdentifyPrompt() {
  const surface = useAppSurface();
  const { showPrompt, confirm, dismiss } = useWargaIdentity();
  const supabase = createClient();
  const [blokRow, setBlokRow] = useState("");
  const [nomor, setNomor] = useState("");
  const [match, setMatch] = useState<Pick<
    Warga,
    "id" | "nama" | "blok"
  > | null>(null);
  const [looking, setLooking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);

  const lots = useMemo(
    () => (blokRow ? lotNumbersForBlok(blokRow) : []),
    [blokRow]
  );

  useEffect(() => {
    if (surface !== "portal" || !showPrompt) {
      setVisible(false);
      return;
    }
    const t = window.setTimeout(() => setVisible(true), 600);
    return () => window.clearTimeout(t);
  }, [surface, showPrompt]);

  useEffect(() => {
    if (!blokRow || !nomor) {
      setMatch(null);
      return;
    }
    let cancelled = false;
    setLooking(true);
    setError(null);
    void (async () => {
      const { data } = await supabase
        .from("warga")
        .select("id,nama,blok")
        .eq("blok_row", blokRow)
        .eq("nomor_kavling", parseInt(nomor, 10))
        .limit(1);
      if (cancelled) return;
      const row = (data?.[0] ?? null) as Pick<
        Warga,
        "id" | "nama" | "blok"
      > | null;
      setMatch(row);
      setLooking(false);
      if (!row) {
        setError("Rumah belum terdaftar di direktori warga.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [blokRow, nomor, supabase]);

  if (surface !== "portal" || !visible || !showPrompt) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-end justify-center bg-slate-950/40 p-4 sm:items-center">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="warga-identify-title"
        className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-xl"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2
              id="warga-identify-title"
              className="font-display text-lg font-semibold text-slate-900"
            >
              Siapa Anda di Nahara?
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Pilih rumah sekali saja — kami ingat di perangkat ini.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              dismiss();
              setVisible(false);
            }}
            className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            aria-label="Lewati"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="identify-blok">
              Blok
            </label>
            <select
              id="identify-blok"
              className="input"
              value={blokRow}
              onChange={(e) => {
                setBlokRow(e.target.value);
                setNomor("");
                setError(null);
              }}
            >
              <option value="">Pilih blok</option>
              {BLOK_ROWS.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="identify-nomor">
              Nomor rumah
            </label>
            <select
              id="identify-nomor"
              className="input"
              value={nomor}
              disabled={!blokRow}
              onChange={(e) => {
                setNomor(e.target.value);
                setError(null);
              }}
            >
              <option value="">Pilih nomor</option>
              {lots.map((n) => (
                <option key={n} value={String(n)}>
                  {String(n).padStart(2, "0")}
                </option>
              ))}
            </select>
          </div>
        </div>

        {looking && (
          <p className="mt-3 text-sm text-slate-500">Mencari data rumah…</p>
        )}
        {match && !looking && (
          <p className="mt-3 rounded-lg bg-gold/10 px-3 py-2 text-sm text-slate-800">
            Rumah: <span className="font-semibold">{match.blok}</span>
            {" · "}
            <span className="font-semibold">{match.nama}</span>
          </p>
        )}
        {error && !looking && (
          <p className="mt-3 text-sm text-red-600">{error}</p>
        )}

        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            className="btn-primary"
            disabled={!match}
            onClick={() => {
              if (!match) return;
              confirm({
                wargaId: match.id,
                nama: match.nama,
                blok: match.blok,
                confirmedAt: new Date().toISOString(),
              });
              setVisible(false);
            }}
          >
            Ya, ini saya
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => {
              dismiss();
              setVisible(false);
            }}
          >
            Lewati
          </button>
        </div>
      </div>
    </div>
  );
}
