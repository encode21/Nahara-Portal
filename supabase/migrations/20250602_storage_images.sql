-- Nahara Portal — Upload gambar via Supabase Storage
-- Kolom image + bucket publik nahara-uploads

ALTER TABLE activities
  ADD COLUMN IF NOT EXISTS image_url text;

ALTER TABLE pengumuman
  ADD COLUMN IF NOT EXISTS image_url text;

-- pengaduan.foto_url sudah ada di schema awal

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'nahara-uploads',
  'nahara-uploads',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Hapus policy lama bucket ini (aman di-run ulang)
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

CREATE POLICY "public_upload_nahara_uploads"
  ON storage.objects FOR INSERT
  TO anon, authenticated
  WITH CHECK (bucket_id = 'nahara-uploads');

CREATE POLICY "auth_update_nahara_uploads"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'nahara-uploads')
  WITH CHECK (bucket_id = 'nahara-uploads');

CREATE POLICY "auth_delete_nahara_uploads"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'nahara-uploads');
