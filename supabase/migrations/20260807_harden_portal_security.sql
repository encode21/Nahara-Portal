-- Nahara Portal — Harden RLS: admin JWT role, public INSERT checks, storage folders
-- Admin claim: auth.jwt() -> app_metadata ->> role = 'admin'

CREATE OR REPLACE FUNCTION public.is_portal_admin()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT coalesce(
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin',
    false
  );
$$;

REVOKE ALL ON FUNCTION public.is_portal_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_portal_admin() TO anon, authenticated;

-- ========== Core tables: admin_all_* → is_portal_admin() ==========

DROP POLICY IF EXISTS "admin_all_warga" ON warga;
CREATE POLICY "admin_all_warga"
  ON warga FOR ALL TO authenticated
  USING (public.is_portal_admin()) WITH CHECK (public.is_portal_admin());

DROP POLICY IF EXISTS "admin_all_iuran" ON iuran;
CREATE POLICY "admin_all_iuran"
  ON iuran FOR ALL TO authenticated
  USING (public.is_portal_admin()) WITH CHECK (public.is_portal_admin());

DROP POLICY IF EXISTS "admin_all_pengaduan" ON pengaduan;
CREATE POLICY "admin_all_pengaduan"
  ON pengaduan FOR ALL TO authenticated
  USING (public.is_portal_admin()) WITH CHECK (public.is_portal_admin());

DROP POLICY IF EXISTS "admin_all_donasi" ON donasi_campaign;
CREATE POLICY "admin_all_donasi"
  ON donasi_campaign FOR ALL TO authenticated
  USING (public.is_portal_admin()) WITH CHECK (public.is_portal_admin());

DROP POLICY IF EXISTS "admin_all_pengumuman" ON pengumuman;
CREATE POLICY "admin_all_pengumuman"
  ON pengumuman FOR ALL TO authenticated
  USING (public.is_portal_admin()) WITH CHECK (public.is_portal_admin());

DROP POLICY IF EXISTS "admin_all_cctv" ON cctv_cameras;
CREATE POLICY "admin_all_cctv"
  ON cctv_cameras FOR ALL TO authenticated
  USING (public.is_portal_admin()) WITH CHECK (public.is_portal_admin());

DROP POLICY IF EXISTS "admin_all_kas" ON kas_entries;
DROP POLICY IF EXISTS "admin_all_kas_entries" ON kas_entries;
CREATE POLICY "admin_all_kas_entries"
  ON kas_entries FOR ALL TO authenticated
  USING (public.is_portal_admin()) WITH CHECK (public.is_portal_admin());

DROP POLICY IF EXISTS "admin_all_activities" ON activities;
CREATE POLICY "admin_all_activities"
  ON activities FOR ALL TO authenticated
  USING (public.is_portal_admin()) WITH CHECK (public.is_portal_admin());

DROP POLICY IF EXISTS "admin_all_participants" ON participants;
CREATE POLICY "admin_all_participants"
  ON participants FOR ALL TO authenticated
  USING (public.is_portal_admin()) WITH CHECK (public.is_portal_admin());

-- ========== Security module admin policies ==========

DROP POLICY IF EXISTS "admin_all_security_staff" ON security_staff;
CREATE POLICY "admin_all_security_staff"
  ON security_staff FOR ALL TO authenticated
  USING (public.is_portal_admin()) WITH CHECK (public.is_portal_admin());

DROP POLICY IF EXISTS "admin_all_security_users" ON security_users;
CREATE POLICY "admin_all_security_users"
  ON security_users FOR ALL TO authenticated
  USING (public.is_portal_admin()) WITH CHECK (public.is_portal_admin());

DROP POLICY IF EXISTS "admin_all_security_notifications" ON security_notifications;
CREATE POLICY "admin_all_security_notifications"
  ON security_notifications FOR ALL TO authenticated
  USING (public.is_portal_admin()) WITH CHECK (public.is_portal_admin());

-- ========== Event / Agustusan admin policies ==========

