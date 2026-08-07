import type { Metadata } from "next";
import { AgustusanPublicHub } from "@/components/agustusan/AgustusanPublicHub";
import {
  AGUSTUSAN_TAGLINE,
  AGUSTUSAN_TITLE,
  AGUSTUSAN_YEAR,
} from "@/lib/constants/agustusan";

export const metadata: Metadata = {
  title: `${AGUSTUSAN_TITLE} ${AGUSTUSAN_YEAR}`,
  description: AGUSTUSAN_TAGLINE,
};

export default function AgustusanPublicPage() {
  return <AgustusanPublicHub year={AGUSTUSAN_YEAR} />;
}
