-- Galeri kegiatan (maksimal 5 foto) dan pengeluaran yang otomatis tersinkron ke kas.

ALTER TABLE public.activities
  ADD COLUMN IF NOT EXISTS source_pengumuman_id uuid
    REFERENCES public.pengumuman(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_activities_source_pengumuman
  ON public.activities(source_pengumuman_id)
  WHERE source_pengumuman_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.activity_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id uuid NOT NULL REFERENCES public.activities(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  sort_order smallint NOT NULL CHECK (sort_order BETWEEN 0 AND 4),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (activity_id, sort_order),
  UNIQUE (activity_id, image_url)
);

CREATE INDEX IF NOT EXISTS idx_activity_images_activity
  ON public.activity_images(activity_id, sort_order);

-- Guard the five-photo limit even if rows are written outside the portal UI.
CREATE OR REPLACE FUNCTION public.enforce_activity_image_limit()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF (SELECT count(*) FROM public.activity_images WHERE activity_id = NEW.activity_id) >= 5 THEN
    RAISE EXCEPTION 'Maksimal 5 foto per kegiatan';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_activity_image_limit ON public.activity_images;
CREATE TRIGGER trg_activity_image_limit
  BEFORE INSERT ON public.activity_images
  FOR EACH ROW EXECUTE FUNCTION public.enforce_activity_image_limit();

CREATE OR REPLACE FUNCTION public.replace_activity_images(
  p_activity_id uuid,
  p_image_urls text[]
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  IF coalesce(cardinality(p_image_urls), 0) > 5 THEN
    RAISE EXCEPTION 'Maksimal 5 foto per kegiatan';
  END IF;

  DELETE FROM public.activity_images WHERE activity_id = p_activity_id;

  INSERT INTO public.activity_images (activity_id, image_url, sort_order)
  SELECT p_activity_id, item.image_url, (item.ordinality - 1)::smallint
  FROM unnest(coalesce(p_image_urls, ARRAY[]::text[])) WITH ORDINALITY
    AS item(image_url, ordinality);
END;
$$;

REVOKE ALL ON FUNCTION public.replace_activity_images(uuid, text[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.replace_activity_images(uuid, text[]) TO authenticated;

INSERT INTO public.activity_images (activity_id, image_url, sort_order)
SELECT id, image_url, 0
FROM public.activities
WHERE image_url IS NOT NULL
ON CONFLICT (activity_id, image_url) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.activity_expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id uuid NOT NULL REFERENCES public.activities(id) ON DELETE CASCADE,
  description text NOT NULL CHECK (char_length(trim(description)) > 0),
  amount integer NOT NULL CHECK (amount > 0),
  pic text,
  expense_date date NOT NULL,
  kas_entry_id uuid UNIQUE REFERENCES public.kas_entries(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (activity_id, description)
);

CREATE INDEX IF NOT EXISTS idx_activity_expenses_activity
  ON public.activity_expenses(activity_id, expense_date, created_at);

CREATE OR REPLACE FUNCTION public.sync_activity_expense_to_kas()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  activity_title text;
  next_description text;
  new_kas_id uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.kas_entry_id IS NOT NULL THEN
      DELETE FROM public.kas_entries WHERE id = OLD.kas_entry_id;
    END IF;
    RETURN OLD;
  END IF;

  SELECT title INTO activity_title
  FROM public.activities
  WHERE id = NEW.activity_id;

  next_description := '[Kegiatan: ' || activity_title || '] ' || NEW.description ||
    CASE WHEN nullif(trim(NEW.pic), '') IS NOT NULL THEN ' — PIC ' || trim(NEW.pic) ELSE '' END;

  IF TG_OP = 'INSERT' OR NEW.kas_entry_id IS NULL THEN
    INSERT INTO public.kas_entries (type, amount, description, category, date)
    VALUES ('pengeluaran', NEW.amount, next_description, 'Kegiatan', NEW.expense_date)
    RETURNING id INTO new_kas_id;
    NEW.kas_entry_id := new_kas_id;
  ELSE
    UPDATE public.kas_entries
    SET type = 'pengeluaran',
        amount = NEW.amount,
        description = next_description,
        category = 'Kegiatan',
        date = NEW.expense_date
    WHERE id = NEW.kas_entry_id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_activity_expense_to_kas ON public.activity_expenses;
CREATE TRIGGER trg_activity_expense_to_kas
  BEFORE INSERT OR UPDATE ON public.activity_expenses
  FOR EACH ROW EXECUTE FUNCTION public.sync_activity_expense_to_kas();

DROP TRIGGER IF EXISTS trg_activity_expense_delete_kas ON public.activity_expenses;
CREATE TRIGGER trg_activity_expense_delete_kas
  AFTER DELETE ON public.activity_expenses
  FOR EACH ROW EXECUTE FUNCTION public.sync_activity_expense_to_kas();

ALTER TABLE public.activity_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_activity_images"
  ON public.activity_images FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "admin_all_activity_images"
  ON public.activity_images FOR ALL TO authenticated
  USING (public.is_portal_admin()) WITH CHECK (public.is_portal_admin());

CREATE POLICY "public_read_activity_expenses"
  ON public.activity_expenses FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "admin_all_activity_expenses"
  ON public.activity_expenses FOR ALL TO authenticated
  USING (public.is_portal_admin()) WITH CHECK (public.is_portal_admin());

-- Jadikan pengumuman simulasi pemadaman sebagai kegiatan, bukan data duplikat lepas.
-- Jika admin sudah sempat membuatnya dari form sebelum migrasi aktif, gunakan record itu.
UPDATE public.activities a
SET source_pengumuman_id = p.id
FROM public.pengumuman p
WHERE p.id = '7cd29f72-8559-4306-ad02-8e389f0d6d29'
  AND a.id = (
    SELECT candidate.id
    FROM public.activities candidate
    WHERE candidate.source_pengumuman_id IS NULL
      AND candidate.title ILIKE '%simulasi%pemadaman%kebakaran%'
    ORDER BY candidate.created_at DESC
    LIMIT 1
  );

INSERT INTO public.activities (
  title, description, date, location, max_participants,
  registration_fee, image_url, source_pengumuman_id
)
SELECT
  'Simulasi Pemadaman Kebakaran',
  'Edukasi dan kesiapsiagaan warga dalam menghadapi keadaan darurat. Warga diimbau hadir dan mengikuti kegiatan dengan tertib.',
  '2026-09-19 08:30:00+07'::timestamptz,
  'Badan Jalan di Lahan Kosong NHB (antara NHB 6 & 7)',
  NULL,
  0,
  p.image_url,
  p.id
FROM public.pengumuman p
WHERE p.id = '7cd29f72-8559-4306-ad02-8e389f0d6d29'
ON CONFLICT (source_pengumuman_id) WHERE source_pengumuman_id IS NOT NULL
DO UPDATE SET
  date = EXCLUDED.date,
  location = EXCLUDED.location,
  image_url = COALESCE(public.activities.image_url, EXCLUDED.image_url);

INSERT INTO public.activity_images (activity_id, image_url, sort_order)
SELECT a.id, a.image_url, 0
FROM public.activities a
WHERE a.source_pengumuman_id = '7cd29f72-8559-4306-ad02-8e389f0d6d29'
  AND a.image_url IS NOT NULL
ON CONFLICT (activity_id, image_url) DO NOTHING;

INSERT INTO public.activity_expenses (activity_id, description, amount, pic, expense_date)
SELECT a.id, expense.description, expense.amount, expense.pic, '2026-09-19'::date
FROM public.activities a
CROSS JOIN (VALUES
  ('Konsumsi seluruh warga untuk acara (jajanan pasar + air mineral)', 553050, 'Vidora NHT3/30'),
  ('Konsumsi makan siang petugas damkar, 6 orang (HokBen)', 349100, NULL)
) AS expense(description, amount, pic)
WHERE a.source_pengumuman_id = '7cd29f72-8559-4306-ad02-8e389f0d6d29'
ON CONFLICT (activity_id, description) DO UPDATE SET
  amount = EXCLUDED.amount,
  pic = EXCLUDED.pic,
  expense_date = EXCLUDED.expense_date;

-- Pastikan PostgREST segera mengenali tabel dan RPC baru.
NOTIFY pgrst, 'reload schema';
