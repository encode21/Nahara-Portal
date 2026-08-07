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
