-- Additive: donatur HUT RI 81 yang belum ada di DB (dari list 55 nama).
-- Aman dijalankan tanpa menghapus donatur existing.
-- Activity id: a0812026-0000-4000-8000-000000000001

BEGIN;

-- 1. Pak Ferdi
INSERT INTO participants (
  activity_id, name, block_number, payment_status, attendance_status, registered_at
)
SELECT
  'a0812026-0000-4000-8000-000000000001',
  'Pak Ferdi',
  NULL,
  true,
  false,
  '2026-08-06T10:18:00+07:00'
WHERE NOT EXISTS (
  SELECT 1
  FROM participants
  WHERE activity_id = 'a0812026-0000-4000-8000-000000000001'
    AND lower(trim(name)) = 'pak ferdi'
);

-- 55. Pak Eka NHB7/11
INSERT INTO participants (
  activity_id, name, block_number, payment_status, attendance_status, registered_at
)
SELECT
  'a0812026-0000-4000-8000-000000000001',
  'Pak Eka',
  'NHB7/11',
  true,
  false,
  '2026-08-06T10:18:00+07:00'
WHERE NOT EXISTS (
  SELECT 1
  FROM participants
  WHERE activity_id = 'a0812026-0000-4000-8000-000000000001'
    AND (
      lower(trim(name)) = 'pak eka'
      OR lower(trim(name)) LIKE 'pak eka%'
      OR (lower(coalesce(block_number, '')) = 'nhb7/11' AND lower(trim(name)) LIKE '%eka%')
    )
);

COMMIT;

-- Cek count (opsional)
-- SELECT count(*) FROM participants
-- WHERE activity_id = 'a0812026-0000-4000-8000-000000000001' AND payment_status = true;
