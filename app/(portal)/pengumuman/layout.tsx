import type { Metadata } from "next";
import { LANDING_URL } from "@/lib/constants/brand";

export const metadata: Metadata = {
  title: "Pengumuman Warga Cluster Nahara",
  description:
    "Pengumuman resmi Paguyuban Warga Nahara, Cluster Nahara — Cimanggis Golf Estate (CGE). Kabar keamanan, kebersihan, dan agenda warga — nahara.id.",
  alternates: {
    canonical: `${LANDING_URL}/pengumuman`,
  },
  openGraph: {
    title: "Pengumuman Warga | Paguyuban Warga Nahara",
    description:
      "Pengumuman terbaru dari Paguyuban Warga Nahara di Cluster Nahara (CGE), Cimanggis.",
    url: `${LANDING_URL}/pengumuman`,
  },
};

export default function PengumumanLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
