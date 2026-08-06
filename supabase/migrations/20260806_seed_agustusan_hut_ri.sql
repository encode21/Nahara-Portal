-- Seed: Agustusan HUT RI ke-81 + daftar donatur (open donation)
-- Fixed IDs match lib/constants/agustusan.ts
-- Run in Supabase SQL Editor or via supabase db push / migration.

BEGIN;

-- Idempotent re-seed
DELETE FROM participants
WHERE activity_id = 'a0812026-0000-4000-8000-000000000001';

DELETE FROM activities
WHERE id = 'a0812026-0000-4000-8000-000000000001';

DELETE FROM donasi_campaign
WHERE id = 'a0812026-0000-4000-8000-000000000002';

INSERT INTO activities (
  id,
  title,
  description,
  date,
  location,
  max_participants,
  registration_fee,
  image_url
) VALUES (
  'a0812026-0000-4000-8000-000000000001',
  'Agustusan HUT RI ke-81',
  E'Donasi terbuka warga Cluster Nahara untuk acara perayaan HUT RI ke-81.\n\nSemoga donasi menjadi berkah bagi kita semua. Aamiin.\n\nDari Kita untuk Kita Semua — E Pluribus Unum Annuit Coeptis\n\nTransfer: BCA 4580329328 a.n. Fadilla Harika Wijaya\nBukti transfer japri ke Fadilla Harika.\n\nCatatan: tanggal acara bisa diedit di Admin → Kegiatan.',
  '2026-08-17T08:00:00+07:00',
  'Cluster Nahara',
  NULL,
  0,
  NULL
);

INSERT INTO donasi_campaign (
  id,
  judul,
  deskripsi,
  target_amount,
  collected_amount,
  deadline,
  is_active
) VALUES (
  'a0812026-0000-4000-8000-000000000002',
  'Donasi Agustusan HUT RI ke-81',
  'Dana donasi acara Hut RI ke-81 — Cluster Nahara. Open donation. Rek BCA 4580329328 a.n. Fadilla Harika Wijaya.',
  30000000,
  25400500,
  '2026-08-17',
  true
);

