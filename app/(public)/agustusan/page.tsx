import type { Metadata } from "next";
import { AgustusanPublicHub } from "@/components/agustusan/AgustusanPublicHub";
import {
  AGUSTUSAN_TAGLINE,
  AGUSTUSAN_TITLE,
  AGUSTUSAN_YEAR,
} from "@/lib/constants/agustusan";
import { LANDING_URL } from "@/lib/constants/brand";

const title = `${AGUSTUSAN_TITLE} ${AGUSTUSAN_YEAR} — Cluster Nahara Cimanggis Golf Estate`;
const description = `${AGUSTUSAN_TAGLINE} Dokumentasi, lomba, dan kegiatan Agustusan Cluster Nahara di Cimanggis Golf Estate (CGE).`;

export const metadata: Metadata = {
  title,
  description,
  keywords: [
    "agustusan cluster nahara",
    "hut ri cluster nahara",
    "lomba agustusan cge",
    "cimanggis golf estate agustusan",
    "nahara cimanggis",
  ],
  alternates: {
    canonical: `${LANDING_URL}/agustusan`,
  },
  openGraph: {
    title: `${AGUSTUSAN_TITLE} ${AGUSTUSAN_YEAR} | Cluster Nahara (CGE)`,
    description,
    url: `${LANDING_URL}/agustusan`,
  },
};

export default function AgustusanPublicPage() {
  return <AgustusanPublicHub year={AGUSTUSAN_YEAR} />;
}
