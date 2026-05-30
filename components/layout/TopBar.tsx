"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { User, LogIn } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function TopBar() {
  const [userName, setUserName] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>("");

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserEmail(user.email ?? "");
        setUserName(user.user_metadata?.full_name ?? user.email?.split("@")[0] ?? "Admin");
      } else {
        setUserName(null);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user;
      if (user) {
        setUserEmail(user.email ?? "");
        setUserName(user.user_metadata?.full_name ?? user.email?.split("@")[0] ?? "Admin");
      } else {
        setUserName(null);
        setUserEmail("");
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 lg:px-8">
      <div className="lg:hidden">
        <span className="font-display text-lg font-bold text-slate-900">Nahara</span>
      </div>

      <div className="hidden lg:block">
        <p className="text-sm text-slate-500">Cluster Nahara, Cimanggis Golf Estate</p>
      </div>

      <div className="flex items-center gap-3">
        {userName ? (
          <div className="flex items-center gap-2.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gold/15">
              <User className="h-4 w-4 text-gold-dark" />
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-medium text-slate-800">{userName}</p>
              {userEmail && <p className="text-xs text-slate-500">{userEmail}</p>}
            </div>
          </div>
        ) : (
          <Link href="/login" className="btn-primary py-2 text-xs">
            <LogIn className="mr-1.5 h-3.5 w-3.5" />
            Masuk Admin
          </Link>
        )}
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500">
      © 2025 Nahara Komunitas. All rights reserved.
    </footer>
  );
}
