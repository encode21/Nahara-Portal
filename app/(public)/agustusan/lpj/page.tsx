import type { Metadata } from "next";
import { AgustusanLpjPage } from "@/components/agustusan/AgustusanLpjPage";
import {
  AGUSTUSAN_TAGLINE,
  AGUSTUSAN_TITLE,
  AGUSTUSAN_YEAR,
} from "@/lib/constants/agustusan";
import { LANDING_URL } from "@/lib/constants/brand";

const title = `LPJ ${AGUSTUSAN_TITLE} ${AGUSTUSAN_YEAR} — Cluster Nahara`;
const description = `${AGUSTUSAN_TAGLINE} Laporan pertanggungjawaban dana Agustusan HUT RI ke-81 Cluster Nahara: pemasukan, pengeluaran, donatur, dan rincian belanja.`;

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: `${LANDING_URL}/agustusan/lpj`,
  },
  openGraph: {
    title,
    description,
    url: `${LANDING_URL}/agustusan/lpj`,
  },
};

export default function AgustusanPublicLpjRoute() {
  return (
    <div className="min-h-screen bg-[#f4f1ec]">
      <AgustusanLpjPage
        year={AGUSTUSAN_YEAR}
        backHref="/agustusan"
        backLabel="Hub Agustusan"
        overlayHeader
      />
    </div>
  );
}
