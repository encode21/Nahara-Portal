import type { Metadata } from "next";
import { AgustusanMasukanPage } from "@/components/agustusan/AgustusanMasukanPage";
import {
  AGUSTUSAN_TAGLINE,
  AGUSTUSAN_TITLE,
  AGUSTUSAN_YEAR,
} from "@/lib/constants/agustusan";
import { LANDING_URL } from "@/lib/constants/brand";

const title = `Rating & usulan ${AGUSTUSAN_TITLE} ${AGUSTUSAN_YEAR}`;
const description = `${AGUSTUSAN_TAGLINE} Beri rating, usulkan perbaikan dan lomba tahun depan, serta lihat masukan warga Cluster Nahara.`;

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: `${LANDING_URL}/agustusan/masukan`,
  },
  openGraph: {
    title,
    description,
    url: `${LANDING_URL}/agustusan/masukan`,
  },
};

export default function AgustusanPublicMasukanRoute() {
  return (
    <div className="min-h-screen bg-[#f4f1ec]">
      <AgustusanMasukanPage
        year={AGUSTUSAN_YEAR}
        backHref="/agustusan"
        backLabel="Hub Agustusan"
        formSource="share"
      />
    </div>
  );
}
