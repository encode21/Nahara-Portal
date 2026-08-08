-- Kategori galeri Agustusan (filter di /galeri)
-- dokumentasi | twibbon | lomba | malam_puncak | persiapan

ALTER TABLE event_gallery_items
  ADD COLUMN IF NOT EXISTS category text;

UPDATE event_gallery_items
SET category = CASE
  WHEN caption ILIKE 'Twibbon warga%' THEN 'twibbon'
  ELSE 'dokumentasi'
END
WHERE category IS NULL;

ALTER TABLE event_gallery_items
  ALTER COLUMN category SET DEFAULT 'dokumentasi';

ALTER TABLE event_gallery_items
  ALTER COLUMN category SET NOT NULL;

ALTER TABLE event_gallery_items
  DROP CONSTRAINT IF EXISTS event_gallery_items_category_check;

ALTER TABLE event_gallery_items
  ADD CONSTRAINT event_gallery_items_category_check
  CHECK (category IN (
    'dokumentasi',
    'twibbon',
    'lomba',
    'malam_puncak',
    'persiapan'
  ));

CREATE INDEX IF NOT EXISTS idx_event_gallery_edition_category
  ON event_gallery_items (edition_id, category);
