"use client";

import Link from "next/link";
import { useAuth } from "@/lib/hooks/useAuth";
import { LogIn } from "lucide-react";

type AdminOnlyProps = {
  children: React.ReactNode;
  fallback?: React.ReactNode;
};

export function AdminOnly({ children, fallback }: AdminOnlyProps) {
  const { isAdmin, loading } = useAuth();

  if (loading) return null;
  if (!isAdmin) return fallback ?? null;
  return <>{children}</>;
}

export function AdminLoginPrompt({ message = "Login admin untuk mengedit" }: { message?: string }) {
  return (
    <Link
      href="/login"
      className="inline-flex items-center gap-1.5 rounded-lg border border-gold/30 bg-gold/10 px-3 py-1.5 text-xs font-medium text-gold-dark transition-colors hover:bg-gold/20"
    >
      <LogIn className="h-3.5 w-3.5" />
      {message}
    </Link>
  );
}
