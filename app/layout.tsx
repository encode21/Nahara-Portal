import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { Plus_Jakarta_Sans, Syne } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import {
  LANDING_SITE_DESCRIPTION,
  LANDING_SITE_TITLE,
  LANDING_URL,
  OG_IMAGE_PATH,
  SITE_DESCRIPTION,
  SITE_KEYWORDS,
  SITE_SHORT_NAME,
  SITE_TITLE,
  THEME_COLOR,
} from "@/lib/constants/brand";
import { getAppSurface, getLandingOrigin, getPortalOrigin } from "@/lib/host";
import { PwaInstallPrompt } from "@/components/pwa/PwaInstallPrompt";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
});

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-syne",
});

export async function generateMetadata(): Promise<Metadata> {
  const surface = getAppSurface((await headers()).get("host"));
  const isLanding = surface === "landing";
  const base = isLanding
    ? getLandingOrigin() || LANDING_URL
    : getPortalOrigin();

  const title = isLanding ? LANDING_SITE_TITLE : SITE_TITLE;
  const description = isLanding ? LANDING_SITE_DESCRIPTION : SITE_DESCRIPTION;

  return {
    metadataBase: new URL(base),
    title: {
      default: title,
      template: isLanding ? `%s | Cluster Nahara` : `%s | ${SITE_TITLE}`,
    },
    description,
    applicationName: isLanding ? SITE_SHORT_NAME : SITE_TITLE,
    keywords: SITE_KEYWORDS,
    authors: [{ name: "Paguyuban Warga Nahara" }],
    creator: "Paguyuban Warga Nahara",
    publisher: "Paguyuban Warga Nahara — Cimanggis Golf Estate",
    category: "community",
    alternates: {
      canonical: isLanding ? LANDING_URL : undefined,
    },
    openGraph: {
      type: "website",
      locale: "id_ID",
      url: isLanding ? LANDING_URL : base,
      siteName: isLanding ? "Cluster Nahara" : SITE_TITLE,
      title,
      description,
      images: [
        {
          url: OG_IMAGE_PATH,
          width: 1200,
          height: 630,
          alt: `${SITE_SHORT_NAME} — Paguyuban Warga Cluster Nahara, Cimanggis Golf Estate`,
          type: "image/png",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [OG_IMAGE_PATH],
    },
    appleWebApp: {
      capable: true,
      statusBarStyle: "default",
      title: isLanding ? SITE_SHORT_NAME : SITE_TITLE,
    },
    formatDetection: {
      telephone: false,
    },
    icons: {
      icon: [
        { url: "/favicon.png", type: "image/png" },
        { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
        { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      ],
      apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
    },
    robots: isLanding
      ? { index: true, follow: true, googleBot: { index: true, follow: true } }
      : {
          index: false,
          follow: false,
          googleBot: { index: false, follow: false },
        },
  };
}

export const viewport: Viewport = {
  themeColor: THEME_COLOR,
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className={`${jakarta.variable} ${syne.variable} max-w-[100%] overflow-x-clip font-sans`}>
        {children}
        <PwaInstallPrompt />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
