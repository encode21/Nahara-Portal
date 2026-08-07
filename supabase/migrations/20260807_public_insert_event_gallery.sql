-- Allow community (anon) to contribute twibbon/photos to Agustusan gallery
-- Admin remains able to delete/moderate via existing admin_all policy

DROP POLICY IF EXISTS "public_insert_event_gallery_items" ON event_gallery_items;

CREATE POLICY "public_insert_event_gallery_items"
  ON event_gallery_items FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);
