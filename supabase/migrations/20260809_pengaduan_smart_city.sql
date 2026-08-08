-- Nahara Portal — Pengaduan Smart City
-- Status Ditolak, kode laporan, thread komentar, RLS ops update

-- ========== Helper: admin | estate | rtrw ==========
CREATE OR REPLACE FUNCTION public.is_portal_ops()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT coalesce(
    (auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin', 'estate', 'rtrw'),
    false
  );
$$;

REVOKE ALL ON FUNCTION public.is_portal_ops() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_portal_ops() TO anon, authenticated;

-- ========== Status: add Ditolak ==========
ALTER TABLE pengaduan DROP CONSTRAINT IF EXISTS pengaduan_status_check;
ALTER TABLE pengaduan
  ADD CONSTRAINT pengaduan_status_check
  CHECK (status IN ('Baru', 'Diproses', 'Selesai', 'Ditolak'));

-- ========== Kode laporan ==========
ALTER TABLE pengaduan ADD COLUMN IF NOT EXISTS kode TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_pengaduan_kode
  ON pengaduan (kode)
  WHERE kode IS NOT NULL;

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
  IF NEW.kode IS NOT NULL AND NEW.kode <> '' THEN
    RETURN NEW;
  END IF;

  day_key := to_char(
    (COALESCE(NEW.created_at, now()) AT TIME ZONE 'Asia/Jakarta'),
    'YYMMDD'
  );

  SELECT COUNT(*)::INT + 1
  INTO seq
  FROM pengaduan
  WHERE kode LIKE 'NH' || day_key || '-%';

  NEW.kode := 'NH' || day_key || '-' || lpad(seq::text, 3, '0');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_pengaduan_kode ON pengaduan;
CREATE TRIGGER trg_pengaduan_kode
  BEFORE INSERT ON pengaduan
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_pengaduan_kode();

-- Backfill existing rows without kode
WITH numbered AS (
  SELECT
    id,
    'NH' || to_char(created_at AT TIME ZONE 'Asia/Jakarta', 'YYMMDD')
      || '-' || lpad(
        row_number() OVER (
          PARTITION BY to_char(created_at AT TIME ZONE 'Asia/Jakarta', 'YYMMDD')
          ORDER BY created_at
        )::text,
        3,
        '0'
      ) AS new_kode
  FROM pengaduan
  WHERE kode IS NULL OR kode = ''
)
UPDATE pengaduan p
SET kode = numbered.new_kode
FROM numbered
WHERE p.id = numbered.id;

-- ========== Ops can update status ==========
DROP POLICY IF EXISTS "ops_update_pengaduan" ON pengaduan;
CREATE POLICY "ops_update_pengaduan"
  ON pengaduan FOR UPDATE TO authenticated
  USING (public.is_portal_ops())
  WITH CHECK (public.is_portal_ops());

-- ========== Thread komentar ==========
CREATE TABLE IF NOT EXISTS pengaduan_komentar (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pengaduan_id UUID NOT NULL REFERENCES pengaduan(id) ON DELETE CASCADE,
  nama TEXT NOT NULL,
  pesan TEXT NOT NULL,
  is_pengurus BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT pengaduan_komentar_nama_len CHECK (char_length(trim(nama)) >= 2),
  CONSTRAINT pengaduan_komentar_pesan_len CHECK (char_length(trim(pesan)) >= 1)
);

CREATE INDEX IF NOT EXISTS idx_pengaduan_komentar_pengaduan
  ON pengaduan_komentar (pengaduan_id, created_at ASC);

ALTER TABLE pengaduan_komentar ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_pengaduan_komentar" ON pengaduan_komentar;
CREATE POLICY "public_read_pengaduan_komentar"
  ON pengaduan_komentar FOR SELECT TO anon, authenticated
  USING (true);

-- Warga / anon: wajib nama, tidak boleh flag pengurus
DROP POLICY IF EXISTS "public_insert_pengaduan_komentar" ON pengaduan_komentar;
CREATE POLICY "public_insert_pengaduan_komentar"
  ON pengaduan_komentar FOR INSERT TO anon, authenticated
  WITH CHECK (
    is_pengurus = false
    AND char_length(trim(nama)) >= 2
    AND char_length(trim(pesan)) >= 1
  );

-- Pengurus / ops: boleh insert sebagai pengurus
DROP POLICY IF EXISTS "ops_insert_pengaduan_komentar" ON pengaduan_komentar;
CREATE POLICY "ops_insert_pengaduan_komentar"
  ON pengaduan_komentar FOR INSERT TO authenticated
  WITH CHECK (
    public.is_portal_ops()
    AND is_pengurus = true
    AND char_length(trim(nama)) >= 2
    AND char_length(trim(pesan)) >= 1
  );

-- ========== Security notification: sertakan kode bila ada ==========
CREATE OR REPLACE FUNCTION notify_security_on_pengaduan()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO security_notifications (pengaduan_id, user_email, jenis, judul, pesan)
  SELECT
    NEW.id,
    su.email,
    'pengaduan',
    'Pengaduan Baru: ' || COALESCE(NEW.kode || ' · ', '') || NEW.kategori,
    NEW.nama
      || COALESCE(' · Blok ' || NEW.blok, '')
      || ' — '
      || LEFT(NEW.deskripsi, 300)
  FROM security_users su
  WHERE su.receive_notifications = true;

  RETURN NEW;
END;
$$;
