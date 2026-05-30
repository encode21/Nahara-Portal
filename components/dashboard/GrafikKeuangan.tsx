"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

type GrafikKeuanganProps = {
  pemasukan: number;
  pengeluaran: number;
};

export function GrafikKeuangan({ pemasukan, pengeluaran }: GrafikKeuanganProps) {
  const data = [
    { name: "Masuk", value: pemasukan || 1, color: "#c9a84c" },
    { name: "Keluar", value: pengeluaran || 0, color: "#ef4444" },
  ];

  const hasData = pemasukan > 0 || pengeluaran > 0;

  return (
    <div className="glass-card">
      <h3 className="font-display text-lg font-semibold text-slate-900">Grafik Keuangan</h3>
      <div className="mt-4 h-48">
        {hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={70}
                paddingAngle={3}
                dataKey="value"
              >
                {data.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                  color: "#334155",
                }}
                formatter={(value) =>
                  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(Number(value ?? 0))
                }
              />
              <Legend
                formatter={(value) => <span className="text-sm text-slate-600">{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-slate-500">
            Belum ada data keuangan
          </div>
        )}
      </div>
    </div>
  );
}
