-- Galeri dokumentasi per edisi Agustusan

CREATE TABLE IF NOT EXISTS event_gallery_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  edition_id uuid NOT NULL REFERENCES event_editions(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  caption text,
  sort_order int NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_event_gallery_edition ON event_gallery_items(edition_id);

ALTER TABLE event_gallery_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_event_gallery_items" ON event_gallery_items;
DROP POLICY IF EXISTS "admin_all_event_gallery_items" ON event_gallery_items;

CREATE POLICY "public_read_event_gallery_items"
  ON event_gallery_items FOR SELECT TO anon, authenticated
  USING (is_published = true OR auth.role() = 'authenticated');

CREATE POLICY "admin_all_event_gallery_items"
  ON event_gallery_items FOR ALL TO authenticated
  USING (true) WITH CHECK (true);
