-- Public forms harden + admin moderation
-- Fixes: gallery INSERT regression, kode spoofing, length limits,
-- contest close/max, unpublished results leak, comment admin ops

-- ========== Force auto kode (ignore client spoof) ==========
CREATE OR REPLACE FUNCTION public.generate_pengaduan_kode()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  day_key TEXT;
  seq INT;
BEGIN
  day_key := to_char(
    (COALESCE(NEW.created_at, now()) AT TIME ZONE 'Asia/Jakarta'),
    'YYMMDD'
  );

  SELECT COUNT(*)::INT + 1
  INTO seq
  FROM pengaduan
  WHERE kode LIKE 'NH' || day_key || '-%';

  -- Always overwrite client-supplied kode
  NEW.kode := 'NH' || day_key || '-' || lpad(seq::text, 3, '0');
  RETURN NEW;
END;
$$;

-- ========== Pengaduan public INSERT harden ==========
ALTER TABLE pengaduan DROP CONSTRAINT IF EXISTS pengaduan_nama_len;
ALTER TABLE pengaduan
  ADD CONSTRAINT pengaduan_nama_len
  CHECK (char_length(trim(nama)) BETWEEN 2 AND 80);

ALTER TABLE pengaduan DROP CONSTRAINT IF EXISTS pengaduan_deskripsi_len;
ALTER TABLE pengaduan
  ADD CONSTRAINT pengaduan_deskripsi_len
  CHECK (char_length(trim(deskripsi)) BETWEEN 3 AND 4000);

ALTER TABLE pengaduan DROP CONSTRAINT IF EXISTS pengaduan_blok_len;
ALTER TABLE pengaduan
  ADD CONSTRAINT pengaduan_blok_len
  CHECK (blok IS NULL OR char_length(blok) <= 40);

DROP POLICY IF EXISTS "public_submit_pengaduan" ON pengaduan;
CREATE POLICY "public_submit_pengaduan"
  ON pengaduan FOR INSERT TO anon, authenticated
  WITH CHECK (
    status = 'Baru'
    AND char_length(trim(nama)) BETWEEN 2 AND 80
    AND char_length(trim(deskripsi)) BETWEEN 3 AND 4000
    AND (blok IS NULL OR char_length(blok) <= 40)
    AND (
      foto_url IS NULL
      OR foto_url LIKE '%/storage/v1/object/public/nahara-uploads/pengaduan/%'
    )
  );

-- ========== Komentar length + admin manage ==========
ALTER TABLE pengaduan_komentar DROP CONSTRAINT IF EXISTS pengaduan_komentar_nama_len;
ALTER TABLE pengaduan_komentar
  ADD CONSTRAINT pengaduan_komentar_nama_len
  CHECK (char_length(trim(nama)) BETWEEN 2 AND 80);

ALTER TABLE pengaduan_komentar DROP CONSTRAINT IF EXISTS pengaduan_komentar_pesan_len;
ALTER TABLE pengaduan_komentar
  ADD CONSTRAINT pengaduan_komentar_pesan_len
  CHECK (char_length(trim(pesan)) BETWEEN 1 AND 2000);

DROP POLICY IF EXISTS "public_insert_pengaduan_komentar" ON pengaduan_komentar;
CREATE POLICY "public_insert_pengaduan_komentar"
  ON pengaduan_komentar FOR INSERT TO anon, authenticated
  WITH CHECK (
    is_pengurus = false
    AND char_length(trim(nama)) BETWEEN 2 AND 80
    AND char_length(trim(pesan)) BETWEEN 1 AND 2000
  );

DROP POLICY IF EXISTS "ops_insert_pengaduan_komentar" ON pengaduan_komentar;
CREATE POLICY "ops_insert_pengaduan_komentar"
  ON pengaduan_komentar FOR INSERT TO authenticated
  WITH CHECK (
    public.is_portal_ops()
    AND is_pengurus = true
    AND char_length(trim(nama)) BETWEEN 2 AND 80
    AND char_length(trim(pesan)) BETWEEN 1 AND 2000
  );

DROP POLICY IF EXISTS "admin_all_pengaduan_komentar" ON pengaduan_komentar;
CREATE POLICY "admin_all_pengaduan_komentar"
  ON pengaduan_komentar FOR ALL TO authenticated
  USING (public.is_portal_admin())
  WITH CHECK (public.is_portal_admin());

-- ========== Participants: future activity + capacity ==========
DROP POLICY IF EXISTS "public_register_participants" ON participants;
CREATE POLICY "public_register_participants"
  ON participants FOR INSERT TO anon, authenticated
  WITH CHECK (
    payment_status = false
    AND attendance_status = false
    AND char_length(trim(name)) BETWEEN 2 AND 80
    AND (phone IS NULL OR char_length(phone) <= 30)
    AND (block_number IS NULL OR char_length(block_number) <= 40)
    AND EXISTS (
      SELECT 1 FROM activities a
      WHERE a.id = activity_id
        AND a.date >= now()
        AND (
          a.max_participants IS NULL
          OR (
            SELECT COUNT(*) FROM participants p
            WHERE p.activity_id = a.id
          ) < a.max_participants
        )
    )
  );

-- ========== Contest entries: close date + max_entries ==========
DROP POLICY IF EXISTS "public_insert_event_contest_entries" ON event_contest_entries;
CREATE POLICY "public_insert_event_contest_entries"
  ON event_contest_entries FOR INSERT TO anon, authenticated
  WITH CHECK (
    status = 'registered'
    AND char_length(trim(display_name)) BETWEEN 2 AND 80
    AND (phone IS NULL OR char_length(phone) <= 30)
    AND (notes IS NULL OR char_length(notes) <= 500)
    AND EXISTS (
      SELECT 1
      FROM event_contests c
      JOIN event_editions e ON e.id = c.edition_id
      WHERE c.id = contest_id
        AND c.registration_open = true
        AND c.is_competition = true
        AND (
          e.registration_closes_at IS NULL
          OR e.registration_closes_at > now()
        )
        AND (
          c.max_entries IS NULL
          OR (
            SELECT COUNT(*) FROM event_contest_entries x
            WHERE x.contest_id = c.id
          ) < c.max_entries
        )
    )
  );

-- ========== Gallery INSERT re-harden ==========
DROP POLICY IF EXISTS "public_insert_event_gallery_items" ON event_gallery_items;
CREATE POLICY "public_insert_event_gallery_items"
  ON event_gallery_items FOR INSERT TO anon, authenticated
  WITH CHECK (
    image_url LIKE '%/storage/v1/object/public/nahara-uploads/agustusan/%'
    AND char_length(coalesce(caption, '')) <= 200
    AND category = 'twibbon'
    AND is_published = true
  );

-- ========== Contest results: published only (or admin) ==========
DROP POLICY IF EXISTS "public_read_event_contest_results" ON event_contest_results;
CREATE POLICY "public_read_event_contest_results"
  ON event_contest_results FOR SELECT TO anon, authenticated
  USING (published = true OR public.is_portal_admin());
