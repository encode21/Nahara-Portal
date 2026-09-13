"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Plus, Radio } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/hooks/useAuth";
import { useAppSurface, useHasMounted } from "@/lib/hooks/useAppSurface";
import { AdminLoginPrompt } from "@/components/AdminOnly";
import { LoadingSpinner } from "@/components/ui/Loading";
import { getSupabaseErrorMessage } from "@/lib/supabase/errors";
import { formatRelativeId } from "@/lib/situation/format";
import {
  SITUATION_ALERT_SEVERITIES,
  SITUATION_ALERT_TYPES,
  situationAlertSeverityLabel,
  situationAlertTypeLabel,
  type SituationAlertSeverity,
  type SituationAlertType,
} from "@/lib/constants/situation-alerts";
import type { SituationAlertRow } from "@/lib/situation/types";
import { cn } from "@/lib/utils";
import { buildOpsUrl } from "@/lib/host";

type FormState = {
  type: SituationAlertType;
  severity: SituationAlertSeverity;
  title: string;
  description: string;
  affected_area: string;
};

const EMPTY_FORM: FormState = {
  type: "electricity",
  severity: "warning",
  title: "",
  description: "",
  affected_area: "",
};

function severityTone(severity: string): string {
  if (severity === "critical") return "bg-red-50 text-red-700 ring-red-100";
  if (severity === "warning") return "bg-amber-50 text-amber-800 ring-amber-100";
  return "bg-sky-50 text-sky-800 ring-sky-100";
}

