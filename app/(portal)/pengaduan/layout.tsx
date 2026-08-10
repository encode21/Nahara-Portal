import type { Metadata } from "next";
import { LANDING_URL } from "@/lib/constants/brand";

export const metadata: Metadata = {
  title: "Pengaduan Lingkungan Cluster Nahara",
  description:
    "Pantau status pengaduan lingkungan Cluster Nahara di Cimanggis Golf Estate (CGE): infrastruktur, kebersihan, dan keamanan — nahara.id.",
  alternates: {
    canonical: `${LANDING_URL}/pengaduan`,
  },
  openGraph: {
    title: "Pengaduan Lingkungan | Cluster Nahara (CGE)",
    description:
      "Status laporan warga Cluster Nahara, Cimanggis Golf Estate.",
    url: `${LANDING_URL}/pengaduan`,
  },
};

export default function PengaduanLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
