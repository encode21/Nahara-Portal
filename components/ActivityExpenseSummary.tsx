import { ReceiptText } from "lucide-react";
import type { ActivityExpense } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

export function ActivityExpenseSummary({ expenses }: { expenses: ActivityExpense[] }) {
  if (expenses.length === 0) return null;
  const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);

  return (
    <section className="card space-y-4">
      <div className="flex items-center gap-3">
        <span className="icon-badge"><ReceiptText className="h-5 w-5" /></span>
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Realisasi Pengeluaran</h2>
          <p className="text-sm text-slate-500">Rincian biaya kegiatan dari kas paguyuban</p>
        </div>
      </div>
      <div className="divide-y divide-slate-100">
        {expenses.map((expense, index) => (
          <div key={expense.id} className="flex items-start justify-between gap-4 py-3 first:pt-0">
            <div className="flex min-w-0 gap-3">
              <span className="text-sm text-slate-400">{index + 1}.</span>
              <div>
                <p className="text-sm font-medium text-slate-800">{expense.description}</p>
                {expense.pic && <p className="mt-0.5 text-xs text-slate-500">PIC: {expense.pic}</p>}
              </div>
            </div>
            <p className="shrink-0 text-sm font-semibold text-slate-900">{formatCurrency(expense.amount)}</p>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between border-t border-slate-200 pt-4">
        <p className="font-semibold text-slate-900">Total Pengeluaran</p>
        <p className="text-lg font-bold text-gold-dark">{formatCurrency(total)}</p>
      </div>
    </section>
  );
}
