"use client";

import { useCallback, useEffect, useState } from "react";
import { Drawer } from "vaul";
import { Home, Phone } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Iuran, WargaWithIuran } from "@/lib/types";
import { formatCurrency, getCurrentMonthStart } from "@/lib/utils";
import { StatusBadge, getHunianVariant, getIuranVariant } from "@/components/ui/StatusBadge";
import { LoadingSpinner } from "@/components/ui/Loading";

type HouseModalProps = {
  warga?: WargaWithIuran;
  blok: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onIuranUpdated?: () => void;
};

function formatBulanLabel(bulan: string): string {
  const date = new Date(bulan);
  return new Intl.DateTimeFormat("id-ID", { month: "short", year: "numeric" }).format(date);
}

export function HouseModal({ warga, blok, open, onOpenChange, onIuranUpdated }: HouseModalProps) {
  const supabase = createClient();
  const [iuranHistory, setIuranHistory] = useState<Iuran[]>([]);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);

  const fetchHistory = useCallback(async () => {
    if (!warga?.id) {
      setIuranHistory([]);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from("iuran")
      .select("*")
      .eq("warga_id", warga.id)
      .order("bulan", { ascending: false })
      .limit(6);
    setIuranHistory((data ?? []) as Iuran[]);
    setLoading(false);
  }, [supabase, warga?.id]);

  useEffect(() => {
    if (open) fetchHistory();
  }, [open, fetchHistory]);

  const bulanIni = getCurrentMonthStart();
  const currentIuran = iuranHistory.find((i) => i.bulan === bulanIni);

  async function handleTandaiLunas() {
    if (!warga?.id) return;
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
                  ) : iuranHistory.length === 0 ? (
                    <p className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-center text-sm text-slate-500">
                      Belum ada riwayat iuran.
                    </p>
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
                          {iuranHistory.map((row) => (
                            <tr key={row.id} className="border-b border-slate-100">
                              <td className="px-3 py-2 text-slate-600">{formatBulanLabel(row.bulan)}</td>
                              <td className="px-3 py-2 text-slate-400">{formatCurrency(row.nominal)}</td>
                              <td className="px-3 py-2">
                                <StatusBadge
                                  status={row.status ? "Lunas" : "Belum Bayar"}
                                  variant={getIuranVariant(row.status)}
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {warga.status_hunian !== "Kosong" && !currentIuran?.status && (
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
