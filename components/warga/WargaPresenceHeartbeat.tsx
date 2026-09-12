"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useWargaIdentity } from "@/lib/hooks/useWargaIdentity";
import { useAppSurface } from "@/lib/hooks/useAppSurface";

const HEARTBEAT_MS = 60_000;

export function WargaPresenceHeartbeat() {
  const surface = useAppSurface();
  const pathname = usePathname();
  const { identity, ready } = useWargaIdentity();
  const lastTouchRef = useRef(0);

  useEffect(() => {
    if (surface !== "portal" || !ready || !identity?.wargaId) return;

    const supabase = createClient();
    let cancelled = false;
    let intervalId: ReturnType<typeof setInterval> | null = null;

    async function touch(force = false) {
      if (cancelled || document.visibilityState === "hidden") return;
      const now = Date.now();
      if (!force && now - lastTouchRef.current < HEARTBEAT_MS - 5_000) return;
      lastTouchRef.current = now;
      await supabase.rpc("touch_warga_presence", {
        p_warga_id: identity!.wargaId,
        p_path: pathname || "/",
      });
    }

    void touch(true);

    intervalId = setInterval(() => {
      void touch();
    }, HEARTBEAT_MS);

    function onVisibility() {
      if (document.visibilityState === "visible") void touch(true);
    }

    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelled = true;
      if (intervalId) clearInterval(intervalId);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [surface, ready, identity?.wargaId, pathname]);

  return null;
}
