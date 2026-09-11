"use client";

import Link from "next/link";
import { useWargaIdentity } from "@/lib/hooks/useWargaIdentity";
import { useAppSurface } from "@/lib/hooks/useAppSurface";
import { UserRound } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
  /** Compact header pill: first name · blok */
  compact?: boolean;
};

function firstName(nama: string): string {
  return nama.trim().split(/\s+/)[0] || nama;
}

export function WargaIdentityChip({ className, compact = false }: Props) {
  const surface = useAppSurface();
  const { identity, ready, change } = useWargaIdentity();

  if (surface !== "portal" || !ready || !identity) return null;

  if (compact) {
    return (
      <button
        type="button"
        onClick={change}
        className={cn(
          "flex max-w-[10.5rem] min-w-0 items-center gap-1.5 rounded-full border border-sand-200 bg-sand-50 px-2.5 py-1.5 text-left transition hover:border-gold/40 hover:bg-gold/5",
          className,
        )}
        title={`${identity.nama} · ${identity.blok} — ketuk untuk ganti`}
        aria-label={`Identitas ${identity.nama}, ${identity.blok}. Ketuk untuk ganti.`}
      >
        <UserRound className="h-3.5 w-3.5 shrink-0 text-gold-dark" />
        <span className="min-w-0 truncate text-xs font-medium text-ink">
          {firstName(identity.nama)}
          <span className="text-ink-faint"> · {identity.blok}</span>
        </span>
      </button>
    );
  }

  return (
    <div
      className={cn(
        "flex min-w-0 max-w-full items-center gap-1.5 rounded-lg border border-gold/25 bg-gold/5 px-2 py-1 text-xs text-slate-700",
        className,
      )}
    >
      <UserRound className="h-3.5 w-3.5 shrink-0 text-gold-dark" />
      <span className="min-w-0 flex-1 truncate">
        <span className="text-slate-500">Anda:</span> {identity.nama}
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
