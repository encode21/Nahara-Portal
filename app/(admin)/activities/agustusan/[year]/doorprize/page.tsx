"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type {
  EventDoorPrizeWinner,
  EventEdition,
  EventPeakRegistration,
  PeakRegistrationStatus,
} from "@/lib/types";
import { PEAK_BLOK_ROWS } from "@/lib/constants/agustusan";
import { getSupabaseErrorMessage } from "@/lib/supabase/errors";
import { sanitizeSearchTerm } from "@/lib/validation/publicForms";
import { StatCard } from "@/components/ui/StatCard";
import { LoadingSpinner } from "@/components/ui/Loading";
import { StoredImage } from "@/components/ui/StoredImage";
import { ImageLightbox } from "@/components/ui/ImageLightbox";

export default function AdminDoorPrizePage() {
  const params = useParams();
  const year = Number(params.year);
  const supabase = useMemo(() => createClient(), []);
  const [edition, setEdition] = useState<EventEdition | null>(null);
  const [rows, setRows] = useState<EventPeakRegistration[]>([]);
  const [winners, setWinners] = useState<EventDoorPrizeWinner[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [blokFilter, setBlokFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | PeakRegistrationStatus>("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data: ed } = await supabase
      .from("event_editions")
      .select("*")
      .eq("year", year)
      .maybeSingle();
    const editionRow = (ed as EventEdition) ?? null;
    setEdition(editionRow);
    if (!editionRow) {
      setLoading(false);
      return;
    }
    const [regsRes, winRes] = await Promise.all([
      supabase
        .from("event_peak_registrations")
        .select("*")
        .eq("edition_id", editionRow.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("event_door_prize_winners")
        .select("*")
        .eq("edition_id", editionRow.id),
    ]);
    setRows((regsRes.data ?? []) as EventPeakRegistration[]);
    setWinners((winRes.data ?? []) as EventDoorPrizeWinner[]);
    setLoading(false);
  }, [supabase, year]);

  useEffect(() => {
    load();
  }, [load]);

  const winnerIds = useMemo(
    () => new Set(winners.map((w) => w.registration_id)),
    [winners]
  );

  const stats = useMemo(() => {
    const active = rows.filter((r) => r.status !== "cancelled");
    const verified = rows.filter((r) => r.status === "verified");
    const pending = rows.filter((r) => r.status === "pending");
    const households = new Set(active.map((r) => r.household_label));
    const byHouse = new Map<string, number>();
    for (const r of active) {
      byHouse.set(r.household_label, (byHouse.get(r.household_label) ?? 0) + 1);
    }
    let fullHouses = 0;
    byHouse.forEach((n) => {
      if (n >= 2) fullHouses += 1;
    });
    const eligible = verified.filter(
      (r) => r.twibbon_url && !winnerIds.has(r.id)
    );
    return {
      rumah: households.size,
      peserta: active.length,
      verified: verified.length,
      pending: pending.length,
      fullHouses,
      eligible: eligible.length,
    };
  }, [rows, winnerIds]);

  const filtered = useMemo(() => {
    const q = sanitizeSearchTerm(search).toLowerCase();
    return rows.filter((r) => {
      if (blokFilter && r.blok_row !== blokFilter) return false;
      if (statusFilter && r.status !== statusFilter) return false;
      if (!q) return true;
      return (
        r.participant_name.toLowerCase().includes(q) ||
        r.household_label.toLowerCase().includes(q) ||
        r.registration_code.toLowerCase().includes(q)
      );
    });
  }, [rows, search, blokFilter, statusFilter]);

  async function setStatus(id: string, status: PeakRegistrationStatus) {
    setError(null);
    setMessage(null);
    const { error: rpcError } = await supabase.rpc("set_peak_registration_status", {
      p_registration_id: id,
      p_status: status,
    });
    if (rpcError) {
      setError(getSupabaseErrorMessage(rpcError) ?? "Gagal mengubah status.");
      return;
    }
    setMessage(status === "cancelled" ? "Pendaftaran dibatalkan." : "Status diperbarui.");
    await load();
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner className="h-8 w-8" />
      </div>
    );
  }

  if (!edition) {
    return <p className="py-12 text-center text-slate-600">Edisi tidak ditemukan.</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link
            href={`/activities/agustusan/${year}`}
            className="text-sm text-slate-500 hover:underline"
          >
            ← Admin Agustusan {year}
          </Link>
          <h1 className="mt-1 font-display text-2xl font-bold text-slate-900">
            Door Prize — Acara Puncak
          </h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/activities/agustusan/${year}/doorprize/spin`}
            className="btn-primary"
          >
            Spin
          </Link>
          <Link
            href={`/activities/agustusan/${year}/doorprize/winners`}
            className="btn-secondary"
          >
            Pemenang
          </Link>
          <Link
            href={`/activities/agustusan/${year}/duck-race`}
            className="btn-secondary"
          >
            Duck Race
          </Link>
          <Link href={`/activities/agustusan/${year}/qr`} className="btn-secondary">
            QR Daftar
          </Link>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Rumah terdaftar" value={stats.rumah} />
        <StatCard label="Total peserta" value={stats.peserta} />
        <StatCard label="Verified" value={stats.verified} variant="success" />
        <StatCard label="Belum verified" value={stats.pending} variant="warning" />
        <StatCard label="Rumah penuh" value={stats.fullHouses} />
        <StatCard label="Eligible undian" value={stats.eligible} variant="success" />
      </div>

      {(message || error) && (
        <p
          className={`rounded-lg px-4 py-3 text-sm ${
            error ? "bg-red-50 text-red-800" : "bg-emerald-50 text-emerald-800"
          }`}
        >
          {error ?? message}
        </p>
      )}

      <div className="card space-y-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <input
            className="input"
            placeholder="Cari nama / rumah / kode"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="input"
            value={blokFilter}
            onChange={(e) => setBlokFilter(e.target.value)}
          >
            <option value="">Semua blok</option>
            {PEAK_BLOK_ROWS.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
          <select
            className="input"
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as "" | PeakRegistrationStatus)
            }
          >
            <option value="">Semua status</option>
            <option value="verified">verified</option>
            <option value="pending">pending</option>
            <option value="cancelled">cancelled</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b text-slate-500">
              <tr>
                <th className="px-2 py-2 font-medium">Nama</th>
                <th className="px-2 py-2 font-medium">Blok</th>
                <th className="px-2 py-2 font-medium">Rumah</th>
                <th className="px-2 py-2 font-medium">Status</th>
                <th className="px-2 py-2 font-medium">Twibbon</th>
                <th className="px-2 py-2 font-medium">Door Prize</th>
                <th className="px-2 py-2 font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className="border-b border-slate-100">
                  <td className="px-2 py-2">
                    <p className="font-medium text-slate-900">{r.participant_name}</p>
                    <p className="text-xs capitalize text-slate-500">{r.participant_role}</p>
                  </td>
                  <td className="px-2 py-2">{r.blok_row}</td>
                  <td className="px-2 py-2 tabular-nums">
                    {String(r.nomor_kavling).padStart(2, "0")}
                  </td>
                  <td className="px-2 py-2 capitalize">{r.status}</td>
                  <td className="px-2 py-2">
                    {r.twibbon_url ? (
                      <button
                        type="button"
                        className="h-12 w-12 overflow-hidden rounded-lg ring-1 ring-slate-200"
                        onClick={() => setLightbox(r.twibbon_url)}
                      >
                        <StoredImage
                          src={r.twibbon_url}
                          alt="Twibbon"
                          className="h-12 w-12 object-cover"
                        />
                      </button>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-2 py-2">
                    {winnerIds.has(r.id) ? (
                      <span className="text-emerald-700">Menang</span>
                    ) : r.status === "verified" ? (
                      <span className="text-slate-600">Eligible</span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-2 py-2">
                    <div className="flex flex-wrap gap-1">
                      {r.status !== "verified" && (
                        <button
                          type="button"
                          className="text-xs font-medium text-emerald-700 hover:underline"
                          onClick={() => setStatus(r.id, "verified")}
                        >
                          Approve
                        </button>
                      )}
                      {r.status !== "cancelled" && (
                        <button
                          type="button"
                          className="text-xs font-medium text-red-700 hover:underline"
                          onClick={() => setStatus(r.id, "cancelled")}
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-2 py-8 text-center text-slate-500">
                    Belum ada data.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ImageLightbox
        src={lightbox ?? ""}
        alt="Twibbon peserta"
        open={Boolean(lightbox)}
        onClose={() => setLightbox(null)}
      />
    </div>
  );
}
