import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { LandingPage } from "@/components/landing/LandingPage";
import { SITE_DESCRIPTION, SITE_TITLE } from "@/lib/constants/brand";
import { buildPortalUrl, getAppSurface } from "@/lib/host";

/** Crawlers that need HTTP 200 + Open Graph on `/` (Next.js redirect() is 307). */
const SOCIAL_BOT_RE =
  /facebookexternalhit|Facebot|Twitterbot|LinkedInBot|Slackbot|WhatsApp|TelegramBot|Discordbot|Googlebot|bingbot|Applebot/i;

export default async function HomePage() {
  const headerList = await headers();
  const ua = headerList.get("user-agent") ?? "";
  const surface = getAppSurface(headerList.get("host"));

  if (surface === "landing") {
    return <LandingPage />;
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
