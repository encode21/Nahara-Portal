import { readFile } from "fs/promises";
import path from "path";

export type GuideSlug = "warga" | "pengurus";

const FILES: Record<GuideSlug, string> = {
  warga: "panduan-warga.md",
  pengurus: "panduan-pengurus.md",
};

export async function loadGuideMarkdown(slug: GuideSlug): Promise<string> {
  const filePath = path.join(process.cwd(), "docs", FILES[slug]);
  return readFile(filePath, "utf8");
}
