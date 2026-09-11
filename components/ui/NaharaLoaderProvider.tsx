"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { NaharaLoaderMark } from "@/components/ui/NaharaLoader";
import { useHasMounted } from "@/lib/hooks/useAppSurface";

type LoaderContextValue = {
  /** Begin a manual busy state (forms, saves, fetches). */
  start: (label?: string) => void;
  /** End one manual busy state. */
  done: () => void;
  /** Replace busy counter — force idle. */
  reset: () => void;
  busy: boolean;
};

const LoaderContext = createContext<LoaderContextValue | null>(null);

export function useNaharaLoader(): LoaderContextValue {
  const ctx = useContext(LoaderContext);
  if (!ctx) {
    throw new Error("useNaharaLoader must be used within NaharaLoaderProvider");
  }
  return ctx;
}

/** Safe optional hook — returns null outside provider. */
export function useNaharaLoaderOptional(): LoaderContextValue | null {
  return useContext(LoaderContext);
}

function isModifiedClick(e: MouseEvent) {
  return e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0;
}

function shouldTrackAnchor(a: HTMLAnchorElement): boolean {
  if (a.target && a.target !== "_self") return false;
  if (a.hasAttribute("download")) return false;
  if (a.dataset.noLoader === "true") return false;
  const href = a.getAttribute("href");
  if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) {
    return false;
  }
  try {
    const url = new URL(a.href, window.location.href);
    if (url.origin !== window.location.origin) return false;
    if (
      url.pathname === window.location.pathname &&
      url.search === window.location.search
    ) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export function NaharaLoaderProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const hasMounted = useHasMounted();

  const [navActive, setNavActive] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);
  const [progress, setProgress] = useState(0);
  const [busyCount, setBusyCount] = useState(0);
  const [busyLabel, setBusyLabel] = useState("Memproses");

  const overlayTimer = useRef<number | null>(null);
  const trickleTimer = useRef<number | null>(null);
  const safetyTimer = useRef<number | null>(null);
  const routeKey = `${pathname}?${searchParams?.toString() ?? ""}`;
  const routeKeyRef = useRef(routeKey);
  routeKeyRef.current = routeKey;

  const navActiveRef = useRef(false);

  const clearTimers = useCallback(() => {
    if (overlayTimer.current) window.clearTimeout(overlayTimer.current);
    if (trickleTimer.current) window.clearInterval(trickleTimer.current);
    if (safetyTimer.current) window.clearTimeout(safetyTimer.current);
    overlayTimer.current = null;
    trickleTimer.current = null;
    safetyTimer.current = null;
  }, []);

  const finishNav = useCallback(() => {
    if (!navActiveRef.current) return;
    navActiveRef.current = false;
    clearTimers();
    setProgress(100);
    window.setTimeout(() => {
      setNavActive(false);
      setShowOverlay(false);
      setProgress(0);
    }, 220);
  }, [clearTimers]);

  const beginNav = useCallback(() => {
    navActiveRef.current = true;
    clearTimers();
    setNavActive(true);
    setShowOverlay(false);
    setProgress(12);

    trickleTimer.current = window.setInterval(() => {
      setProgress((p) => {
        if (p >= 88) return p;
        const step = p < 40 ? 8 : p < 70 ? 4 : 1.5;
        return Math.min(88, p + step);
      });
    }, 180);

    // Full overlay only if navigation feels slow — avoids flash on fast hops
    overlayTimer.current = window.setTimeout(() => {
      setShowOverlay(true);
    }, 320);

    safetyTimer.current = window.setTimeout(() => {
      finishNav();
    }, 12_000);
  }, [clearTimers, finishNav]);

  // Complete when URL actually changes (not when finishNav identity changes)
  useEffect(() => {
    finishNav();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- route identity only
  }, [routeKey]);

  // Intercept internal link clicks
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (isModifiedClick(e)) return;
      const target = e.target as HTMLElement | null;
      const a = target?.closest?.("a") as HTMLAnchorElement | null;
      if (!a || !shouldTrackAnchor(a)) return;
      beginNav();
    }

    function onPopState() {
      beginNav();
    }

    document.addEventListener("click", onClick, true);
    window.addEventListener("popstate", onPopState);
    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("popstate", onPopState);
    };
  }, [beginNav]);

  const start = useCallback((label = "Memproses") => {
    setBusyLabel(label);
    setBusyCount((c) => c + 1);
  }, []);

  const done = useCallback(() => {
    setBusyCount((c) => Math.max(0, c - 1));
  }, []);

  const reset = useCallback(() => {
    setBusyCount(0);
    finishNav();
  }, [finishNav]);

  const busy = busyCount > 0;
  const visible = navActive || busy;

  const value = useMemo(
    () => ({ start, done, reset, busy }),
    [start, done, reset, busy],
  );

  return (
    <LoaderContext.Provider value={value}>
      {children}
      {hasMounted &&
        visible &&
        createPortal(
          <div
            className="pointer-events-none fixed inset-0 z-[200]"
            aria-busy="true"
            aria-live="polite"
          >
            {/* Top progress rail */}
            <div className="absolute inset-x-0 top-0 h-[3px] overflow-hidden bg-gold/15">
              <div
                className="nahara-loader-bar relative h-full bg-gradient-to-r from-gold-dark via-gold to-[#e8d5a3] shadow-[0_0_12px_rgba(201,168,76,0.65)] transition-[width] duration-200 ease-out"
                style={{
                  width: busy && !navActive ? "70%" : `${progress || 18}%`,
                }}
              />
            </div>

            {/* Soft veil + mark for slower nav / manual busy */}
            <div
              className={cn(
                "absolute inset-0 flex items-center justify-center bg-[#fcfbf7]/55 backdrop-blur-[2px] transition-opacity duration-300",
                showOverlay || busy
                  ? "pointer-events-auto opacity-100"
                  : "opacity-0",
              )}
            >
              {(showOverlay || busy) && (
                <div className="nahara-loader-panel rounded-[1.75rem] border border-sand-200/80 bg-white/90 px-10 py-9 shadow-lift">
                  <NaharaLoaderMark
                    size="lg"
                    label={busy ? busyLabel : "Memuat"}
                  />
                </div>
              )}
            </div>
          </div>,
          document.body,
        )}
    </LoaderContext.Provider>
  );
}
