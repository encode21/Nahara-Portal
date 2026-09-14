import { readFile } from "node:fs/promises";
import path from "node:path";
export async function GET() {
  const file = await readFile(path.resolve(process.cwd(), "public/siteplan.jpg"));
  return new Response(file, { headers: { "Content-Type": "image/jpeg" } });
}
