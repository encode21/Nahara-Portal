-- Fix: kas_entries ada di DB tapi portal (role anon) tidak bisa baca → Keuangan Rp 0
-- Jalankan di Supabase SQL Editor

ALTER TABLE kas_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_kas" ON kas_entries;
DROP POLICY IF EXISTS "Public can read kas_entries" ON kas_entries;
DROP POLICY IF EXISTS "public_read_kas_entries" ON kas_entries;

CREATE POLICY "public_read_kas_entries"
  ON kas_entries FOR SELECT
  TO anon, authenticated
  USING (true);

-- Pastikan admin tetap bisa CRUD
DROP POLICY IF EXISTS "admin_all_kas" ON kas_entries;
DROP POLICY IF EXISTS "Authenticated full access kas_entries" ON kas_entries;

CREATE POLICY "admin_all_kas_entries"
  ON kas_entries FOR ALL
  TO authenticated
  USING (true) WITH CHECK (true);

-- Cek cepat (harus > 0):
-- SELECT COUNT(*) FROM kas_entries;
