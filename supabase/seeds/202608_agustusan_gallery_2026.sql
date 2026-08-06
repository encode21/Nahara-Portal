-- Seed galeri awal dari aset publik Agustusan 2026
-- Jalankan setelah event_editions + media di /public/assets/agustusan/

BEGIN;

DELETE FROM event_gallery_items
WHERE edition_id = 'a0812026-0000-4000-8000-000000000010';

INSERT INTO event_gallery_items (edition_id, image_url, caption, sort_order, is_published)
SELECT
  'a0812026-0000-4000-8000-000000000010',
  v.image_url,
  v.caption,
  v.sort_order,
  true
FROM (
  VALUES
    ('/assets/agustusan/nahara-flags-banner.png', 'Nahara menyambut HUT RI', 1),
    ('/assets/agustusan/lomba-suasana.png', 'Suasana lomba Agustusan', 2),
    ('/assets/agustusan/cluster-flags.png', 'Cluster berhias Merah Putih', 3),
    ('/assets/agustusan/aerial-minigolf.png', 'Area Mini Golf', 4)
) AS v(image_url, caption, sort_order)
WHERE EXISTS (
  SELECT 1 FROM event_editions WHERE id = 'a0812026-0000-4000-8000-000000000010'
);

COMMIT;