export default function SituasiPage() {
  const supabase = createClient();
  const surface = useAppSurface();
  const mounted = useHasMounted();
  const { isAdmin, isStaff, user, loading: authLoading } = useAuth();

  const canManage =
    mounted && surface === "ops" && (isAdmin || isStaff) && !!user;

  const [list, setList] = useState<SituationAlertRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const activeTypes = useMemo(
    () => new Set(list.filter((a) => a.status === "active").map((a) => a.type)),
    [list],
  );

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data, error: fetchError } = await supabase
      .from("situation_alerts")
      .select(
        "id, type, severity, title, description, affected_area, status, started_at, resolved_at, created_by, created_at, updated_at",
      )
      .order("started_at", { ascending: false })
      .limit(40);

    if (fetchError) setError(getSupabaseErrorMessage(fetchError));
    else setError(null);
    setList((data ?? []) as SituationAlertRow[]);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function openCreate() {
    setForm(EMPTY_FORM);
    setError(null);
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canManage) return;
    setSaving(true);
    setError(null);

    const payload = {
      type: form.type,
      severity: form.severity,
      title: form.title.trim(),
      description: form.description.trim(),
      affected_area: form.affected_area.trim() || null,
      status: "active" as const,
      created_by: user?.email ?? null,
      resolved_at: null,
    };

    const result = await supabase.from("situation_alerts").insert(payload);
    const err = getSupabaseErrorMessage(result.error);
    setSaving(false);
    if (err) {
      setError(
        err.includes("idx_situation_alerts_active_type") ||
          err.toLowerCase().includes("duplicate")
          ? "Sudah ada laporan aktif untuk jenis ini. Selesaikan dulu, lalu buat baru."
          : err,
      );
      return;
    }

    setShowForm(false);
    setForm(EMPTY_FORM);
    await fetchData();
  }

  async function resolveAlert(id: string) {
    if (!canManage) return;
    setError(null);
    const result = await supabase
      .from("situation_alerts")
      .update({
        status: "resolved",
        resolved_at: new Date().toISOString(),
      })
      .eq("id", id);

    const err = getSupabaseErrorMessage(result.error);
    if (err) {
      setError(err);
      return;
    }
    await fetchData();
  }

  if (!mounted || authLoading) {
    return (
      <div className="flex justify-center py-16">
        <LoadingSpinner />
      </div>
    );
  }

  if (surface !== "ops") {
    return (
      <div className="space-y-4">
        <header>
          <h1 className="font-display text-2xl font-bold text-ink">Situasi</h1>
          <p className="mt-1 text-sm text-ink-soft">
            Status lingkungan dikelola pengurus di ops. Lihat ringkasan di
            Dashboard.
          </p>
        </header>
        <a
          href={buildOpsUrl("/situasi")}
          className="inline-flex items-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-sm font-medium text-white"
        >
          Buka di Ops
        </a>
      </div>
    );
  }

  const active = list.filter((a) => a.status === "active");
  const resolved = list.filter((a) => a.status === "resolved");

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold-dark">
            Ops
          </p>
          <h1 className="mt-1 font-display text-2xl font-bold text-ink">
            Situasi manual
          </h1>
          <p className="mt-1 max-w-xl text-sm text-ink-soft">
            Laporkan gangguan yang belum punya sensor (listrik, genangan, gate,
            dll). Warga melihatnya di Situation Center dashboard.
          </p>
        </div>
        {canManage ? (
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-1.5 rounded-xl bg-ink px-3.5 py-2.5 text-sm font-medium text-white"
          >
            <Plus className="h-4 w-4" />
            Laporan baru
          </button>
        ) : (
          <AdminLoginPrompt message="Login Pengurus" />
        )}
      </header>

      {error && (
        <p className="rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {showForm && canManage && (
        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-2xl border border-sand-200 bg-white p-4 shadow-sm sm:p-5"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label">Jenis</label>
              <select
                className="input"
                value={form.type}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    type: e.target.value as SituationAlertType,
                  }))
                }
                required
              >
                {SITUATION_ALERT_TYPES.map((t) => (
                  <option
                    key={t.id}
                    value={t.id}
                    disabled={activeTypes.has(t.id)}
                  >
                    {t.group} — {t.label}
                    {activeTypes.has(t.id) ? " (aktif)" : ""}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Tingkat</label>
              <select
                className="input"
                value={form.severity}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    severity: e.target.value as SituationAlertSeverity,
                  }))
                }
                required
              >
                {SITUATION_ALERT_SEVERITIES.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="label">Judul singkat</label>
            <input
              className="input"
              value={form.title}
              onChange={(e) =>
                setForm((f) => ({ ...f, title: e.target.value }))
              }
              placeholder="Mis. Listrik padam Blok C"
              required
              minLength={2}
            />
          </div>
          <div>
            <label className="label">Keterangan</label>
            <textarea
              className="input min-h-[88px]"
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
              placeholder="Apa yang terjadi dan dampak untuk warga"
              required
              minLength={2}
              maxLength={1000}
            />
          </div>
          <div>
            <label className="label">Area terdampak (opsional)</label>
            <input
              className="input"
              value={form.affected_area}
              onChange={(e) =>
                setForm((f) => ({ ...f, affected_area: e.target.value }))
              }
              placeholder="Mis. Blok A–C, gate utama"
              maxLength={200}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-ink px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60"
            >
              {saving ? "Menyimpan…" : "Publikasikan"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-xl border border-sand-200 px-4 py-2.5 text-sm font-medium text-ink-soft"
            >
              Batal
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      ) : (
        <div className="space-y-8">
          <section className="space-y-3">
            <h2 className="section-title flex items-center gap-2">
              <Radio className="h-4 w-4 text-gold-dark" />
              Aktif ({active.length})
            </h2>
            {active.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-sand-200 bg-sand-50/60 px-4 py-8 text-center text-sm text-ink-faint">
                Tidak ada gangguan manual saat ini. Placeholder di dashboard
                tetap NORMAL.
              </p>
            ) : (
              <ul className="space-y-3">
                {active.map((alert) => (
                  <li
                    key={alert.id}
                    className="rounded-2xl border border-sand-200 bg-white p-4 shadow-sm"
                  >
                    <div className="flex flex-wrap items-start gap-2">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ring-1",
                          severityTone(alert.severity),
                        )}
                      >
                        <AlertTriangle className="h-3 w-3" />
                        {situationAlertSeverityLabel(alert.severity)}
                      </span>
                      <span className="text-[11px] font-medium uppercase tracking-wide text-ink-faint">
                        {situationAlertTypeLabel(alert.type)}
                      </span>
                      <span className="ml-auto text-[11px] text-ink-faint">
                        {formatRelativeId(alert.started_at)}
                      </span>
                    </div>
                    <p className="mt-2 text-sm font-semibold text-ink">
                      {alert.title}
                    </p>
                    <p className="mt-0.5 text-sm text-ink-soft">
                      {alert.description}
                    </p>
                    {alert.affected_area && (
                      <p className="mt-1 text-xs text-ink-faint">
                        Area: {alert.affected_area}
                      </p>
                    )}
                    {canManage && (
                      <button
                        type="button"
                        onClick={() => resolveAlert(alert.id)}
                        className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-sand-200 px-3 py-1.5 text-xs font-medium text-ink-soft hover:bg-sand-50"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Tandai selesai
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>

          {resolved.length > 0 && (
            <section className="space-y-3">
              <h2 className="section-title">Selesai terakhir</h2>
              <ul className="space-y-2">
                {resolved.slice(0, 8).map((alert) => (
                  <li
                    key={alert.id}
                    className="rounded-xl border border-sand-100 bg-sand-50/50 px-3 py-2.5"
                  >
                    <p className="text-sm text-ink-soft">
                      <span className="font-medium text-ink">{alert.title}</span>
                      <span className="text-ink-faint">
                        {" "}
                        · {situationAlertTypeLabel(alert.type)}
                      </span>
                    </p>
                    <p className="text-[11px] text-ink-faint">
                      Selesai{" "}
                      {alert.resolved_at
                        ? formatRelativeId(alert.resolved_at)
                        : "—"}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
