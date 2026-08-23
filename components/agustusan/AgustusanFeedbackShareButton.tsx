"use client";

import { useState } from "react";
import { Check, Share2 } from "lucide-react";
import { shareAgustusanFeedback } from "@/lib/agustusan/feedback-share";

type Props = {
  year: number;
  title?: string;
  className?: string;
  label?: string;
};

export function AgustusanFeedbackShareButton({
  year,
  title,
  className,
  label = "Bagikan tautan rating",
}: Props) {
  const [status, setStatus] = useState<"idle" | "copied" | "shared">("idle");

  async function handleShare() {
    const result = await shareAgustusanFeedback(year, title);
    if (result === "cancelled") return;
    if (result === "copied") {
      setStatus("copied");
      window.setTimeout(() => setStatus("idle"), 2000);
      return;
    }
    if (result === "shared" || result === "whatsapp") {
      setStatus("shared");
      window.setTimeout(() => setStatus("idle"), 2000);
    }
  }

  const done = status === "copied" || status === "shared";

  return (
    <button
      type="button"
      onClick={handleShare}
      className={
        className ??
        "inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 hover:bg-slate-50"
      }
    >
      {done ? (
        <>
          <Check className="h-4 w-4 text-emerald-600" />
          {status === "copied" ? "Tautan disalin" : "Siap dibagikan"}
        </>
      ) : (
        <>
          <Share2 className="h-4 w-4 text-[#7a1218]" />
          {label}
        </>
      )}
    </button>
  );
}
