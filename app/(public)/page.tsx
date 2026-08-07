import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { SITE_DESCRIPTION, SITE_TITLE } from "@/lib/constants/brand";

/** Crawlers that need HTTP 200 + Open Graph on `/` (Next.js redirect() is 307). */
const SOCIAL_BOT_RE =
  /facebookexternalhit|Facebot|Twitterbot|LinkedInBot|Slackbot|WhatsApp|TelegramBot|Discordbot|Googlebot|bingbot|Applebot/i;

export default async function HomePage() {
  const ua = (await headers()).get("user-agent") ?? "";

  if (!SOCIAL_BOT_RE.test(ua)) {
    redirect("/dashboard");
  }

  return (
    <div className="mx-auto max-w-xl space-y-3 py-16 text-center">
      <h1 className="font-display text-3xl font-bold text-slate-900">{SITE_TITLE}</h1>
      <p className="text-sm leading-relaxed text-slate-600">{SITE_DESCRIPTION}</p>
    </div>
  );
}
