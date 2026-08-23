"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, Loader2, Star } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getSupabaseErrorMessage } from "@/lib/supabase/errors";
import { PUBLIC_LIMITS, clampText } from "@/lib/validation/publicForms";
import type { EventEditionFeedbackSource } from "@/lib/types";

const BODY_MIN = 10;
const RATING_HINTS: Record<number, string> = {
  1: "Kurang",
  2: "Perlu ditingkatkan",
  3: "Cukup",
  4: "Bagus",
  5: "Sangat bagus",
};

type Props = {
  editionId: string;
  source: EventEditionFeedbackSource;
  registrationId?: string | null;
  defaultName?: string;
  compact?: boolean;
  onSubmitted?: () => void;
};

export function AgustusanFeedbackForm({
  editionId,
  source,
  registrationId,
  defaultName,
  compact,
  onSubmitted,
}: Props) {
  const supabase = useMemo(() => createClient(), []);
  const [open, setOpen] = useState(!compact);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [body, setBody] = useState("");
  const [name, setName] = useState(defaultName ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (rating < 1 || rating > 5) {
      setError("Pilih rating 1–5 bintang dulu.");
      return;
    }
    const trimmed = clampText(body, PUBLIC_LIMITS.pesan);
    if (trimmed.length < BODY_MIN) {
      setError(`Tulis masukan minimal ${BODY_MIN} karakter.`);
      return;
    }
    const displayName = clampText(name, PUBLIC_LIMITS.nama);
    setSubmitting(true);
    const { error: err } = await supabase.from("event_edition_feedback").insert({
      edition_id: editionId,
      rating,
      body: trimmed,
      display_name: displayName.length >= 2 ? displayName : null,
      registration_id: registrationId || null,
      source,
    });
    setSubmitting(false);
    if (err) {
      setError(getSupabaseErrorMessage(err) ?? "Gagal mengirim masukan.");
      return;
    }
    setDone(true);
    onSubmitted?.();
  }

  if (done) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-800">
        <CheckCircle2 className="mb-1 inline h-4 w-4" /> Terima kasih. Masukan dan rating-nya
        membantu panitia evaluasi dan merancang lomba tahun depan.
      </div>
    );
  }

  if (compact && !open) {
    return (
      <button
        type="button"
        className="btn-secondary w-full"
        onClick={() => setOpen(true)}
      >
        Beri rating & masukan
      </button>
    );
  }

  const shown = hover || rating;

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <p className="text-sm font-medium text-slate-900">Rating acara tahun ini</p>
        <p className="mt-0.5 text-xs text-slate-500">
          Apa yang bagus, kurang, dan perlu ditingkatkan.
        </p>
        <div className="mt-2 flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              className="rounded p-0.5 text-amber-400 transition hover:scale-110"
              aria-label={`${n} bintang`}
              onMouseEnter={() => setHover(n)}
              onMouseLeave={() => setHover(0)}
              onClick={() => setRating(n)}
            >
              <Star
                className="h-7 w-7"
                fill={shown >= n ? "currentColor" : "none"}
                strokeWidth={1.5}
              />
            </button>
          ))}
          {shown > 0 && (
            <span className="ml-2 text-xs font-medium text-slate-600">
              {RATING_HINTS[shown]}
            </span>
          )}
        </div>
      </div>
      <div>
        <label className="label" htmlFor={`feedback-body-${source}`}>
          Masukan & ide
        </label>
        <textarea
          id={`feedback-body-${source}`}
          className="input min-h-[7rem]"
          maxLength={PUBLIC_LIMITS.pesan}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Perbaikan acara, lomba yang perlu diadakan tahun depan, atau ide lain yang sulit disampaikan langsung…"
          required
        />
        <p className="mt-1 text-xs text-slate-400">
          {body.trim().length}/{PUBLIC_LIMITS.pesan}
        </p>
      </div>
      <div>
        <label className="label" htmlFor={`feedback-name-${source}`}>
          Nama (opsional)
        </label>
        <input
          id={`feedback-name-${source}`}
          className="input"
          maxLength={PUBLIC_LIMITS.nama}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Boleh dikosongkan — tetap anonim"
        />
      </div>
      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      <button type="submit" className="btn-primary w-full" disabled={submitting}>
        {submitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Mengirim…
          </>
        ) : (
          "Kirim masukan"
        )}
      </button>
    </form>
  );
}
