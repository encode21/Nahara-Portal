"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Download, Share, X } from "lucide-react";
import { SITE_SHORT_NAME, SITE_TITLE } from "@/lib/constants/brand";

const DISMISS_KEY = "nahara-pwa-install-dismissed";
const DISMISS_DAYS = 14;
const SHOW_DELAY_MS = 1200;

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isIos(): boolean {
  if (typeof window === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isDismissed(): boolean {
  try {
    const raw = localStorage.getItem(DISMISS_KEY);
    if (!raw) return false;
    return Date.now() < Number(raw);
  } catch {
    return false;
  }
}

function dismissForAWhile() {
  try {
    localStorage.setItem(
      DISMISS_KEY,
      String(Date.now() + DISMISS_DAYS * 24 * 60 * 60 * 1000),
    );
  } catch {
    /* ignore */
  }
}

export function PwaInstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [iosHint, setIosHint] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isStandalone() || isDismissed()) return;

    if (isIos()) {
      const timer = setTimeout(() => {
        setIosHint(true);
        setVisible(true);
      }, SHOW_DELAY_MS);
      return () => clearTimeout(timer);
    }

    function onBeforeInstall(e: Event) {
      e.preventDefault();
      const ev = e as BeforeInstallPromptEvent;
      setDeferred(ev);
      setTimeout(() => setVisible(true), SHOW_DELAY_MS);
    }

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    return () => window.removeEventListener("beforeinstallprompt", onBeforeInstall);
  }, []);

  async function handleInstall() {
    if (!deferred) return;
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    setVisible(false);
    setDeferred(null);
    if (outcome === "dismissed") dismissForAWhile();
  }

  function handleClose() {
    dismissForAWhile();
    setVisible(false);
    setIosHint(false);
    setDeferred(null);
  }

  if (!visible) return null;

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-[100] p-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
      role="dialog"
      aria-labelledby="pwa-install-title"
    >
      <div className="mx-auto flex max-w-lg items-start gap-3 rounded-xl border border-gold/40 bg-white p-4 shadow-xl ring-1 ring-black/5">
        <Image
          src="/icons/icon-192.png"
          alt=""
          width={48}
          height={48}
          className="shrink-0 rounded-xl"
        />
        <div className="min-w-0 flex-1">
          <p id="pwa-install-title" className="font-semibold text-slate-900">
            Pasang {SITE_SHORT_NAME} di perangkat
          </p>
          {iosHint ? (
            <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
              Di Safari: ketuk{" "}
              <Share className="inline h-4 w-4 align-text-bottom text-gold-dark" aria-hidden />{" "}
              <strong>Share</strong>, lalu pilih{" "}
              <strong>Tambahkan ke Layar Utama</strong>.
            </p>
          ) : (
            <p className="mt-1.5 text-sm text-slate-600">
              Akses {SITE_TITLE} seperti aplikasi — lebih cepat dari browser biasa.
            </p>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            {!iosHint && deferred && (
              <button type="button" onClick={handleInstall} className="btn-primary text-xs">
                <Download className="mr-1.5 h-3.5 w-3.5" />
                Install sekarang
              </button>
            )}
            <button type="button" onClick={handleClose} className="btn-secondary text-xs">
              Nanti saja
            </button>
          </div>
        </div>
        <button
          type="button"
          onClick={handleClose}
          className="shrink-0 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          aria-label="Tutup"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
