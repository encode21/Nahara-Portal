import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { MarkdownGuide } from "@/components/panduan/MarkdownGuide";
import { loadGuideMarkdown } from "@/lib/panduan/loadGuide";

export const metadata = {
  title: "Panduan Pengurus | Nahara",
  description: "Cara mengelola Nahara Portal untuk pengurus RT/RW",
};

export default async function PanduanPengurusPage() {
  const content = await loadGuideMarkdown("pengurus");

  return (
    <div className="space-y-6">
      <Link
        href="/panduan"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-gold-dark"
      >
        <ArrowLeft className="h-4 w-4" />
        Semua panduan
      </Link>
      <MarkdownGuide content={content} />
      <div className="border-t border-gold/15 pt-6">
        <Link href="/panduan/warga" className="text-sm font-medium text-gold-dark hover:underline">
          ← Lihat juga Panduan Warga
        </Link>
      </div>
    </div>
  );
}
