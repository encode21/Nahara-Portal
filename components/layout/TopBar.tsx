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
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-sand-200 bg-white/90 px-4 backdrop-blur lg:px-8">
      <div className="lg:hidden">
        <span className="font-display text-lg font-bold tracking-[0.18em] text-ink">Nahara</span>
      </div>

      <div className="hidden lg:block">
        <p className="text-sm text-ink-soft">Cluster Nahara, Cimanggis Golf Estate</p>
      </div>

      <div className="flex items-center gap-3">
        {userName ? (
          <div className="flex items-center gap-2.5 rounded-full border border-sand-200 bg-sand-100 px-3 py-1.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gold-light">
              <User className="h-4 w-4 text-gold-dark" />
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-medium text-ink">{userName}</p>
              {userEmail && <p className="text-xs text-ink-soft">{userEmail}</p>}
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
    <footer className="border-t border-sand-200 bg-white py-5 text-center text-xs text-ink-faint">
      © 2025 Nahara Paguyuban. All rights reserved.
    </footer>
  );
}
