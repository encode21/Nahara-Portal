-- Video highlights + Google Drive folder link for Agustusan gallery

ALTER TABLE event_editions
  ADD COLUMN IF NOT EXISTS gallery_drive_url text;

ALTER TABLE event_gallery_items
  ADD COLUMN IF NOT EXISTS media_type text NOT NULL DEFAULT 'image';

ALTER TABLE event_gallery_items
  ADD COLUMN IF NOT EXISTS video_url text;

ALTER TABLE event_gallery_items
  DROP CONSTRAINT IF EXISTS event_gallery_items_media_type_check;

ALTER TABLE event_gallery_items
  ADD CONSTRAINT event_gallery_items_media_type_check
  CHECK (media_type IN ('image', 'video'));

ALTER TABLE event_gallery_items
  DROP CONSTRAINT IF EXISTS event_gallery_items_media_payload_check;

ALTER TABLE event_gallery_items
  ADD CONSTRAINT event_gallery_items_media_payload_check
  CHECK (
    (
      media_type = 'image'
      AND image_url IS NOT NULL
      AND char_length(image_url) > 0
      AND video_url IS NULL
    )
    OR (
      media_type = 'video'
      AND image_url IS NOT NULL
      AND char_length(image_url) > 0
      AND video_url IS NOT NULL
      AND char_length(video_url) > 0
    )
  );

CREATE INDEX IF NOT EXISTS idx_event_gallery_edition_media
  ON event_gallery_items (edition_id, media_type);

-- Default Drive folder for HUT ke-81 RI (canonical, no /u/N/)
UPDATE event_editions
SET gallery_drive_url = 'https://drive.google.com/drive/folders/1sQNypc3lnfxk18DsJPk0hr4n2OBzO2A6'
WHERE year = 2026
  AND (gallery_drive_url IS NULL OR gallery_drive_url = '');

-- Public insert: images/twibbon only (no video)
DROP POLICY IF EXISTS "public_insert_event_gallery_items" ON event_gallery_items;
CREATE POLICY "public_insert_event_gallery_items"
  ON event_gallery_items FOR INSERT TO anon, authenticated
  WITH CHECK (
    image_url LIKE '%/storage/v1/object/public/nahara-uploads/agustusan/%'
    AND char_length(coalesce(caption, '')) <= 200
    AND category = 'twibbon'
    AND is_published = true
    AND media_type = 'image'
    AND video_url IS NULL
  );