DROP POLICY IF EXISTS "admin_all_event_editions" ON event_editions;
CREATE POLICY "admin_all_event_editions"
  ON event_editions FOR ALL TO authenticated
  USING (public.is_portal_admin()) WITH CHECK (public.is_portal_admin());

DROP POLICY IF EXISTS "admin_all_event_contests" ON event_contests;
CREATE POLICY "admin_all_event_contests"
  ON event_contests FOR ALL TO authenticated
  USING (public.is_portal_admin()) WITH CHECK (public.is_portal_admin());

DROP POLICY IF EXISTS "admin_all_event_contest_entries" ON event_contest_entries;
CREATE POLICY "admin_all_event_contest_entries"
  ON event_contest_entries FOR ALL TO authenticated
  USING (public.is_portal_admin()) WITH CHECK (public.is_portal_admin());

DROP POLICY IF EXISTS "admin_all_event_contest_results" ON event_contest_results;
CREATE POLICY "admin_all_event_contest_results"
  ON event_contest_results FOR ALL TO authenticated
  USING (public.is_portal_admin()) WITH CHECK (public.is_portal_admin());

DROP POLICY IF EXISTS "admin_all_event_gallery_items" ON event_gallery_items;
CREATE POLICY "admin_all_event_gallery_items"
  ON event_gallery_items FOR ALL TO authenticated
  USING (public.is_portal_admin()) WITH CHECK (public.is_portal_admin());

-- Unpublished gallery: admin only (published stays public)
DROP POLICY IF EXISTS "public_read_event_gallery_items" ON event_gallery_items;
CREATE POLICY "public_read_event_gallery_items"
  ON event_gallery_items FOR SELECT TO anon, authenticated
  USING (is_published = true OR public.is_portal_admin());

-- ========== Tighten public INSERTs ==========

DROP POLICY IF EXISTS "public_submit_pengaduan" ON pengaduan;
CREATE POLICY "public_submit_pengaduan"
  ON pengaduan FOR INSERT TO anon, authenticated
  WITH CHECK (status = 'Baru');

DROP POLICY IF EXISTS "public_register_participants" ON participants;
CREATE POLICY "public_register_participants"
  ON participants FOR INSERT TO anon, authenticated
  WITH CHECK (
    payment_status = false
    AND attendance_status = false
  );

DROP POLICY IF EXISTS "public_insert_event_gallery_items" ON event_gallery_items;
CREATE POLICY "public_insert_event_gallery_items"
  ON event_gallery_items FOR INSERT TO anon, authenticated
  WITH CHECK (
    image_url LIKE '%/storage/v1/object/public/nahara-uploads/agustusan/%'
    AND char_length(coalesce(caption, '')) <= 200
  );

-- ========== Storage: folder-scoped INSERT, admin-only mutate ==========

DO $$
DECLARE pol record;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname LIKE '%nahara_uploads%'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "public_read_nahara_uploads"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'nahara-uploads');

CREATE POLICY "anon_upload_pengaduan_agustusan"
  ON storage.objects FOR INSERT
  TO anon
  WITH CHECK (
    bucket_id = 'nahara-uploads'
    AND (
      name LIKE 'pengaduan/%'
      OR name LIKE 'agustusan/%'
    )
  );

CREATE POLICY "admin_upload_nahara_uploads"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'nahara-uploads'
    AND public.is_portal_admin()
    AND (
      name LIKE 'pengaduan/%'
      OR name LIKE 'agustusan/%'
      OR name LIKE 'kegiatan/%'
      OR name LIKE 'pengumuman/%'
    )
  );

-- Authenticated non-admin may still contribute public folders (pengaduan/twibbon)
CREATE POLICY "auth_upload_pengaduan_agustusan"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'nahara-uploads'
    AND NOT public.is_portal_admin()
    AND (
      name LIKE 'pengaduan/%'
      OR name LIKE 'agustusan/%'
    )
  );

CREATE POLICY "admin_update_nahara_uploads"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'nahara-uploads' AND public.is_portal_admin())
  WITH CHECK (bucket_id = 'nahara-uploads' AND public.is_portal_admin());

CREATE POLICY "admin_delete_nahara_uploads"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'nahara-uploads' AND public.is_portal_admin());
