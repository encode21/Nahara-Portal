-- Nahara Portal — Modul Info Security
-- Petugas keamanan, user login keamanan, notifikasi pengaduan

CREATE TABLE IF NOT EXISTS security_staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama TEXT NOT NULL,
  jabatan TEXT,
  telepon TEXT,
  shift TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS security_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID REFERENCES security_staff(id) ON DELETE SET NULL,
  email TEXT NOT NULL UNIQUE,
  nama TEXT NOT NULL,
  receive_notifications BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS security_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pengaduan_id UUID REFERENCES pengaduan(id) ON DELETE CASCADE,
  staff_id UUID REFERENCES security_staff(id) ON DELETE SET NULL,
  user_email TEXT NOT NULL,
  jenis TEXT NOT NULL DEFAULT 'pengaduan',
  judul TEXT NOT NULL,
  pesan TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_security_notifications_email
  ON security_notifications (user_email, is_read, created_at DESC);

ALTER TABLE security_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_notifications ENABLE ROW LEVEL SECURITY;

-- Public read petugas keamanan
CREATE POLICY "public_read_security_staff"
  ON security_staff FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "admin_all_security_staff"
  ON security_staff FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- User keamanan: admin kelola, user baca profil sendiri
CREATE POLICY "security_read_own_user"
  ON security_users FOR SELECT TO authenticated
  USING (lower(email) = lower(auth.jwt()->>'email'));

CREATE POLICY "admin_all_security_users"
  ON security_users FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- Notifikasi: admin full, user keamanan baca & tandai dibaca milik sendiri
CREATE POLICY "security_read_own_notifications"
  ON security_notifications FOR SELECT TO authenticated
  USING (lower(user_email) = lower(auth.jwt()->>'email'));

CREATE POLICY "security_update_own_notifications"
  ON security_notifications FOR UPDATE TO authenticated
  USING (lower(user_email) = lower(auth.jwt()->>'email'))
  WITH CHECK (lower(user_email) = lower(auth.jwt()->>'email'));

CREATE POLICY "admin_all_security_notifications"
  ON security_notifications FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- Trigger: kirim notifikasi ke semua user keamanan aktif saat pengaduan masuk
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
    'Pengaduan Baru: ' || NEW.kategori,
    NEW.nama
      || COALESCE(' · Blok ' || NEW.blok, '')
      || ' — '
      || LEFT(NEW.deskripsi, 300)
  FROM security_users su
  WHERE su.receive_notifications = true;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_pengaduan_notify_security ON pengaduan;
CREATE TRIGGER trg_pengaduan_notify_security
  AFTER INSERT ON pengaduan
  FOR EACH ROW
  EXECUTE FUNCTION notify_security_on_pengaduan();
