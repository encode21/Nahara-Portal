"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  clearWargaIdentity,
  dismissWargaIdentityPrompt,
  isWargaIdentityDismissed,
  readWargaIdentity,
  resetWargaIdentityDismiss,
  writeWargaIdentity,
  type WargaIdentity,
} from "@/lib/warga-identity";

type WargaIdentityContextValue = {
  identity: WargaIdentity | null;
  ready: boolean;
  showPrompt: boolean;
  confirm: (next: WargaIdentity) => void;
  dismiss: () => void;
  change: () => void;
};

const WargaIdentityContext = createContext<WargaIdentityContextValue | null>(
  null
);

export function WargaIdentityProvider({ children }: { children: ReactNode }) {
  const [identity, setIdentity] = useState<WargaIdentity | null>(null);
  const [ready, setReady] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [forcePrompt, setForcePrompt] = useState(false);

  useEffect(() => {
    setIdentity(readWargaIdentity());
    setDismissed(isWargaIdentityDismissed());
    setReady(true);
  }, []);

  const confirm = useCallback((next: WargaIdentity) => {
    writeWargaIdentity(next);
    setIdentity(next);
    setDismissed(false);
    setForcePrompt(false);
  }, []);

  const dismiss = useCallback(() => {
    dismissWargaIdentityPrompt();
    setDismissed(true);
    setForcePrompt(false);
  }, []);

  const change = useCallback(() => {
    clearWargaIdentity();
    resetWargaIdentityDismiss();
    setIdentity(null);
    setDismissed(false);
    setForcePrompt(true);
  }, []);

  const value = useMemo<WargaIdentityContextValue>(
    () => ({
      identity,
      ready,
      showPrompt: ready && !identity && (!dismissed || forcePrompt),
      confirm,
      dismiss,
      change,
    }),
    [identity, ready, dismissed, forcePrompt, confirm, dismiss, change]
  );

  return (
    <WargaIdentityContext.Provider value={value}>
      {children}
    </WargaIdentityContext.Provider>
  );
}

export function useWargaIdentity(): WargaIdentityContextValue {
  const ctx = useContext(WargaIdentityContext);
  if (!ctx) {
    throw new Error(
      "useWargaIdentity must be used within WargaIdentityProvider"
    );
  }
  return ctx;
}
