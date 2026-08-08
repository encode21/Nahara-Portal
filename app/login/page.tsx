"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  isPortalAdmin,
  isPortalStaff,
  resolveOpsPostLoginRedirect,
} from "@/lib/auth/roles";
import { buildPortalUrl } from "@/lib/host";
import { LoadingSpinner } from "@/components/ui/Loading";
import { NaharaLogo } from "@/components/layout/NaharaLogo";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get("redirect");
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !data.user) {
      setLoading(false);
      setError("Email atau password salah.");
      return;
    }

    let next = resolveOpsPostLoginRedirect(data.user, redirectParam);

    // Petugas keamanan (tanpa role admin/staff) langsung ke notifikasi
    if (!isPortalAdmin(data.user) && !isPortalStaff(data.user) && data.user.email) {
      const { data: securityUser } = await supabase
        .from("security_users")
        .select("id")
        .ilike("email", data.user.email)
        .maybeSingle();
      if (securityUser && !redirectParam) {
        next = "/info-security?tab=notifikasi";
      }
    }

    setLoading(false);
    router.push(next);
    router.refresh();
  }

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <div className="border-b border-gold/15 px-4 py-4">
        <NaharaLogo className="h-14 lg:h-16" />
      </div>
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <h1 className="font-display text-2xl font-bold text-slate-900">
              Masuk Pengurus
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Admin, Estate, RT/RW, atau Petugas Keamanan
            </p>
          </div>

          <form onSubmit={handleSubmit} className="glass-card space-y-4">
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="label">
                Email
              </label>
              <input
                id="email"
                type="email"
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="pengurus@example.com"
                required
                autoComplete="username"
              />
            </div>

            <div>
              <label htmlFor="password" className="label">
                Password
              </label>
              <input
                id="password"
                type="password"
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
            </div>

            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <LoadingSpinner />
                  Masuk...
                </span>
              ) : (
                "Masuk"
              )}
            </button>
          </form>

          <p className="mt-4 text-center text-sm text-slate-500">
            <a
              href={buildPortalUrl("/dashboard")}
              className="text-gold-dark hover:underline"
            >
              Ke Portal Warga
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-white">
          <LoadingSpinner className="h-8 w-8" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
