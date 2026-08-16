-- Door prize malam puncak 2026
-- Idempotent: upsert by id. Hadiah Utama (Duck Race) tetap kind = utama.
BEGIN;

INSERT INTO event_door_prizes (id, edition_id, name, description, quantity, sort_order, is_active, kind)
VALUES
  (
    'a0812026-0000-4000-8000-000000000301',
    'a0812026-0000-4000-8000-000000000010',
    'Vacuum',
    'Door prize — 1 unit',
    1, 1, true, 'door'
  ),
  (
    'a0812026-0000-4000-8000-000000000302',
    'a0812026-0000-4000-8000-000000000010',
    'Payung',
    'Door prize — 5 unit',
    5, 2, true, 'door'
  ),
  (
    'a0812026-0000-4000-8000-000000000303',
    'a0812026-0000-4000-8000-000000000010',
    'Voucher Perawatan',
    'Door prize — 8 voucher',
    8, 3, true, 'door'
  ),
  (
    'a0812026-0000-4000-8000-000000000305',
    'a0812026-0000-4000-8000-000000000010',
    'Magic Com',
    'Door prize — 1 unit',
    1, 4, true, 'door'
  ),
  (
    'a0812026-0000-4000-8000-000000000306',
    'a0812026-0000-4000-8000-000000000010',
    'Chopper',
    'Door prize — 1 unit',
    1, 5, true, 'door'
  ),
  (
    'a0812026-0000-4000-8000-000000000304',
    'a0812026-0000-4000-8000-000000000010',
    'Hadiah Utama',
    'Hadiah utama via Duck Race — spin terpisah',
    1, 10, true, 'utama'
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  quantity = EXCLUDED.quantity,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active,
  kind = EXCLUDED.kind;

COMMIT;
