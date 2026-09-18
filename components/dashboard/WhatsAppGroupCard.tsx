import Image from "next/image";
import { ExternalLink, MessageCircle } from "lucide-react";
import { WHATSAPP_GROUP } from "@/lib/constants/community";

export function WhatsAppGroupCard() {
  return (
    <section className="glass-card overflow-hidden" aria-labelledby="whatsapp-group-title">
      <div className="flex flex-col items-center gap-5 sm:flex-row sm:justify-between">
        <div className="w-full text-center sm:max-w-xl sm:text-left">
          <span className="icon-badge mx-auto sm:mx-0">
            <MessageCircle className="h-5 w-5" aria-hidden="true" />
          </span>
          <p className="mt-3 text-xs font-medium uppercase tracking-wider text-ink-faint">
            Grup WhatsApp
          </p>
          <h2
            id="whatsapp-group-title"
            className="mt-1 font-display text-xl font-semibold text-ink"
          >
            {WHATSAPP_GROUP.name}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">
            Scan QR atau gunakan tombol di bawah untuk bergabung dan terhubung
            dengan warga Nahara.
          </p>
          <a
            href={WHATSAPP_GROUP.inviteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary mt-4 inline-flex w-full items-center justify-center gap-2 sm:w-auto"
          >
            Gabung grup WhatsApp
            <ExternalLink className="h-4 w-4" aria-hidden="true" />
          </a>
        </div>

        <div className="shrink-0 rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
          <Image
            src={WHATSAPP_GROUP.qrImagePath}
            alt={`QR untuk bergabung ke grup WhatsApp ${WHATSAPP_GROUP.name}`}
            width={344}
            height={260}
            className="h-auto w-[172px] max-w-full"
          />
        </div>
      </div>
    </section>
  );
}