INSERT INTO participants (
  activity_id,
  name,
  block_number,
  payment_status,
  attendance_status,
  registered_at
) VALUES
  ('a0812026-0000-4000-8000-000000000001', 'Helmi', NULL, true, false, '2026-08-06T10:18:00+07:00'),
  ('a0812026-0000-4000-8000-000000000001', 'Fadilla', NULL, true, false, '2026-08-06T10:18:00+07:00'),
  ('a0812026-0000-4000-8000-000000000001', 'Andri', NULL, true, false, '2026-08-06T10:18:00+07:00'),
  ('a0812026-0000-4000-8000-000000000001', 'Nirwan', NULL, true, false, '2026-08-06T10:18:00+07:00'),
  ('a0812026-0000-4000-8000-000000000001', 'Catur', NULL, true, false, '2026-08-06T10:18:00+07:00'),
  ('a0812026-0000-4000-8000-000000000001', 'Erwin', NULL, true, false, '2026-08-06T10:18:00+07:00'),
  ('a0812026-0000-4000-8000-000000000001', 'Andi', 'NHT 1', true, false, '2026-08-06T10:18:00+07:00'),
  ('a0812026-0000-4000-8000-000000000001', 'Andi', 'NHT 6', true, false, '2026-08-06T10:18:00+07:00'),
  ('a0812026-0000-4000-8000-000000000001', 'Hafiz Arya', 'NHT 7', true, false, '2026-08-06T10:18:00+07:00'),
  ('a0812026-0000-4000-8000-000000000001', 'Chandra', 'NHT 8', true, false, '2026-08-06T10:18:00+07:00'),
  ('a0812026-0000-4000-8000-000000000001', 'Wahyu', 'NHT 8', true, false, '2026-08-06T10:18:00+07:00'),
  ('a0812026-0000-4000-8000-000000000001', 'Deris', NULL, true, false, '2026-08-06T10:18:00+07:00'),
  ('a0812026-0000-4000-8000-000000000001', 'Pak Alfian', NULL, true, false, '2026-08-06T10:18:00+07:00'),
  ('a0812026-0000-4000-8000-000000000001', 'Bayu Virguna', NULL, true, false, '2026-08-06T10:18:00+07:00'),
  ('a0812026-0000-4000-8000-000000000001', 'Pak Haris', NULL, true, false, '2026-08-06T10:18:00+07:00'),
  ('a0812026-0000-4000-8000-000000000001', 'Tommy', NULL, true, false, '2026-08-06T10:18:00+07:00'),
  ('a0812026-0000-4000-8000-000000000001', 'Temmy', NULL, true, false, '2026-08-06T10:18:00+07:00'),
  ('a0812026-0000-4000-8000-000000000001', 'Chandra Ageng', NULL, true, false, '2026-08-06T10:18:00+07:00'),
  ('a0812026-0000-4000-8000-000000000001', 'Ma''mun Fauzi', NULL, true, false, '2026-08-06T10:18:00+07:00'),
  ('a0812026-0000-4000-8000-000000000001', 'Pak Sugondho', NULL, true, false, '2026-08-06T10:18:00+07:00'),
  ('a0812026-0000-4000-8000-000000000001', 'Pak Dian', NULL, true, false, '2026-08-06T10:18:00+07:00'),
  ('a0812026-0000-4000-8000-000000000001', 'Pak Bambang', NULL, true, false, '2026-08-06T10:18:00+07:00'),
  ('a0812026-0000-4000-8000-000000000001', 'Zikki', NULL, true, false, '2026-08-06T10:18:00+07:00'),
  ('a0812026-0000-4000-8000-000000000001', 'Pak Adjie', NULL, true, false, '2026-08-06T10:18:00+07:00'),
  ('a0812026-0000-4000-8000-000000000001', 'Aep', NULL, true, false, '2026-08-06T10:18:00+07:00'),
  ('a0812026-0000-4000-8000-000000000001', 'Fauzi', NULL, true, false, '2026-08-06T10:18:00+07:00'),
  ('a0812026-0000-4000-8000-000000000001', 'Pak Muchlis', NULL, true, false, '2026-08-06T10:18:00+07:00'),
  ('a0812026-0000-4000-8000-000000000001', 'Pak Danny', NULL, true, false, '2026-08-06T10:18:00+07:00'),
  ('a0812026-0000-4000-8000-000000000001', 'Pak Rio', NULL, true, false, '2026-08-06T10:18:00+07:00'),
  ('a0812026-0000-4000-8000-000000000001', 'Pak Rudi', NULL, true, false, '2026-08-06T10:18:00+07:00'),
  ('a0812026-0000-4000-8000-000000000001', 'Yusuf', NULL, true, false, '2026-08-06T10:18:00+07:00'),
  ('a0812026-0000-4000-8000-000000000001', 'Desandri', NULL, true, false, '2026-08-06T10:18:00+07:00'),
  ('a0812026-0000-4000-8000-000000000001', 'NHT7-28', 'NHT7-28', true, false, '2026-08-06T10:18:00+07:00'),
  ('a0812026-0000-4000-8000-000000000001', 'NHT6-12', 'NHT6-12', true, false, '2026-08-06T10:18:00+07:00'),
  ('a0812026-0000-4000-8000-000000000001', 'Pak Rahman', 'NHT8/35', true, false, '2026-08-06T10:18:00+07:00'),
  ('a0812026-0000-4000-8000-000000000001', 'Sony', NULL, true, false, '2026-08-06T10:18:00+07:00'),
  ('a0812026-0000-4000-8000-000000000001', 'NHT 2/19', 'NHT 2/19', true, false, '2026-08-06T10:18:00+07:00'),
  ('a0812026-0000-4000-8000-000000000001', 'NHT 1/17', 'NHT 1/17', true, false, '2026-08-06T10:18:00+07:00'),
  ('a0812026-0000-4000-8000-000000000001', 'NHT2/5', 'NHT2/5', true, false, '2026-08-06T10:18:00+07:00'),
  ('a0812026-0000-4000-8000-000000000001', 'Denny', NULL, true, false, '2026-08-06T10:18:00+07:00'),
  ('a0812026-0000-4000-8000-000000000001', 'Pak Akram', NULL, true, false, '2026-08-06T10:18:00+07:00'),
  ('a0812026-0000-4000-8000-000000000001', 'Pak Andy', 'NHB 3', true, false, '2026-08-06T10:18:00+07:00'),
  ('a0812026-0000-4000-8000-000000000001', 'Andreas', NULL, true, false, '2026-08-06T10:18:00+07:00'),
  ('a0812026-0000-4000-8000-000000000001', 'Arie', NULL, true, false, '2026-08-06T10:18:00+07:00'),
  ('a0812026-0000-4000-8000-000000000001', 'Pak Ardie', 'NHT 3', true, false, '2026-08-06T10:18:00+07:00'),
  ('a0812026-0000-4000-8000-000000000001', 'Bu Keni', NULL, true, false, '2026-08-06T10:18:00+07:00'),
  ('a0812026-0000-4000-8000-000000000001', 'Farah', NULL, true, false, '2026-08-06T10:18:00+07:00'),
  ('a0812026-0000-4000-8000-000000000001', 'Rety', 'NHT8/7', true, false, '2026-08-06T10:18:00+07:00'),
  ('a0812026-0000-4000-8000-000000000001', 'Veron', NULL, true, false, '2026-08-06T10:18:00+07:00'),
  ('a0812026-0000-4000-8000-000000000001', 'Yofi', 'NHT1/1', true, false, '2026-08-06T10:18:00+07:00'),
  ('a0812026-0000-4000-8000-000000000001', 'Ayu Putri', 'NHT 1', true, false, '2026-08-06T10:18:00+07:00'),
  ('a0812026-0000-4000-8000-000000000001', 'Ichsan', NULL, true, false, '2026-08-06T10:18:00+07:00'),
  ('a0812026-0000-4000-8000-000000000001', 'Whisnu', NULL, true, false, '2026-08-06T10:18:00+07:00');

COMMIT;
