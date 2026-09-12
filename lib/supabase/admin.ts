import { createClient } from "@supabase/supabase-js";

/**
 * Service-role client for trusted server jobs (cron).
 * Never import this from client components.
 *
 * Accepts classic `SUPABASE_SERVICE_ROLE_KEY` or newer Supabase
 * dashboard name `SUPABASE_SECRET_KEY`.
 */
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    process.env.SUPABASE_SECRET_KEY?.trim();
  if (!url || !key) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY / SUPABASE_SECRET_KEY (atau URL) belum dikonfigurasi"
    );
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
