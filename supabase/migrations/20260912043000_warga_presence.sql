-- Track portal presence (last seen) for identified warga households.

ALTER TABLE public.warga
  ADD COLUMN IF NOT EXISTS last_seen_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_path text;

COMMENT ON COLUMN public.warga.last_seen_at IS
  'Last portal heartbeat when household identity was confirmed.';
COMMENT ON COLUMN public.warga.last_path IS
  'Last portal pathname reported by presence heartbeat.';

CREATE OR REPLACE FUNCTION public.touch_warga_presence(
  p_warga_id uuid,
  p_path text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_path text;
BEGIN
  IF p_warga_id IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.warga w WHERE w.id = p_warga_id
  ) THEN
    RAISE EXCEPTION 'Identitas rumah tidak valid.';
  END IF;

  v_path := NULLIF(trim(COALESCE(p_path, '')), '');
  IF v_path IS NOT NULL AND char_length(v_path) > 200 THEN
    v_path := left(v_path, 200);
  END IF;
  IF v_path IS NOT NULL AND left(v_path, 1) <> '/' THEN
    v_path := NULL;
  END IF;

  UPDATE public.warga
  SET
    last_seen_at = now(),
    last_path = COALESCE(v_path, last_path)
  WHERE id = p_warga_id;
END;
$$;

REVOKE ALL ON FUNCTION public.touch_warga_presence(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.touch_warga_presence(uuid, text) TO anon, authenticated;
