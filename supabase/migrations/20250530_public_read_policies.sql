-- Run this in Supabase SQL Editor if tables already exist
-- Adds public read access for the community portal

CREATE POLICY "Public can read warga"
  ON warga FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Public can read iuran"
  ON iuran FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Public can read pengaduan list"
  ON pengaduan FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Public can read pengumuman"
  ON pengumuman FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Public can read cctv"
  ON cctv_cameras FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Public can read kas"
  ON kas_entries FOR SELECT TO anon, authenticated USING (true);
