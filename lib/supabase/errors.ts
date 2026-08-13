import type { PostgrestError } from "@supabase/supabase-js";

export function getSupabaseErrorMessage(error: PostgrestError | null): string | null {
  if (!error) return null;
  if (error.code === "42501") {
    return "Akses ditolak. Pastikan sudah login admin dan RLS policy sudah dijalankan di Supabase.";
  }
  if (error.code === "42P01") {
    return "Tabel belum ada. Jalankan migration SQL di Supabase terlebih dahulu.";
  }
  const msg = error.message ?? "";
  // Postgres RAISE EXCEPTION via RPC often prefixes with context; surface clean text.
  const raised = msg.match(/Rumah .+|Silakan upload|Anda harus|Data ini sudah|Blok tidak|Peran peserta|Nama peserta|Nomor|Edisi|Pendaftaran|Hadiah|Kuota|Tidak ada peserta|Tidak ada rumah|Hanya admin|URL Twibbon|Kode pendaftaran|Race tidak|Race sudah/i);
  if (raised) {
    const idx = msg.search(/Rumah .+|Silakan upload|Anda harus|Data ini sudah|Blok tidak|Peran peserta|Nama peserta|Nomor|Edisi|Pendaftaran|Hadiah|Kuota|Tidak ada peserta|Tidak ada rumah|Hanya admin|URL Twibbon|Kode pendaftaran|Race tidak|Race sudah/i);
    if (idx >= 0) return msg.slice(idx).replace(/\s+/g, " ").trim();
  }
  return msg;
}
