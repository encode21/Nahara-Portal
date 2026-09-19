"use client";

import { useEffect, useMemo, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getSupabaseErrorMessage } from "@/lib/supabase/errors";
import type { ActivityExpense } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { LoadingSpinner } from "@/components/ui/Loading";

type ExpenseForm = {
  description: string;
  amount: string;
  pic: string;
  expense_date: string;
};

const emptyForm = (): ExpenseForm => ({
  description: "",
  amount: "",
  pic: "",
  expense_date: new Date().toISOString().slice(0, 10),
});

export function ActivityExpenseManager({ activityId }: { activityId: string }) {
  const supabase = useMemo(() => createClient(), []);
  const [expenses, setExpenses] = useState<ActivityExpense[]>([]);
  const [form, setForm] = useState<ExpenseForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadExpenses() {
    const { data, error: loadError } = await supabase
      .from("activity_expenses")
      .select("*")
      .eq("activity_id", activityId)
      .order("expense_date")
      .order("created_at");
    if (loadError) setError("Gagal memuat pengeluaran kegiatan.");
    else setExpenses((data ?? []) as ActivityExpense[]);
    setLoading(false);
  }

  useEffect(() => {
    void loadExpenses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activityId]);

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm());
    setError(null);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const amount = Number.parseInt(form.amount, 10);
    if (!form.description.trim() || !Number.isFinite(amount) || amount <= 0) {
      setError("Isi deskripsi dan jumlah pengeluaran yang valid.");
      return;
    }

    setSaving(true);
    setError(null);
    const payload = {
      activity_id: activityId,
      description: form.description.trim(),
      amount,
      pic: form.pic.trim() || null,
      expense_date: form.expense_date,
    };
    const result = editingId
      ? await supabase.from("activity_expenses").update(payload).eq("id", editingId)
      : await supabase.from("activity_expenses").insert(payload);
    setSaving(false);

    if (result.error) {
      setError(getSupabaseErrorMessage(result.error) ?? "Gagal menyimpan pengeluaran.");
      return;
    }
    resetForm();
    setLoading(true);
    await loadExpenses();
  }

  async function handleDelete(expense: ActivityExpense) {
    if (!confirm(`Hapus pengeluaran “${expense.description}”? Transaksi kas terkait juga akan dihapus.`)) return;
    const { error: deleteError } = await supabase
      .from("activity_expenses")
      .delete()
      .eq("id", expense.id);
    if (deleteError) {
      setError(getSupabaseErrorMessage(deleteError) ?? "Gagal menghapus pengeluaran.");
      return;
    }
    setExpenses((current) => current.filter((item) => item.id !== expense.id));
    if (editingId === expense.id) resetForm();
  }

  const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Pengeluaran Kegiatan</h2>
        <p className="mt-1 text-sm text-slate-500">
          Setiap item otomatis dicatat sebagai pengeluaran di Kas Paguyuban.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="rounded-xl border border-slate-200 bg-white p-4">
        <p className="mb-3 text-sm font-medium text-slate-800">
          {editingId ? "Edit pengeluaran" : "Tambah pengeluaran"}
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <label className="label">Keperluan</label>
            <input
              className="input"
              value={form.description}
              onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
              placeholder="Contoh: Konsumsi warga (jajanan pasar + air mineral)"
              required
            />
          </div>
          <div>
            <label className="label">Jumlah (Rp)</label>
            <input
              className="input"
              type="number"
              min="1"
              value={form.amount}
              onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))}
              required
            />
          </div>
          <div>
            <label className="label">PIC</label>
            <input
              className="input"
              value={form.pic}
              onChange={(event) => setForm((current) => ({ ...current, pic: event.target.value }))}
              placeholder="Opsional"
            />
          </div>
          <div>
            <label className="label">Tanggal</label>
            <input
              className="input"
              type="date"
              value={form.expense_date}
              onChange={(event) => setForm((current) => ({ ...current, expense_date: event.target.value }))}
              required
            />
          </div>
          <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-3">
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? <LoadingSpinner /> : editingId ? "Simpan Perubahan" : <><Plus className="mr-1.5 h-4 w-4" /> Tambah Pengeluaran</>}
            </button>
            {editingId && <button type="button" className="btn-secondary" onClick={resetForm}>Batal</button>}
          </div>
        </div>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      </form>

      {loading ? (
        <div className="flex justify-center py-6"><LoadingSpinner /></div>
      ) : expenses.length > 0 ? (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="divide-y divide-slate-100">
            {expenses.map((expense) => (
              <div key={expense.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-900">{expense.description}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {expense.expense_date}{expense.pic ? ` · PIC ${expense.pic}` : ""} · Terhubung ke kas
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <p className="mr-2 font-semibold text-slate-900">{formatCurrency(expense.amount)}</p>
                  <button
                    type="button"
                    className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:text-gold-dark"
                    onClick={() => {
                      setEditingId(expense.id);
                      setForm({
                        description: expense.description,
                        amount: String(expense.amount),
                        pic: expense.pic ?? "",
                        expense_date: expense.expense_date,
                      });
                    }}
                    aria-label="Edit pengeluaran"
                  ><Pencil className="h-4 w-4" /></button>
                  <button
                    type="button"
                    className="rounded-lg border border-red-200 p-2 text-red-500 hover:bg-red-50"
                    onClick={() => void handleDelete(expense)}
                    aria-label="Hapus pengeluaran"
                  ><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-between border-t border-slate-200 bg-slate-50 px-4 py-3 font-semibold text-slate-900">
            <span>Total</span><span>{formatCurrency(total)}</span>
          </div>
        </div>
      ) : (
        <p className="rounded-xl border border-dashed border-slate-200 p-5 text-center text-sm text-slate-500">
          Belum ada pengeluaran untuk kegiatan ini.
        </p>
      )}
    </section>
  );
}
