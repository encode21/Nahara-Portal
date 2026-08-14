export function isMalamPuncakStagePath(pathname: string | null): boolean {
  return Boolean(pathname?.includes("/malam-puncak/stage"));
}
