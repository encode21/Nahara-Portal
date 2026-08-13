"use client";

import { DUCK_RACE_FAIRNESS_STEPS } from "@/lib/agustusan/duck-race";

type Props = {
  open: boolean;
  onClose: () => void;
};

export function DuckRaceFairnessModal({ open, onClose }: Props) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="duck-race-fairness-title"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-[#faf7f0] p-6 shadow-2xl ring-1 ring-[#c9a84c]/40"
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          id="duck-race-fairness-title"
          className="font-display text-xl font-bold text-[#7a1218]"
        >
          Bagaimana Duck Race menentukan pemenang?
        </h2>
        <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-slate-800">
          {DUCK_RACE_FAIRNESS_STEPS.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
        <p className="mt-4 text-sm font-medium text-[#7a1218]">
          Jadi pemenang tidak dipilih secara manual oleh panitia.
        </p>
        <button type="button" className="btn-primary mt-6 w-full" onClick={onClose}>
          Mengerti
        </button>
      </div>
    </div>
  );
}
