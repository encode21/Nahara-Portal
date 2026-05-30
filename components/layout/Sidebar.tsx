"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, LogOut, LogIn, Settings } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { portalNavItems } from "@/lib/constants/nav";
import { useAuth } from "@/lib/hooks/useAuth";

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const { isAdmin } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.refresh();
  }

  return (
    <aside
      className={cn(
        "hidden shrink-0 flex-col border-r border-slate-200 bg-white transition-all duration-300 lg:flex",
        collapsed ? "w-[72px]" : "w-64"
      )}
    >
      <div className={cn("flex items-center border-b border-slate-200 px-4 py-5", collapsed ? "justify-center" : "justify-between")}>
        <Link href="/dashboard" className="flex items-center overflow-hidden">
          {collapsed ? (
            <Image src="/assets/naharalogonew.png" alt="Nahara" width={36} height={36} className="h-8 w-8 object-contain object-left" priority />
          ) : (
            <Image src="/assets/naharalogonew.png" alt="Nahara" width={120} height={36} className="h-9 w-auto object-contain" priority />
          )}
        </Link>
        {!collapsed && (
          <button
            type="button"
            onClick={() => setCollapsed(true)}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
            aria-label="Collapse sidebar"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}
      </div>
      {collapsed && (
        <div className="flex justify-center border-b border-slate-200 py-2">
          <button
            type="button"
            onClick={() => setCollapsed(false)}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
            aria-label="Expand sidebar"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}

      <nav className="flex-1 space-y-1 px-3 py-4">
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
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                active
                  ? "nav-active"
                  : "border-l-2 border-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                collapsed && "justify-center px-2"
              )}
              title={collapsed ? item.label : undefined}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="space-y-1 border-t border-slate-200 p-3">
        {isAdmin && (
          <Link
            href="/activities"
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900",
              collapsed && "justify-center px-2"
            )}
            title={collapsed ? "Kelola Kegiatan" : undefined}
          >
            <Settings className="h-5 w-5 shrink-0" />
            {!collapsed && <span>Kelola Kegiatan</span>}
          </Link>
        )}
        {isAdmin ? (
          <button
            type="button"
            onClick={handleLogout}
            className={cn(
              "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900",
              collapsed && "justify-center px-2"
            )}
            title={collapsed ? "Keluar" : undefined}
          >
            <LogOut className="h-5 w-5 shrink-0" />
            {!collapsed && <span>Keluar</span>}
          </button>
        ) : (
          <Link
            href="/login"
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gold-dark transition-colors hover:bg-gold/10",
              collapsed && "justify-center px-2"
            )}
            title={collapsed ? "Masuk Admin" : undefined}
          >
            <LogIn className="h-5 w-5 shrink-0" />
            {!collapsed && <span>Masuk Admin</span>}
          </Link>
        )}
      </div>
    </aside>
  );
}
