-- Seed peserta Acara Puncak untuk uji door prize spin
-- Aman di-re-run: pakai registration_code unik + WHERE NOT EXISTS
-- Hapus data test: DELETE FROM event_peak_registrations WHERE registration_code LIKE 'NP26-SEED%';

-- Pastikan migration 20260813_event_peak_registration.sql sudah dijalankan.

WITH seed(code, blok_row, nomor, name, role) AS (
  VALUES
    ('NP26-SEED0001', 'NHT-1', 1,  '[TEST] Budi Santoso', 'suami'),
    ('NP26-SEED0002', 'NHT-1', 1,  '[TEST] Sari Santoso', 'istri'),
    ('NP26-SEED0003', 'NHT-1', 2,  '[TEST] Andi Wijaya', 'suami'),
    ('NP26-SEED0004', 'NHT-2', 3,  '[TEST] Rina Putri', 'istri'),
    ('NP26-SEED0005', 'NHT-2', 5,  '[TEST] Doni Pratama', 'suami'),
    ('NP26-SEED0006', 'NHT-2', 5,  '[TEST] Maya Pratama', 'istri'),
    ('NP26-SEED0007', 'NHT-3', 7,  '[TEST] Eko Nugroho', 'suami'),
    ('NP26-SEED0008', 'NHT-6', 2,  '[TEST] Lina Rahayu', 'istri'),
    ('NP26-SEED0009', 'NHT-6', 8,  '[TEST] Fajar Malik', 'suami'),
    ('NP26-SEED0010', 'NHT-7', 1,  '[TEST] Devi Lestari', 'istri'),
    ('NP26-SEED0011', 'NHT-7', 1,  '[TEST] Agus Lestari', 'suami'),
    ('NP26-SEED0012', 'NHT-8', 3,  '[TEST] Hendra Gunawan', 'suami'),
    ('NP26-SEED0013', 'NHB-1', 1,  '[TEST] Yuni Astuti', 'istri'),
    ('NP26-SEED0014', 'NHB-1', 5,  '[TEST] Rizki Ramadhan', 'suami'),
    ('NP26-SEED0015', 'NHB-1', 5,  '[TEST] Nia Ramadhan', 'istri'),
    ('NP26-SEED0016', 'NHB-2', 2,  '[TEST] Bambang Sutrisno', 'suami'),
    ('NP26-SEED0017', 'NHB-2', 9,  '[TEST] Citra Dewi', 'istri'),
    ('NP26-SEED0018', 'NHB-3', 3,  '[TEST] Wahyu Kurniawan', 'suami'),
    ('NP26-SEED0019', 'NHB-3', 3,  '[TEST] Anisa Kurniawan', 'istri'),
    ('NP26-SEED0020', 'NHB-6', 6,  '[TEST] Joko Widodo', 'suami'),
    ('NP26-SEED0021', 'NHB-6', 10, '[TEST] Sinta Wulandari', 'istri'),
    ('NP26-SEED0022', 'NHB-7', 1,  '[TEST] Tono Hartono', 'suami'),
    ('NP26-SEED0023', 'NHB-7', 7,  '[TEST] Putri Anggraini', 'istri'),
    ('NP26-SEED0024', 'NHB-8', 2,  '[TEST] Dimas Saputra', 'suami')
)
INSERT INTO event_peak_registrations (
  edition_id,
  blok_row,
  nomor_kavling,
  household_label,
  participant_name,
  participant_role,
  phone,
  twibbon_url,
  terms_accepted_at,
  status,
  registration_code,
  verified_at
)
SELECT
  'a0812026-0000-4000-8000-000000000010'::uuid,
  s.blok_row,
  s.nomor,
  s.blok_row || '/' || lpad(s.nomor::text, 2, '0'),
  s.name,
  s.role,
  '08000000000',
  -- URL dummy (spin tidak fetch gambar). Ganti ke URL storage asli bila perlu preview.
  'https://placeholder.local/storage/v1/object/public/nahara-uploads/agustusan/seed-test.png',
  now(),
  'verified',
  s.code,
  now()
FROM seed s
WHERE NOT EXISTS (
  SELECT 1 FROM event_peak_registrations e WHERE e.registration_code = s.code
);
