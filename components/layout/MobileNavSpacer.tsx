"use client";

import { useAppSurface } from "@/lib/hooks/useAppSurface";
import { cn } from "@/lib/utils";

/** Reserves space above the portal mobile tab bar. */
export function MobileNavSpacer({
  children,
}: {
  children: React.ReactNode;
}) {
  const surface = useAppSurface();
  return (
    <div
      className={cn(
        surface === "portal" &&
          "pb-[calc(5.25rem+env(safe-area-inset-bottom))] md:pb-0",
      )}
    >
      {children}
    </div>
  );
}
