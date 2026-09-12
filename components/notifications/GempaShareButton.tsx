"use client";

import { useState } from "react";
import { Share2, Check } from "lucide-react";
import { shareGempaAlert } from "@/lib/notifications/share-gempa";
import { cn } from "@/lib/utils";

type Props = {
  title: string;
  detail?: string | null;
  summary?: string | null;
  sourceUrl?: string | null;
  className?: string;
  /** compact = icon-ish for inbox rows */
  compact?: boolean;
};

export function GempaShareButton({
  title,
  detail,
  summary,
  sourceUrl,
  className,
  compact = false,
}: Props) {
  const [label, setLabel] = useState("Bagikan");
  const [busy, setBusy] = useState(false);

  async function onShare(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (busy) return;
    setBusy(true);
    const result = await shareGempaAlert({ title, detail, summary, sourceUrl });
    setBusy(false);
    if (result === "cancelled") return;
    if (result === "copied") setLabel("Tersalin");
    else if (result === "whatsapp") setLabel("WhatsApp");
    else if (result === "shared") setLabel("Terkirim");
    else setLabel("Coba lagi");
    window.setTimeout(() => setLabel("Bagikan"), 2200);
  }

  const done = label !== "Bagikan" && label !== "Coba lagi";

  return (
    <button
      type="button"
      onClick={(e) => void onShare(e)}
      disabled={busy}
      className={cn(
        compact
          ? "inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium text-amber-900 hover:bg-amber-100/80"
          : "inline-flex min-h-9 items-center gap-1.5 rounded-xl border border-amber-200 bg-white/80 px-3 text-xs font-medium text-amber-950 hover:bg-white",
        className
      )}
      aria-label="Bagikan alert gempa ke grup"
    >
      {done ? (
        <Check className="h-3.5 w-3.5" />
      ) : (
        <Share2 className="h-3.5 w-3.5" />
      )}
      {label}
    </button>
  );
}
