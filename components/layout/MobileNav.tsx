"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { portalNavItems } from "@/lib/constants/nav";

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 bg-white lg:hidden">
      <div className="flex justify-around overflow-x-auto py-1.5">
        {portalNavItems.map((item) => {
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
