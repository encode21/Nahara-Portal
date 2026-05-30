-- Nahara Portal — Fix RLS policies untuk CRUD admin
-- Jalankan di Supabase SQL Editor SETELAH tabel dibuat
-- Aman di-run ulang (drop policy dulu)

DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN
    SELECT policyname, tablename
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN (
        'warga', 'iuran', 'pengaduan', 'donasi_campaign',
        'pengumuman', 'cctv_cameras', 'kas_entries',
        'activities', 'participants'
      )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, pol.tablename);
  END LOOP;
END $$;

-- ========== PUBLIC READ ==========
CREATE POLICY "public_read_warga"
  ON warga FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "public_read_iuran"
  ON iuran FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "public_read_pengaduan"
  ON pengaduan FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "public_read_donasi"
  ON donasi_campaign FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "public_read_pengumuman"
  ON pengumuman FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "public_read_cctv"
  ON cctv_cameras FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "public_read_kas"
  ON kas_entries FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "public_read_activities"
  ON activities FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "public_read_participants"
  ON participants FOR SELECT TO anon, authenticated USING (true);

-- ========== PUBLIC INSERT (tanpa login) ==========
CREATE POLICY "public_submit_pengaduan"
  ON pengaduan FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "public_register_participants"
  ON participants FOR INSERT TO anon, authenticated WITH CHECK (true);

-- ========== ADMIN (authenticated) FULL CRUD ==========
-- Penting: pakai WITH CHECK agar INSERT/UPDATE tidak ditolak RLS

CREATE POLICY "admin_all_warga"
  ON warga FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "admin_all_iuran"
  ON iuran FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "admin_all_pengaduan"
  ON pengaduan FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "admin_all_donasi"
  ON donasi_campaign FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "admin_all_pengumuman"
  ON pengumuman FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "admin_all_cctv"
  ON cctv_cameras FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "admin_all_kas"
  ON kas_entries FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "admin_all_activities"
  ON activities FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "admin_all_participants"
  ON participants FOR ALL TO authenticated
  USING (true) WITH CHECK (true);
