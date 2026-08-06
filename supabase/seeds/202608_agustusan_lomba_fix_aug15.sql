-- Pindahkan lomba Pre-Teen ke Sabtu 15 Agustus 2026
-- (sebelumnya tersalah jadwal ke Minggu 16 — lihat jadwal panitia)
-- Idempotent: aman dijalankan ulang.

BEGIN;

UPDATE event_contests SET
  sort_order = 14,
  starts_at = '2026-08-15T08:00:00+07:00',
  ends_at = '2026-08-15T09:00:00+07:00'
WHERE id = 'a0812026-0000-4000-8000-000000000116';

UPDATE event_contests SET
  sort_order = 15,
  starts_at = '2026-08-15T09:00:00+07:00',
  ends_at = '2026-08-15T10:00:00+07:00'
WHERE id = 'a0812026-0000-4000-8000-000000000114';

UPDATE event_contests SET
  sort_order = 16,
  starts_at = '2026-08-15T10:00:00+07:00',
  ends_at = '2026-08-15T11:00:00+07:00'
WHERE id = 'a0812026-0000-4000-8000-000000000115';

COMMIT;
