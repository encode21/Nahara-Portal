import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { LandingPage } from "@/components/landing/LandingPage";
import {
  LANDING_SITE_DESCRIPTION,
  LANDING_URL,
  SITE_DESCRIPTION,
  SITE_TITLE,
} from "@/lib/constants/brand";
import { buildPortalUrl, getAppSurface } from "@/lib/host";

/** Crawlers that need HTTP 200 + Open Graph on `/` (Next.js redirect() is 307). */
const SOCIAL_BOT_RE =
  /facebookexternalhit|Facebot|Twitterbot|LinkedInBot|Slackbot|WhatsApp|TelegramBot|Discordbot|Googlebot|bingbot|Applebot/i;

function landingJsonLd() {
  const orgId = `${LANDING_URL}/#organization`;
  const websiteId = `${LANDING_URL}/#website`;
  const placeId = `${LANDING_URL}/#place`;

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": websiteId,
        url: LANDING_URL,
        name: "Cluster Nahara",
        alternateName: [
          "Nahara Cimanggis",
          "Cimanggis Golf Estate Nahara",
          "CGE Nahara",
          "nahara.id",
        ],
        description: LANDING_SITE_DESCRIPTION,
        inLanguage: "id-ID",
        publisher: { "@id": orgId },
        about: { "@id": placeId },
      },
      {
        "@type": "Organization",
        "@id": orgId,
        name: "Paguyuban Warga Nahara",
        alternateName: [
          "Paguyuban Warga Cluster Nahara",
          "Cluster Nahara",
          "Nahara Cluster",
          "Nahara Cimanggis",
          "Cluster Nahara Cimanggis Golf Estate",
          "CGE Nahara",
          "Paguyuban Nahara",
        ],
        url: LANDING_URL,
        logo: {
          "@type": "ImageObject",
          url: `${LANDING_URL}/icons/icon-512.png`,
        },
        image: `${LANDING_URL}/og.png`,
        sameAs: [LANDING_URL],
        address: {
          "@type": "PostalAddress",
          streetAddress: "Cimanggis Golf Estate",
          addressLocality: "Cimanggis",
          addressRegion: "Jawa Barat",
          addressCountry: "ID",
        },
        areaServed: { "@id": placeId },
      },
      {
        "@type": ["Place", "ResidenceCommunity"],
        "@id": placeId,
        name: "Cluster Nahara",
        alternateName: [
          "Cluster Nahara Cimanggis Golf Estate",
          "Nahara Cimanggis Golf Estate",
          "CGE — Cluster Nahara",
          "Cluster Cimanggis Golf Estate Nahara",
        ],
        description:
          "Cluster Nahara di Cimanggis Golf Estate (CGE), Cimanggis, Depok. Informasi resmi dikelola Paguyuban Warga Nahara melalui nahara.id.",
        url: LANDING_URL,
        address: {
          "@type": "PostalAddress",
          streetAddress: "Cimanggis Golf Estate",
          addressLocality: "Cimanggis",
          addressRegion: "Jawa Barat",
          addressCountry: "ID",
        },
        containedInPlace: {
          "@type": "Place",
          name: "Cimanggis Golf Estate (CGE)",
          alternateName: ["CGE", "Cimanggis Golf Estate"],
        },
      },
    ],
  };
}

export default async function HomePage() {
  const headerList = await headers();
  const ua = headerList.get("user-agent") ?? "";
  const surface = getAppSurface(headerList.get("host"));

  if (surface === "landing") {
    return (
      <>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(landingJsonLd()),
          }}
        />
        <LandingPage />
      </>
    );
  }

  if (surface === "ops") {
    redirect("/login");
  }

  // Portal: bots get OG shell; humans go to dashboard
  if (!SOCIAL_BOT_RE.test(ua)) {
    redirect("/dashboard");
  }

  return (
    <div className="mx-auto max-w-xl space-y-3 py-16 text-center">
      <h1 className="font-display text-3xl font-bold text-slate-900">{SITE_TITLE}</h1>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">{SITE_DESCRIPTION}</p>
      <p className="pt-4 text-xs text-slate-400">
        <a
          href={buildPortalUrl("/dashboard")}
          className="text-gold-dark hover:underline"
        >
          Lanjut ke dashboard
        </a>
      </p>
    </div>
  );
}
