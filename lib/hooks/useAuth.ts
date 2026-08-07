"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { isPortalAdmin } from "@/lib/auth/roles";
import type { User } from "@supabase/supabase-js";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isSecurity, setIsSecurity] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    async function syncUser(u: User | null) {
      setUser(u);
      if (!u?.email) {
        setIsSecurity(false);
        setLoading(false);
        return;
      }
      const { data } = await supabase
        .from("security_users")
        .select("id")
        .ilike("email", u.email)
        .maybeSingle();
      if (!cancelled) {
        setIsSecurity(!!data);
        setLoading(false);
      }
    }

    supabase.auth.getUser().then(({ data: { user: u } }) => {
      syncUser(u);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      syncUser(session?.user ?? null);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  return {
    user,
    isAdmin: isPortalAdmin(user),
    isSecurity,
    loading,
  };
}
