"use client";

import { Suspense, type ReactNode } from "react";
import { NaharaLoaderProvider } from "@/components/ui/NaharaLoaderProvider";

/**
 * Suspense boundary required because NaharaLoaderProvider reads useSearchParams.
 */
export function AppLoaderShell({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={null}>
      <NaharaLoaderProvider>{children}</NaharaLoaderProvider>
    </Suspense>
  );
}
