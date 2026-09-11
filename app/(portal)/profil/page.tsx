"use client";

import Link from "next/link";
import { LogIn, UserRound } from "lucide-react";
import { useWargaIdentity } from "@/lib/hooks/useWargaIdentity";
import { useAuth } from "@/lib/hooks/useAuth";
import { buildOpsUrl } from "@/lib/host";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function ProfilPage() {
  const { identity, ready, change } = useWargaIdentity();
  const { user, isAdmin, isSecurity, loading } = useAuth();
  const router = useRouter();
  const opsLogin = buildOpsUrl("/login");

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold-dark">
          Akun
        </p>
        <h1 className="mt-1 font-display text-2xl font-bold text-ink">Profil</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Identitas rumah tangga dan akses akun pengurus.
        </p>
      </header>

      <section className="glass-card space-y-4">
        <div className="flex items-center gap-3">
          <span className="icon-badge">
            <UserRound className="h-5 w-5" />
          </span>
          <div>
            <h2 className="font-display text-lg font-semibold text-ink">
              Identitas warga
            </h2>
            <p className="text-xs text-ink-faint">
              Digunakan untuk konteks lokal di perangkat ini
            </p>
          </div>
        </div>

        {!ready ? (
          <div className="h-16 animate-pulse rounded-xl bg-sand-100" />
        ) : identity ? (
          <div className="rounded-xl border border-sand-200 bg-sand-50 px-4 py-3">
            <p className="text-sm font-semibold text-ink">{identity.nama}</p>
            <p className="mt-0.5 text-sm text-ink-soft">{identity.blok}</p>
          </div>
        ) : (
          <p className="text-sm text-ink-soft">
            Belum ada identitas rumah tangga di perangkat ini.
          </p>
        )}

        <button type="button" onClick={change} className="btn-secondary w-full">
          {identity ? "Ganti identitas" : "Pilih rumah tangga"}
        </button>
      </section>

      <section className="glass-card space-y-3">
        <h2 className="font-display text-lg font-semibold text-ink">
          Akun pengurus / security
        </h2>
        {loading ? (
          <div className="h-12 animate-pulse rounded-xl bg-sand-100" />
        ) : user ? (
          <>
            <div className="rounded-xl border border-sand-200 bg-sand-50 px-4 py-3">
              <p className="text-sm font-semibold text-ink">
                {user.user_metadata?.full_name ?? user.email?.split("@")[0]}
              </p>
              <p className="mt-0.5 text-xs text-ink-soft">{user.email}</p>
              {(isAdmin || isSecurity) && (
                <p className="mt-1 text-[11px] font-medium uppercase tracking-wide text-gold-dark">
                  {isAdmin ? "Admin" : "Security"}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="btn-danger w-full"
            >
              Keluar
            </button>
          </>
        ) : (
          <div className="rounded-xl border border-dashed border-sand-200 bg-sand-50 px-4 py-3 text-sm text-ink-soft">
            <p>Portal warga tidak memerlukan login pengurus.</p>
            <a
              href={opsLogin}
              className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-gold-dark hover:underline"
            >
              <LogIn className="h-3.5 w-3.5" />
              Pengurus: buka ops.nahara.id
            </a>
          </div>
        )}
      </section>

      <p className="text-center text-xs text-ink-faint">
        Butuh bantuan?{" "}
        <Link href="/panduan" className="text-gold-dark underline">
          Panduan penggunaan
        </Link>
      </p>
    </div>
  );
}
