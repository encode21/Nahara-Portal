-- Nahara Portal — Emergency incidents (Darurat)
-- Resident reports + optional evidence photo; ops can manage status

CREATE TABLE IF NOT EXISTS emergency_incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kode TEXT,
  kind TEXT NOT NULL
    CHECK (kind IN ('kebakaran', 'medis', 'keamanan', 'bencana', 'lainnya')),
  status TEXT NOT NULL DEFAULT 'Dilaporkan'
    CHECK (
      status IN (
        'Dilaporkan',
        'Diterima',
        'Menuju Lokasi',
        'Bantuan Dihubungi',
        'Terkendali',
        'Selesai'
      )
    ),
  warga_id UUID REFERENCES warga(id) ON DELETE SET NULL,
  reporter_nama TEXT NOT NULL,
  reporter_blok TEXT NOT NULL,
  note TEXT,
  foto_url TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT emergency_reporter_nama_len CHECK (char_length(trim(reporter_nama)) >= 2),
  CONSTRAINT emergency_reporter_blok_len CHECK (char_length(trim(reporter_blok)) >= 2),
  CONSTRAINT emergency_note_len CHECK (note IS NULL OR char_length(note) <= 500)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_emergency_incidents_kode
  ON emergency_incidents (kode)
  WHERE kode IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_emergency_incidents_status_created
  ON emergency_incidents (status, created_at DESC);

CREATE OR REPLACE FUNCTION public.generate_emergency_kode()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  day_key TEXT;
  seq INT;
BEGIN
  IF NEW.kode IS NOT NULL AND NEW.kode <> '' THEN
    RETURN NEW;
  END IF;

  day_key := to_char(
    (COALESCE(NEW.created_at, now()) AT TIME ZONE 'Asia/Jakarta'),
    'YYMMDD'
  );

  SELECT COUNT(*)::INT + 1
  INTO seq
  FROM emergency_incidents
  WHERE kode LIKE 'EM' || day_key || '-%';

  NEW.kode := 'EM' || day_key || '-' || lpad(seq::text, 3, '0');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_emergency_kode ON emergency_incidents;
CREATE TRIGGER trg_emergency_kode
  BEFORE INSERT ON emergency_incidents
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_emergency_kode();

CREATE OR REPLACE FUNCTION public.set_emergency_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_emergency_updated_at ON emergency_incidents;
CREATE TRIGGER trg_emergency_updated_at
  BEFORE UPDATE ON emergency_incidents
  FOR EACH ROW
  EXECUTE FUNCTION public.set_emergency_updated_at();

ALTER TABLE emergency_incidents ENABLE ROW LEVEL SECURITY;

-- Residents / public may create incidents (portal uses warga identity, often without JWT)
DROP POLICY IF EXISTS "public_submit_emergency" ON emergency_incidents;
CREATE POLICY "public_submit_emergency"
  ON emergency_incidents FOR INSERT TO anon, authenticated
  WITH CHECK (
    status = 'Dilaporkan'
    AND char_length(trim(reporter_nama)) >= 2
    AND char_length(trim(reporter_blok)) >= 2
  );

-- Anyone with the link/id can read a single report (status follow-up)
DROP POLICY IF EXISTS "public_read_emergency" ON emergency_incidents;
CREATE POLICY "public_read_emergency"
  ON emergency_incidents FOR SELECT TO anon, authenticated
  USING (true);

-- Ops (admin/estate/rtrw) + full admin may update status
DROP POLICY IF EXISTS "ops_update_emergency" ON emergency_incidents;
CREATE POLICY "ops_update_emergency"
  ON emergency_incidents FOR UPDATE TO authenticated
  USING (public.is_portal_ops() OR public.is_portal_admin())
  WITH CHECK (public.is_portal_ops() OR public.is_portal_admin());

DROP POLICY IF EXISTS "admin_all_emergency" ON emergency_incidents;
CREATE POLICY "admin_all_emergency"
  ON emergency_incidents FOR ALL TO authenticated
  USING (public.is_portal_admin())
  WITH CHECK (public.is_portal_admin());

-- Storage: allow darurat/ evidence uploads (same pattern as pengaduan)
DROP POLICY IF EXISTS "anon_upload_pengaduan_agustusan" ON storage.objects;
CREATE POLICY "anon_upload_pengaduan_agustusan"
  ON storage.objects FOR INSERT
  TO anon
  WITH CHECK (
    bucket_id = 'nahara-uploads'
    AND (
      name LIKE 'pengaduan/%'
      OR name LIKE 'agustusan/%'
      OR name LIKE 'darurat/%'
    )
  );

DROP POLICY IF EXISTS "auth_upload_pengaduan_agustusan" ON storage.objects;
CREATE POLICY "auth_upload_pengaduan_agustusan"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'nahara-uploads'
    AND NOT public.is_portal_admin()
    AND (
      name LIKE 'pengaduan/%'
      OR name LIKE 'agustusan/%'
      OR name LIKE 'darurat/%'
    )
  );

DROP POLICY IF EXISTS "admin_upload_nahara_uploads" ON storage.objects;
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
      OR name LIKE 'darurat/%'
    )
  );
