"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { getNavItemsForAccess } from "@/lib/constants/nav";
import { useAuth } from "@/lib/hooks/useAuth";
import { useAppSurface } from "@/lib/hooks/useAppSurface";

export function MobileNav() {
  const pathname = usePathname();
  const surface = useAppSurface();
  const { isAdmin, isStaff } = useAuth();

  const items = useMemo(
    () => getNavItemsForAccess({ surface, isAdmin, isStaff }),
    [surface, isAdmin, isStaff]
  );

  // Bottom bar: show a short subset (max ~5) for mobile thumb reach
  const bottomItems = items.slice(0, 5);

  if (bottomItems.length === 0) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 bg-white lg:hidden">
      <div className="flex justify-around overflow-x-auto py-1.5">
        {bottomItems.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex min-w-[3rem] flex-col items-center gap-0.5 px-1.5 py-1.5 text-[9px] font-medium transition-colors",
                active ? "text-gold-dark" : "text-slate-500"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.mobileLabel ?? item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
