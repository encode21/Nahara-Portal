"use client";

import { useWargaIdentity } from "@/lib/hooks/useWargaIdentity";
import { useAppSurface } from "@/lib/hooks/useAppSurface";
import { UserRound } from "lucide-react";

export function WargaIdentityChip() {
  const surface = useAppSurface();
  const { identity, ready, change } = useWargaIdentity();

  if (surface !== "portal" || !ready || !identity) return null;

  return (
    <div className="flex items-center gap-1.5 rounded-lg border border-gold/25 bg-gold/5 px-2 py-1 text-xs text-slate-700">
      <UserRound className="h-3.5 w-3.5 shrink-0 text-gold-dark" />
      <span className="max-w-[9rem] truncate sm:max-w-[14rem]">
        Anda: {identity.nama}
        <span className="text-slate-400"> · {identity.blok}</span>
      </span>
      <button
        type="button"
        onClick={change}
        className="shrink-0 font-medium text-gold-dark hover:underline"
      >
        Ganti
      </button>
    </div>
  );
}
