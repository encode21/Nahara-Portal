-- Fix tata tulis: "HUT RI ke-N" → "HUT ke-N RI" (Ejaan resmi)
-- Idempotent: safe to re-run

-- activities
UPDATE public.activities
SET
  title = regexp_replace(title, 'HUT RI ke-(\d+)', 'HUT ke-\1 RI', 'gi'),
  description = regexp_replace(description, 'HUT RI ke-(\d+)', 'HUT ke-\1 RI', 'gi')
WHERE title ~* 'HUT RI ke-\d+'
   OR description ~* 'HUT RI ke-\d+';

UPDATE public.activities
SET
  title = regexp_replace(title, 'Hut RI ke-(\d+)', 'Hut ke-\1 RI', 'g'),
  description = regexp_replace(description, 'Hut RI ke-(\d+)', 'Hut ke-\1 RI', 'g')
WHERE title ~ 'Hut RI ke-\d+'
   OR description ~ 'Hut RI ke-\d+';

-- donasi_campaign
UPDATE public.donasi_campaign
SET
  judul = regexp_replace(judul, 'HUT RI ke-(\d+)', 'HUT ke-\1 RI', 'gi'),
  deskripsi = regexp_replace(deskripsi, 'HUT RI ke-(\d+)', 'HUT ke-\1 RI', 'gi')
WHERE judul ~* 'HUT RI ke-\d+'
   OR deskripsi ~* 'HUT RI ke-\d+';

UPDATE public.donasi_campaign
SET
  judul = regexp_replace(judul, 'Hut RI ke-(\d+)', 'Hut ke-\1 RI', 'g'),
  deskripsi = regexp_replace(deskripsi, 'Hut RI ke-(\d+)', 'Hut ke-\1 RI', 'g')
WHERE judul ~ 'Hut RI ke-\d+'
   OR deskripsi ~ 'Hut RI ke-\d+';

-- event_editions
UPDATE public.event_editions
SET
  title = regexp_replace(title, 'HUT RI ke-(\d+)', 'HUT ke-\1 RI', 'gi'),
  description = regexp_replace(description, 'HUT RI ke-(\d+)', 'HUT ke-\1 RI', 'gi'),
  sop_text = regexp_replace(sop_text, 'HUT RI ke-(\d+)', 'HUT ke-\1 RI', 'gi')
WHERE title ~* 'HUT RI ke-\d+'
   OR description ~* 'HUT RI ke-\d+'
   OR sop_text ~* 'HUT RI ke-\d+';

-- Cover SOP uppercase variant: HUT RI KE-81
UPDATE public.event_editions
SET sop_text = regexp_replace(sop_text, 'HUT RI KE-(\d+)', 'HUT KE-\1 RI', 'g')
WHERE sop_text ~ 'HUT RI KE-\d+';

-- pengumuman (jika pernah dibuat otomatis dari edisi)
UPDATE public.pengumuman
SET
  judul = regexp_replace(judul, 'HUT RI ke-(\d+)', 'HUT ke-\1 RI', 'gi'),
  isi = regexp_replace(isi, 'HUT RI ke-(\d+)', 'HUT ke-\1 RI', 'gi')
WHERE judul ~* 'HUT RI ke-\d+'
   OR isi ~* 'HUT RI ke-\d+';
