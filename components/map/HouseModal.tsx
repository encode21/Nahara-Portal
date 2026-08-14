"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Drawer } from "vaul";
import { Home, Phone } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Iuran, WargaWithIuran } from "@/lib/types";
import {
  formatCurrency,
  formatMonthShort,
  getCurrentMonthStart,
  isIuranWaivedMonth,
  normalizeMonthDate,
  toMonthStart,
} from "@/lib/utils";
import { StatusBadge, getHunianVariant, getIuranVariant } from "@/components/ui/StatusBadge";
import { LoadingSpinner } from "@/components/ui/Loading";
import { useAuth } from "@/lib/hooks/useAuth";

type HouseModalProps = {
  warga?: WargaWithIuran;
  blok: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onIuranUpdated?: () => void;
};

type HistoryRow = {
  bulan: string;
  nominal: number;
  status: boolean;
  id?: string;
};

/** Last N calendar months ending at focusMonth (YYYY-MM-01), newest first. */
function trailingMonths(focusMonth: string, count: number): string[] {
  const [y0, m0] = normalizeMonthDate(focusMonth).slice(0, 7).split("-").map(Number);
  const out: string[] = [];
  let y = y0;
  let m = m0 - 1; // 0-based
  for (let i = 0; i < count; i++) {
    out.push(toMonthStart(y, m));
    m -= 1;
    if (m < 0) {
      m = 11;
      y -= 1;
    }
  }
  return out;
}

export function HouseModal({ warga, blok, open, onOpenChange, onIuranUpdated }: HouseModalProps) {
  const { isAdmin } = useAuth();
  const supabase = createClient();
  const [iuranByMonth, setIuranByMonth] = useState<Map<string, Iuran>>(new Map());
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);

  const bulanIni = getCurrentMonthStart();
  const months = useMemo(() => trailingMonths(bulanIni, 6), [bulanIni]);
  const oldest = months[months.length - 1];

  const fetchHistory = useCallback(async () => {
    if (!warga?.id) {
      setIuranByMonth(new Map());
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from("iuran")
      .select("*")
      .eq("warga_id", warga.id)
      .gte("bulan", oldest)
      .lte("bulan", bulanIni)
      .order("bulan", { ascending: false });

    const map = new Map<string, Iuran>();
    for (const row of (data ?? []) as Iuran[]) {
      map.set(normalizeMonthDate(row.bulan), row);
    }
    setIuranByMonth(map);
    setLoading(false);
  }, [supabase, warga?.id, oldest, bulanIni]);

  useEffect(() => {
    if (open) fetchHistory();
  }, [open, fetchHistory]);

  const historyRows: HistoryRow[] = months.map((bulan) => {
    const row = iuranByMonth.get(bulan);
    return {
      bulan,
      nominal: row?.nominal ?? 50000,
      status: row?.status ?? false,
      id: row?.id,
    };
  });

  const currentIuran = iuranByMonth.get(bulanIni);
  const currentLunas = currentIuran?.status ?? false;

  async function handleTandaiLunas() {
    if (!warga?.id || !isAdmin) return;
    setUpdating(true);

    if (currentIuran) {
      await supabase
        .from("iuran")
        .update({ status: true, paid_at: new Date().toISOString() })
        .eq("id", currentIuran.id);
    } else {
      await supabase.from("iuran").insert({
        warga_id: warga.id,
        bulan: bulanIni,
        nominal: 50000,
        status: true,
        paid_at: new Date().toISOString(),
      });
    }

    await fetchHistory();
    onIuranUpdated?.();
    setUpdating(false);
  }

  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" />
        <Drawer.Content className="fixed inset-x-0 bottom-0 z-50 mt-24 flex max-h-[90vh] flex-col rounded-t-2xl border border-slate-200 bg-white outline-none sm:mx-auto sm:max-w-md">
          <div className="mx-auto mt-3 h-1 w-12 shrink-0 rounded-full bg-slate-200" />
          <div className="overflow-y-auto p-6">
            <Drawer.Title className="font-display text-xl font-bold text-slate-900">{blok}</Drawer.Title>
            <Drawer.Description className="text-sm text-slate-400">Detail Kavling</Drawer.Description>

            {warga ? (
              <div className="mt-4 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gold/20">
                    <Home className="h-6 w-6 text-gold-dark" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{warga.nama}</p>
                    <StatusBadge
                      status={warga.status_hunian}
                      variant={getHunianVariant(warga.status_hunian)}
                    />
                  </div>
                </div>

                {warga.telepon && (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Phone className="h-4 w-4 text-slate-500" />
                    {warga.telepon}
                  </div>
                )}

                <div>
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">
                    Riwayat Iuran (6 bulan terakhir)
                  </p>
                  {loading ? (
                    <div className="flex justify-center py-6">
                      <LoadingSpinner className="h-6 w-6" />
                    </div>
                  ) : (
                    <div className="overflow-hidden rounded-lg border border-slate-200">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs text-slate-400">
                            <th className="px-3 py-2">Bulan</th>
                            <th className="px-3 py-2">Nominal</th>
                            <th className="px-3 py-2">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {historyRows.map((row) => {
                            const waived = !row.status && isIuranWaivedMonth(row.bulan);
                            return (
                              <tr key={row.bulan} className="border-b border-slate-100">
                                <td className="px-3 py-2 text-slate-600">
                                  {formatMonthShort(row.bulan)}
                                </td>
                                <td className="px-3 py-2 text-slate-400">
                                  {waived ? "—" : formatCurrency(row.nominal)}
                                </td>
                                <td className="px-3 py-2">
                                  <StatusBadge
                                    status={
                                      row.status
                                        ? "Lunas"
                                        : waived
                                          ? "Diputihkan"
                                          : "Belum Bayar"
                                    }
                                    variant={
                                      row.status
                                        ? "success"
                                        : waived
                                          ? "neutral"
                                          : getIuranVariant(false)
                                    }
                                  />
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {isAdmin && warga.status_hunian !== "Kosong" && !currentLunas && (
                  <button
                    type="button"
                    onClick={handleTandaiLunas}
                    disabled={updating}
                    className="btn-primary w-full disabled:opacity-50"
                  >
                    {updating ? "Menyimpan..." : "Tandai Lunas"}
                  </button>
                )}
              </div>
            ) : (
              <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-6 text-center">
                <Home className="mx-auto h-8 w-8 text-slate-600" />
                <p className="mt-2 text-slate-400">Kavling kosong</p>
              </div>
            )}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
