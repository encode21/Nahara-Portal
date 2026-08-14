-- Allow esport as an event_contests category (Agustusan night tournament)

ALTER TABLE event_contests DROP CONSTRAINT IF EXISTS event_contests_category_check;

ALTER TABLE event_contests ADD CONSTRAINT event_contests_category_check
  CHECK (category IN (
    'ibu', 'bapak', 'pasangan', 'dewasa_remaja',
    'keluarga', 'balita', 'preteen', 'art', 'umum', 'esport'
  ));
