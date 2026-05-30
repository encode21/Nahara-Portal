import type { PostgrestError } from "@supabase/supabase-js";

export function getSupabaseErrorMessage(error: PostgrestError | null): string | null {
  if (!error) return null;
  if (error.code === "42501") {
    return "Akses ditolak. Pastikan sudah login admin dan RLS policy sudah dijalankan di Supabase.";
  }
  if (error.code === "42P01") {
    return "Tabel belum ada. Jalankan migration SQL di Supabase terlebih dahulu.";
  }
  return error.message;
}
