import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { LANDING_URL } from "@/lib/constants/brand";
import { getAppSurface, getLandingOrigin } from "@/lib/host";

/** Sitemap hanya untuk landing (nahara.id). Portal/ops mengembalikan kosong. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const surface = getAppSurface((await headers()).get("host"));
  if (surface !== "landing") {
    return [];
  }

  const origin = getLandingOrigin() || LANDING_URL;
  const lastModified = new Date();

  const paths: {
    path: string;
    changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
    priority: number;
  }[] = [
    { path: "/", changeFrequency: "daily", priority: 1 },
    { path: "/agustusan", changeFrequency: "weekly", priority: 0.9 },
    { path: "/agustusan/lpj", changeFrequency: "monthly", priority: 0.7 },
    { path: "/pengumuman", changeFrequency: "daily", priority: 0.8 },
    { path: "/pengaduan", changeFrequency: "daily", priority: 0.7 },
  ];

  return paths.map(({ path, changeFrequency, priority }) => ({
    url: path === "/" ? origin : `${origin}${path}`,
    lastModified,
    changeFrequency,
    priority,
  }));
}
