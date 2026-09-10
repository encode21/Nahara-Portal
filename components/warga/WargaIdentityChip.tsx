"use client";

import { useWargaIdentity } from "@/lib/hooks/useWargaIdentity";
import { useAppSurface } from "@/lib/hooks/useAppSurface";
import { UserRound } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
};

export function WargaIdentityChip({ className }: Props) {
  const surface = useAppSurface();
  const { identity, ready, change } = useWargaIdentity();

  if (surface !== "portal" || !ready || !identity) return null;

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

/** Full-width strip under header on small screens — keeps hamburger free. */
export function WargaIdentityMobileStrip({
  className,
}: {
  className?: string;
}) {
  const surface = useAppSurface();
  const { identity, ready } = useWargaIdentity();

  if (surface !== "portal" || !ready || !identity) return null;

  return (
    <div
      className={cn(
        "border-t border-gold/10 px-4 py-1.5 sm:hidden",
        className,
      )}
    >
      <WargaIdentityChip />
    </div>
  );
}
