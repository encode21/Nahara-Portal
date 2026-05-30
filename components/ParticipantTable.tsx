"use client";

import { Participant } from "@/lib/types";
import { formatDateTime } from "@/lib/utils";

type Props = {
  participants: Participant[];
  onTogglePayment: (id: string, value: boolean) => void;
  onToggleAttendance: (id: string, value: boolean) => void;
  onDelete?: (id: string) => void;
  updating?: string | null;
};

export function ParticipantTable({
  participants,
  onTogglePayment,
  onToggleAttendance,
  onDelete,
  updating,
}: Props) {
  if (participants.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-white px-6 py-12 text-center text-sm text-slate-500">
        Belum ada peserta terdaftar.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="px-4 py-3 font-medium text-slate-600">Nama</th>
              <th className="px-4 py-3 font-medium text-slate-600">Telepon</th>
              <th className="px-4 py-3 font-medium text-slate-600">Blok</th>
              <th className="px-4 py-3 font-medium text-slate-600">Daftar</th>
              <th className="px-4 py-3 font-medium text-slate-600">Pembayaran</th>
              <th className="px-4 py-3 font-medium text-slate-600">Kehadiran</th>
              {onDelete && <th className="px-4 py-3 font-medium text-slate-600" />}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {participants.map((p) => (
              <tr key={p.id} className="hover:bg-slate-50/50">
                <td className="px-4 py-3 font-medium text-slate-900">{p.name}</td>
                <td className="px-4 py-3 text-slate-600">{p.phone ?? "—"}</td>
                <td className="px-4 py-3 text-slate-600">{p.block_number ?? "—"}</td>
                <td className="px-4 py-3 text-slate-600">
                  {formatDateTime(p.registered_at)}
                </td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    disabled={updating === p.id}
                    onClick={() => onTogglePayment(p.id, !p.payment_status)}
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors ${
                      p.payment_status
                        ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                        : "bg-amber-50 text-amber-700 hover:bg-amber-100"
                    }`}
                  >
                    {p.payment_status ? "Sudah Bayar" : "Belum Bayar"}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    disabled={updating === p.id}
                    onClick={() => onToggleAttendance(p.id, !p.attendance_status)}
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors ${
                      p.attendance_status
                        ? "bg-blue-50 text-blue-700 hover:bg-blue-100"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {p.attendance_status ? "Ikut" : "Tidak Ikut"}
                  </button>
                </td>
                {onDelete && (
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => onDelete(p.id)}
                      className="text-xs text-red-500 hover:text-red-700"
                    >
                      Hapus
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function ParticipantSummary({
  total,
  paid,
  attending,
}: {
  total: number;
  paid: number;
  attending: number;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
        <p className="text-xs font-medium text-slate-500">Total Terdaftar</p>
        <p className="text-xl font-bold text-slate-900">{total}</p>
      </div>
      <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
        <p className="text-xs font-medium text-slate-500">Sudah Bayar</p>
        <p className="text-xl font-bold text-emerald-600">{paid}</p>
      </div>
      <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
        <p className="text-xs font-medium text-slate-500">Hadir</p>
        <p className="text-xl font-bold text-blue-600">{attending}</p>
      </div>
    </div>
  );
}
