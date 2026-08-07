"use client";

import { useEffect, useState } from "react";
import { getAppSurface, type AppSurface } from "@/lib/host";

/** Client-side surface from window.location.host. Defaults to portal until mounted. */
export function useAppSurface(): AppSurface {
  const [surface, setSurface] = useState<AppSurface>("portal");

  useEffect(() => {
    setSurface(getAppSurface(window.location.host));
  }, []);

  return surface;
}

/** True after client mount — use to avoid SSR/hydration flash for surface-gated UI. */
export function useHasMounted(): boolean {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  return mounted;
}
