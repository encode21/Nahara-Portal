-- Extra seed: Esport additional night for Agustusan 2026
-- Requires: event_contests_category_check includes 'esport'
-- Idempotent: upsert by id
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
  'esport', 'on-site',
  'NHT-2', '2026-08-15T19:30:00+07:00', '2026-08-15T22:00:00+07:00',
  E'TV dan PS',
  E'Format: Perempat final → Semi final → Bronze match → Final.\nSistem gugur.\nDurasi total acara: 2.5 jam.',
  1, true, true
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

COMMIT;
