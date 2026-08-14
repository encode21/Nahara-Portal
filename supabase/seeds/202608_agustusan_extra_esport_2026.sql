-- Extra seed: Esport knockout night (15 Agu) = lanjutan penyisihan 9 Agu
-- Source contest: Esport Sepak Bola (bapak) a081...104
-- Requires: event_contests_category_check includes 'esport'
-- Idempotent: upsert contest by id; copy entries if missing
BEGIN;

INSERT INTO event_contests (
  id, edition_id, sort_order, title, category, category_note,
  location, starts_at, ends_at, equipment, rules,
  team_size, registration_open, is_competition
) VALUES (
  'a0812026-0000-4000-8000-000000000120',
  'a0812026-0000-4000-8000-000000000010',
  20,
  'Esport — Turnamen Agustusan (Perempat/Semi/Bronze/Final)',
  'esport',
  'Lanjutan Esport Sepak Bola (penyisihan 9 Agu). Peserta sama, tanpa daftar ulang.',
  'NHT-2', '2026-08-15T19:30:00+07:00', '2026-08-15T22:00:00+07:00',
  E'TV dan PS',
  E'Format: Perempat final → Semi final → Bronze match → Final.\nSistem gugur.\nDurasi total acara: 2.5 jam.\nPeserta mengikuti hasil penyisihan Esport Sepak Bola 9 Agustus.',
  1, false, true
)
ON CONFLICT (id) DO UPDATE SET
  sort_order = EXCLUDED.sort_order,
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  category_note = EXCLUDED.category_note,
  location = EXCLUDED.location,
  starts_at = EXCLUDED.starts_at,
  ends_at = EXCLUDED.ends_at,
  equipment = EXCLUDED.equipment,
  rules = EXCLUDED.rules,
  team_size = EXCLUDED.team_size,
  registration_open = EXCLUDED.registration_open,
  is_competition = EXCLUDED.is_competition;

INSERT INTO event_contest_entries (
  contest_id, display_name, partner_name, block_number, phone, notes, status, registered_at
)
SELECT
  'a0812026-0000-4000-8000-000000000120',
  src.display_name,
  src.partner_name,
  src.block_number,
  src.phone,
  src.notes,
  src.status,
  src.registered_at
FROM event_contest_entries src
WHERE src.contest_id = 'a0812026-0000-4000-8000-000000000104'
  AND src.status = 'registered'
  AND NOT EXISTS (
    SELECT 1
    FROM event_contest_entries dest
    WHERE dest.contest_id = 'a0812026-0000-4000-8000-000000000120'
      AND dest.display_name = src.display_name
      AND dest.status = 'registered'
  );

COMMIT;
