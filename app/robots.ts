import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { LANDING_URL } from "@/lib/constants/brand";
import { getAppSurface, getLandingOrigin } from "@/lib/host";

/** Portal/ops: block all indexing. Landing: allow + point to sitemap. */
export default async function robots(): Promise<MetadataRoute.Robots> {
  const surface = getAppSurface((await headers()).get("host"));

  if (surface !== "landing") {
    return {
      rules: {
        userAgent: "*",
        disallow: "/",
      },
    };
  }

  const origin = getLandingOrigin() || LANDING_URL;

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/login", "/offline", "/api/"],
    },
    sitemap: `${origin}/sitemap.xml`,
    host: new URL(origin).host,
  };
}
