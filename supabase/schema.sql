-- Nahara Community Portal — Supabase Schema
-- Run this in the Supabase SQL Editor

-- =============================================
-- LEGACY TABLES (kegiatan & kas)
-- =============================================

CREATE TABLE IF NOT EXISTS activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  date timestamptz NOT NULL,
  location text,
  max_participants int,
  registration_fee int DEFAULT 0,
  image_url text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id uuid REFERENCES activities(id) ON DELETE CASCADE,
  name text NOT NULL,
  phone text,
  block_number text,
  payment_status boolean DEFAULT false,
  attendance_status boolean DEFAULT false,
  registered_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS kas_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text CHECK (type IN ('pemasukan', 'pengeluaran')),
  amount int NOT NULL,
  description text NOT NULL,
  category text,
  date date NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- =============================================
-- NEW PORTAL TABLES
-- =============================================

CREATE TABLE IF NOT EXISTS warga (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nama text NOT NULL,
  blok text NOT NULL,
  blok_row text NOT NULL,
  nomor_kavling int,
  status_hunian text CHECK (status_hunian IN ('Tetap', 'Kontrak', 'Kosong')),
  telepon text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS iuran (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  warga_id uuid REFERENCES warga(id) ON DELETE CASCADE,
  bulan date NOT NULL,
  nominal int DEFAULT 50000,
  status boolean DEFAULT false,
  paid_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(warga_id, bulan)
);

CREATE TABLE IF NOT EXISTS pengaduan (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kode text,
  nama text NOT NULL,
  blok text,
  kategori text CHECK (kategori IN ('Keamanan', 'Kebersihan', 'Infrastruktur', 'Lainnya')),
  deskripsi text NOT NULL,
  foto_url text,
  status text DEFAULT 'Baru' CHECK (status IN ('Baru', 'Diproses', 'Selesai', 'Ditolak')),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS pengaduan_komentar (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pengaduan_id uuid NOT NULL REFERENCES pengaduan(id) ON DELETE CASCADE,
  nama text NOT NULL,
  pesan text NOT NULL,
  is_pengurus boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS donasi_campaign (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  judul text NOT NULL,
  deskripsi text,
  target_amount int NOT NULL,
  collected_amount int DEFAULT 0,
  deadline date,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS pengumuman (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  judul text NOT NULL,
  isi text,
  image_url text,
  created_by text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cctv_cameras (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nama text NOT NULL,
  lokasi text,
  stream_url text,
  is_online boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- =============================================
-- INDEXES
-- =============================================

CREATE INDEX IF NOT EXISTS idx_participants_activity_id ON participants(activity_id);
CREATE INDEX IF NOT EXISTS idx_kas_entries_date ON kas_entries(date DESC);
CREATE INDEX IF NOT EXISTS idx_activities_date ON activities(date);
CREATE INDEX IF NOT EXISTS idx_warga_blok_row ON warga(blok_row);
CREATE INDEX IF NOT EXISTS idx_warga_blok ON warga(blok);
CREATE INDEX IF NOT EXISTS idx_iuran_bulan ON iuran(bulan DESC);
CREATE INDEX IF NOT EXISTS idx_iuran_warga_id ON iuran(warga_id);
CREATE INDEX IF NOT EXISTS idx_pengaduan_status ON pengaduan(status);
CREATE INDEX IF NOT EXISTS idx_pengaduan_created_at ON pengaduan(created_at DESC);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE kas_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE warga ENABLE ROW LEVEL SECURITY;
ALTER TABLE iuran ENABLE ROW LEVEL SECURITY;
ALTER TABLE pengaduan ENABLE ROW LEVEL SECURITY;
ALTER TABLE donasi_campaign ENABLE ROW LEVEL SECURITY;
ALTER TABLE pengumuman ENABLE ROW LEVEL SECURITY;
ALTER TABLE cctv_cameras ENABLE ROW LEVEL SECURITY;

-- Public read for activities
CREATE POLICY "Public can read activities"
  ON activities FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Public can register for activities"
  ON participants FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Public can read participants"
  ON participants FOR SELECT TO anon, authenticated USING (true);

-- Public pengaduan submission (no login required)
CREATE POLICY "Public can submit pengaduan"
  ON pengaduan FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Public can read donasi campaigns"
  ON donasi_campaign FOR SELECT TO anon, authenticated USING (true);

-- Public read for portal (tanpa login)
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

-- Authenticated admin full access
CREATE POLICY "Authenticated full access activities"
  ON activities FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated full access participants"
  ON participants FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated full access kas"
  ON kas_entries FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated full access warga"
  ON warga FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated full access iuran"
  ON iuran FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated full access pengaduan"
  ON pengaduan FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated full access donasi"
  ON donasi_campaign FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated full access pengumuman"
  ON pengumuman FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated full access cctv"
  ON cctv_cameras FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Enable realtime (optional)
ALTER PUBLICATION supabase_realtime ADD TABLE participants;
ALTER PUBLICATION supabase_realtime ADD TABLE activities;
ALTER PUBLICATION supabase_realtime ADD TABLE kas_entries;
