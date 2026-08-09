import type { Metadata } from "next";
import { AgustusanPublicHub } from "@/components/agustusan/AgustusanPublicHub";
import {
  AGUSTUSAN_TAGLINE,
  AGUSTUSAN_TITLE,
  AGUSTUSAN_YEAR,
} from "@/lib/constants/agustusan";
import { LANDING_URL } from "@/lib/constants/brand";

export const metadata: Metadata = {
  title: `${AGUSTUSAN_TITLE} ${AGUSTUSAN_YEAR}`,
  description: `${AGUSTUSAN_TAGLINE} Dokumentasi, lomba, dan kegiatan Agustusan Cluster Nahara.`,
  alternates: {
    canonical: `${LANDING_URL}/agustusan`,
  },
  openGraph: {
    title: `${AGUSTUSAN_TITLE} ${AGUSTUSAN_YEAR} | Cluster Nahara`,
    description: AGUSTUSAN_TAGLINE,
    url: `${LANDING_URL}/agustusan`,
  },
};

export default function AgustusanPublicPage() {
  return <AgustusanPublicHub year={AGUSTUSAN_YEAR} />;
}
