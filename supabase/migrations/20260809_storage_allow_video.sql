-- Allow short Agustusan video highlights in public bucket
-- Images remain allowed; video MIME + 50 MB limit for MP4/WebM uploads

UPDATE storage.buckets
SET
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'video/mp4',
    'video/webm'
  ]::text[]
WHERE id = 'nahara-uploads';
