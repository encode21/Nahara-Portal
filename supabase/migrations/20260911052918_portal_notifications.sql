-- Nahara Portal — Resident notification inbox (event model)
-- Broadcast events + per-household read state; personal events for pengaduan.
-- Push subscriptions are associated with warga_id (household identity).

-- ========== notification_events ==========

CREATE TABLE IF NOT EXISTS public.notification_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL,
  category text NOT NULL
    CHECK (category IN ('announcement', 'event', 'report', 'emergency', 'system')),
  title text NOT NULL,
  message text NOT NULL,
  source_type text NOT NULL,
  source_id uuid NOT NULL,
  target_type text NOT NULL DEFAULT 'all'
    CHECK (target_type IN ('all', 'block', 'household', 'user')),
  target_id text,
  target_key text GENERATED ALWAYS AS (COALESCE(target_id, '')) STORED,
  target_url text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT notification_events_title_len CHECK (char_length(trim(title)) >= 1),
  CONSTRAINT notification_events_message_len CHECK (char_length(trim(message)) >= 1),
  CONSTRAINT notification_events_target_id_check CHECK (
    (target_type = 'all' AND target_id IS NULL)
    OR (target_type <> 'all' AND target_id IS NOT NULL)
  ),
  CONSTRAINT notification_events_idempotent_uid
    UNIQUE (type, source_type, source_id, target_type, target_key)
);

CREATE INDEX IF NOT EXISTS notification_events_created_idx
  ON public.notification_events (created_at DESC);

CREATE INDEX IF NOT EXISTS notification_events_category_created_idx
  ON public.notification_events (category, created_at DESC);

CREATE INDEX IF NOT EXISTS notification_events_target_idx
  ON public.notification_events (target_type, target_id, created_at DESC);

ALTER TABLE public.notification_events ENABLE ROW LEVEL SECURITY;

-- No direct table access for anon/authenticated — use SECURITY DEFINER RPCs.
DROP POLICY IF EXISTS "deny_direct_notification_events" ON public.notification_events;
-- Explicit: admins may read for debugging
DROP POLICY IF EXISTS "admin_read_notification_events" ON public.notification_events;
CREATE POLICY "admin_read_notification_events"
  ON public.notification_events FOR SELECT TO authenticated
  USING (public.is_portal_admin());

-- ========== notification_reads ==========

CREATE TABLE IF NOT EXISTS public.notification_reads (
  notification_id uuid NOT NULL
    REFERENCES public.notification_events(id) ON DELETE CASCADE,
  warga_id uuid NOT NULL
    REFERENCES public.warga(id) ON DELETE CASCADE,
  read_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (notification_id, warga_id)
);

CREATE INDEX IF NOT EXISTS notification_reads_warga_idx
  ON public.notification_reads (warga_id, read_at DESC);

ALTER TABLE public.notification_reads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_read_notification_reads" ON public.notification_reads;
CREATE POLICY "admin_read_notification_reads"
  ON public.notification_reads FOR SELECT TO authenticated
  USING (public.is_portal_admin());

-- ========== portal_push_subscriptions ==========

CREATE TABLE IF NOT EXISTS public.portal_push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  warga_id uuid NOT NULL REFERENCES public.warga(id) ON DELETE CASCADE,
  endpoint text NOT NULL,
  p256dh text NOT NULL,
  auth text NOT NULL,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_active_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT portal_push_endpoint_len CHECK (char_length(trim(endpoint)) >= 10),
  CONSTRAINT portal_push_p256dh_len CHECK (char_length(trim(p256dh)) >= 8),
  CONSTRAINT portal_push_auth_len CHECK (char_length(trim(auth)) >= 8)
);

CREATE UNIQUE INDEX IF NOT EXISTS portal_push_subscriptions_endpoint_uidx
  ON public.portal_push_subscriptions (endpoint);

CREATE INDEX IF NOT EXISTS portal_push_subscriptions_warga_idx
  ON public.portal_push_subscriptions (warga_id);

ALTER TABLE public.portal_push_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_read_portal_push" ON public.portal_push_subscriptions;
CREATE POLICY "admin_read_portal_push"
  ON public.portal_push_subscriptions FOR SELECT TO authenticated
  USING (public.is_portal_admin());

-- ========== helpers ==========

CREATE OR REPLACE FUNCTION public.normalize_blok_label(p text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT lower(regexp_replace(trim(COALESCE(p, '')), '\s+', '', 'g'));
$$;

CREATE OR REPLACE FUNCTION public.resolve_warga_id_from_blok(p_blok text)
RETURNS uuid
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT w.id
  FROM public.warga w
  WHERE public.normalize_blok_label(w.blok) = public.normalize_blok_label(p_blok)
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.insert_notification_event(
  p_type text,
  p_category text,
  p_title text,
  p_message text,
  p_source_type text,
  p_source_id uuid,
  p_target_type text,
  p_target_id text,
  p_target_url text,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
BEGIN
  INSERT INTO public.notification_events (
    type, category, title, message,
    source_type, source_id,
    target_type, target_id, target_url, metadata
  ) VALUES (
    p_type, p_category, p_title, p_message,
    p_source_type, p_source_id,
    p_target_type, p_target_id, p_target_url,
    COALESCE(p_metadata, '{}'::jsonb)
  )
  ON CONFLICT (type, source_type, source_id, target_type, target_key)
  DO UPDATE SET
    title = EXCLUDED.title,
    message = EXCLUDED.message,
    target_url = EXCLUDED.target_url,
    metadata = EXCLUDED.metadata,
    created_at = now()
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.insert_notification_event(
  text, text, text, text, text, uuid, text, text, text, jsonb
) FROM PUBLIC;

-- Visibility predicate for a household
CREATE OR REPLACE FUNCTION public.notification_visible_to_warga(
  p_event public.notification_events,
  p_warga_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
DECLARE
  v_blok_row text;
BEGIN
  IF p_event.target_type = 'all' THEN
    RETURN true;
  END IF;

  IF p_event.target_type = 'household' THEN
    RETURN p_event.target_id = p_warga_id::text;
  END IF;

  IF p_event.target_type = 'block' THEN
    SELECT blok_row INTO v_blok_row FROM public.warga WHERE id = p_warga_id;
    RETURN v_blok_row IS NOT NULL AND p_event.target_id = v_blok_row;
  END IF;

  -- 'user' reserved; not used for warga portal yet
  RETURN false;
END;
$$;

-- ========== list / unread / mark RPCs ==========

CREATE OR REPLACE FUNCTION public.list_portal_notifications(
  p_warga_id uuid,
  p_category text DEFAULT NULL,
  p_limit int DEFAULT 20,
  p_before timestamptz DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  type text,
  category text,
  title text,
  message text,
  source_type text,
  source_id uuid,
  target_type text,
  target_id text,
  target_url text,
  metadata jsonb,
  created_at timestamptz,
  read_at timestamptz,
  is_read boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_limit int := GREATEST(1, LEAST(COALESCE(p_limit, 20), 50));
BEGIN
  IF p_warga_id IS NULL OR NOT EXISTS (SELECT 1 FROM public.warga w WHERE w.id = p_warga_id) THEN
    RAISE EXCEPTION 'Identitas rumah tidak valid.';
  END IF;

  IF p_category IS NOT NULL AND p_category NOT IN (
    'announcement', 'event', 'report', 'emergency', 'system'
  ) THEN
    RAISE EXCEPTION 'Kategori tidak valid.';
  END IF;

  RETURN QUERY
  SELECT
    e.id,
    e.type,
    e.category,
    e.title,
    e.message,
    e.source_type,
    e.source_id,
    e.target_type,
    e.target_id,
    e.target_url,
    e.metadata,
    e.created_at,
    r.read_at,
    (r.read_at IS NOT NULL) AS is_read
  FROM public.notification_events e
  LEFT JOIN public.notification_reads r
    ON r.notification_id = e.id AND r.warga_id = p_warga_id
  WHERE public.notification_visible_to_warga(e, p_warga_id)
    AND (p_category IS NULL OR e.category = p_category)
    AND (p_before IS NULL OR e.created_at < p_before)
  ORDER BY e.created_at DESC
  LIMIT v_limit;
END;
$$;

REVOKE ALL ON FUNCTION public.list_portal_notifications(uuid, text, int, timestamptz) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_portal_notifications(uuid, text, int, timestamptz)
  TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.count_unread_portal_notifications(p_warga_id uuid)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count bigint;
BEGIN
  IF p_warga_id IS NULL OR NOT EXISTS (SELECT 1 FROM public.warga w WHERE w.id = p_warga_id) THEN
    RETURN 0;
  END IF;

  SELECT COUNT(*)::bigint INTO v_count
  FROM public.notification_events e
  LEFT JOIN public.notification_reads r
    ON r.notification_id = e.id AND r.warga_id = p_warga_id
  WHERE public.notification_visible_to_warga(e, p_warga_id)
    AND r.read_at IS NULL;

  RETURN COALESCE(v_count, 0);
END;
$$;

REVOKE ALL ON FUNCTION public.count_unread_portal_notifications(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.count_unread_portal_notifications(uuid)
  TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.mark_portal_notification_read(
  p_warga_id uuid,
  p_notification_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_event public.notification_events%ROWTYPE;
BEGIN
  IF p_warga_id IS NULL OR NOT EXISTS (SELECT 1 FROM public.warga w WHERE w.id = p_warga_id) THEN
    RAISE EXCEPTION 'Identitas rumah tidak valid.';
  END IF;

  SELECT * INTO v_event
  FROM public.notification_events
  WHERE id = p_notification_id;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  IF NOT public.notification_visible_to_warga(v_event, p_warga_id) THEN
    RAISE EXCEPTION 'Notifikasi tidak tersedia untuk rumah ini.';
  END IF;

  INSERT INTO public.notification_reads (notification_id, warga_id, read_at)
  VALUES (p_notification_id, p_warga_id, now())
  ON CONFLICT (notification_id, warga_id) DO NOTHING;

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.mark_portal_notification_read(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.mark_portal_notification_read(uuid, uuid)
  TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.mark_all_portal_notifications_read(p_warga_id uuid)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_n bigint;
BEGIN
  IF p_warga_id IS NULL OR NOT EXISTS (SELECT 1 FROM public.warga w WHERE w.id = p_warga_id) THEN
    RAISE EXCEPTION 'Identitas rumah tidak valid.';
  END IF;

  INSERT INTO public.notification_reads (notification_id, warga_id, read_at)
  SELECT e.id, p_warga_id, now()
  FROM public.notification_events e
  LEFT JOIN public.notification_reads r
    ON r.notification_id = e.id AND r.warga_id = p_warga_id
  WHERE public.notification_visible_to_warga(e, p_warga_id)
    AND r.read_at IS NULL
  ON CONFLICT (notification_id, warga_id) DO NOTHING;

  GET DIAGNOSTICS v_n = ROW_COUNT;
  RETURN COALESCE(v_n, 0);
END;
$$;

REVOKE ALL ON FUNCTION public.mark_all_portal_notifications_read(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.mark_all_portal_notifications_read(uuid)
  TO anon, authenticated;

-- ========== push subscription RPCs ==========

CREATE OR REPLACE FUNCTION public.upsert_portal_push_subscription(
  p_warga_id uuid,
  p_endpoint text,
  p_p256dh text,
  p_auth text,
  p_user_agent text DEFAULT NULL
)
RETURNS public.portal_push_subscriptions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.portal_push_subscriptions%ROWTYPE;
BEGIN
  IF p_warga_id IS NULL OR NOT EXISTS (SELECT 1 FROM public.warga w WHERE w.id = p_warga_id) THEN
    RAISE EXCEPTION 'Identitas rumah tidak valid.';
  END IF;

  IF char_length(trim(COALESCE(p_endpoint, ''))) < 10
     OR char_length(trim(COALESCE(p_p256dh, ''))) < 8
     OR char_length(trim(COALESCE(p_auth, ''))) < 8 THEN
    RAISE EXCEPTION 'Data subscription tidak valid.';
  END IF;

  INSERT INTO public.portal_push_subscriptions (
    warga_id, endpoint, p256dh, auth, user_agent, last_active_at
  ) VALUES (
    p_warga_id,
    trim(p_endpoint),
    trim(p_p256dh),
    trim(p_auth),
    NULLIF(trim(COALESCE(p_user_agent, '')), ''),
    now()
  )
  ON CONFLICT (endpoint) DO UPDATE
  SET
    warga_id = EXCLUDED.warga_id,
    p256dh = EXCLUDED.p256dh,
    auth = EXCLUDED.auth,
    user_agent = EXCLUDED.user_agent,
    last_active_at = now()
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

REVOKE ALL ON FUNCTION public.upsert_portal_push_subscription(
  uuid, text, text, text, text
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.upsert_portal_push_subscription(
  uuid, text, text, text, text
) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_portal_push_subscriptions_for_notification(
  p_notification_id uuid
)
RETURNS SETOF public.portal_push_subscriptions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_event public.notification_events%ROWTYPE;
BEGIN
  IF NOT public.is_portal_ops() THEN
    RAISE EXCEPTION 'Hanya pengurus yang dapat mengirim push.';
  END IF;

  SELECT * INTO v_event
  FROM public.notification_events
  WHERE id = p_notification_id;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  IF v_event.target_type = 'all' THEN
    RETURN QUERY SELECT * FROM public.portal_push_subscriptions;
  ELSIF v_event.target_type = 'household' THEN
    RETURN QUERY
      SELECT * FROM public.portal_push_subscriptions
      WHERE warga_id::text = v_event.target_id;
  ELSIF v_event.target_type = 'block' THEN
    RETURN QUERY
      SELECT s.*
      FROM public.portal_push_subscriptions s
      JOIN public.warga w ON w.id = s.warga_id
      WHERE w.blok_row = v_event.target_id;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.get_portal_push_subscriptions_for_notification(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_portal_push_subscriptions_for_notification(uuid)
  TO authenticated;

CREATE OR REPLACE FUNCTION public.find_portal_notification_for_source(
  p_source_type text,
  p_source_id uuid,
  p_type text DEFAULT NULL
)
RETURNS SETOF public.notification_events
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_portal_ops() THEN
    RAISE EXCEPTION 'Hanya pengurus yang dapat mencari notifikasi sumber.';
  END IF;

  RETURN QUERY
  SELECT *
  FROM public.notification_events e
  WHERE e.source_type = p_source_type
    AND e.source_id = p_source_id
    AND (p_type IS NULL OR e.type = p_type)
  ORDER BY e.created_at DESC
  LIMIT 5;
END;
$$;

REVOKE ALL ON FUNCTION public.find_portal_notification_for_source(text, uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.find_portal_notification_for_source(text, uuid, text)
  TO authenticated;

-- ========== domain triggers ==========

CREATE OR REPLACE FUNCTION public.notify_portal_on_pengumuman()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.insert_notification_event(
      'announcement_created',
      'announcement',
      'Pengumuman Baru',
      LEFT(NEW.judul, 160),
      'pengumuman',
      NEW.id,
      'all',
      NULL,
      '/pengumuman',
      jsonb_build_object('judul', NEW.judul)
    );
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.judul IS DISTINCT FROM OLD.judul
       OR NEW.isi IS DISTINCT FROM OLD.isi THEN
      PERFORM public.insert_notification_event(
        'announcement_updated',
        'announcement',
        'Pengumuman Diperbarui',
        LEFT(NEW.judul, 160),
        'pengumuman',
        NEW.id,
        'all',
        NULL,
        '/pengumuman',
        jsonb_build_object('judul', NEW.judul)
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_portal_notify_pengumuman ON public.pengumuman;
CREATE TRIGGER trg_portal_notify_pengumuman
  AFTER INSERT OR UPDATE ON public.pengumuman
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_portal_on_pengumuman();

CREATE OR REPLACE FUNCTION public.format_activity_when(p_date timestamptz)
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT trim(
    to_char(p_date AT TIME ZONE 'Asia/Jakarta', 'Dy, DD Mon · HH24:MI')
  );
$$;

CREATE OR REPLACE FUNCTION public.notify_portal_on_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_msg text;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_msg := LEFT(
      NEW.title || ' — ' || public.format_activity_when(NEW.date),
      180
    );
    PERFORM public.insert_notification_event(
      'event_created',
      'event',
      'Kegiatan Baru',
      v_msg,
      'activities',
      NEW.id,
      'all',
      NULL,
      '/kegiatan/' || NEW.id::text,
      jsonb_build_object('title', NEW.title, 'date', NEW.date, 'location', NEW.location)
    );
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.date IS DISTINCT FROM OLD.date
       OR NEW.location IS DISTINCT FROM OLD.location
       OR NEW.title IS DISTINCT FROM OLD.title THEN
      v_msg := LEFT(
        NEW.title || ' — ' || public.format_activity_when(NEW.date)
        || COALESCE(' · ' || NULLIF(NEW.location, ''), ''),
        180
      );
      PERFORM public.insert_notification_event(
        'event_updated',
        'event',
        'Kegiatan Diperbarui',
        v_msg,
        'activities',
        NEW.id,
        'all',
        NULL,
        '/kegiatan/' || NEW.id::text,
        jsonb_build_object('title', NEW.title, 'date', NEW.date, 'location', NEW.location)
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_portal_notify_activity ON public.activities;
CREATE TRIGGER trg_portal_notify_activity
  AFTER INSERT OR UPDATE ON public.activities
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_portal_on_activity();

CREATE OR REPLACE FUNCTION public.notify_portal_on_pengaduan()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_warga_id uuid;
  v_type text;
  v_title text;
  v_message text;
  v_summary text;
BEGIN
  v_warga_id := public.resolve_warga_id_from_blok(NEW.blok);
  IF v_warga_id IS NULL THEN
    RETURN NEW;
  END IF;

  v_summary := LEFT(
    COALESCE(NULLIF(trim(NEW.deskripsi), ''), NEW.kategori),
    100
  );

  IF TG_OP = 'INSERT' THEN
    PERFORM public.insert_notification_event(
      'report_received',
      'report',
      'Pengaduan Diterima',
      'Pengaduan Anda telah diterima: ' || v_summary,
      'pengaduan',
      NEW.id,
      'household',
      v_warga_id::text,
      '/pengaduan/' || NEW.id::text,
      jsonb_build_object('status', NEW.status, 'kode', NEW.kode)
    );
    RETURN NEW;
  END IF;

  IF NEW.status IS NOT DISTINCT FROM OLD.status THEN
    RETURN NEW;
  END IF;

  IF NEW.status = 'Diproses' THEN
    v_type := 'report_in_progress';
    v_title := 'Pengaduan Sedang Diproses';
    v_message := 'Laporan Anda sedang ditangani: ' || v_summary;
  ELSIF NEW.status = 'Selesai' THEN
    v_type := 'report_resolved';
    v_title := 'Pengaduan Selesai';
    v_message := 'Laporan Anda telah diselesaikan: ' || v_summary;
  ELSIF NEW.status = 'Ditolak' THEN
    v_type := 'report_resolved';
    v_title := 'Pengaduan Ditutup';
    v_message := 'Pengaduan Anda telah ditutup: ' || v_summary;
  ELSIF NEW.status = 'Baru' THEN
    v_type := 'report_received';
    v_title := 'Pengaduan Diterima';
    v_message := 'Pengaduan Anda telah diterima pengurus.';
  ELSE
    RETURN NEW;
  END IF;

  PERFORM public.insert_notification_event(
    v_type,
    'report',
    v_title,
    v_message,
    'pengaduan',
    NEW.id,
    'household',
    v_warga_id::text,
    '/pengaduan/' || NEW.id::text,
    jsonb_build_object('status', NEW.status, 'kode', NEW.kode)
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_portal_notify_pengaduan ON public.pengaduan;
CREATE TRIGGER trg_portal_notify_pengaduan
  AFTER INSERT OR UPDATE OF status ON public.pengaduan
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_portal_on_pengaduan();

CREATE OR REPLACE FUNCTION public.notify_portal_on_pengaduan_komentar()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pengaduan public.pengaduan%ROWTYPE;
  v_warga_id uuid;
BEGIN
  IF NOT COALESCE(NEW.is_pengurus, false) THEN
    RETURN NEW;
  END IF;

  SELECT * INTO v_pengaduan FROM public.pengaduan WHERE id = NEW.pengaduan_id;
  IF NOT FOUND THEN
    RETURN NEW;
  END IF;

  v_warga_id := public.resolve_warga_id_from_blok(v_pengaduan.blok);
  IF v_warga_id IS NULL THEN
    RETURN NEW;
  END IF;

  PERFORM public.insert_notification_event(
    'report_replied',
    'report',
    'Ada Balasan Baru',
    LEFT('Balasan pengurus: ' || NEW.pesan, 160),
    'pengaduan_komentar',
    NEW.id,
    'household',
    v_warga_id::text,
    '/pengaduan/' || v_pengaduan.id::text,
    jsonb_build_object(
      'pengaduan_id', v_pengaduan.id,
      'komentar_id', NEW.id,
      'kode', v_pengaduan.kode
    )
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_portal_notify_pengaduan_komentar ON public.pengaduan_komentar;
CREATE TRIGGER trg_portal_notify_pengaduan_komentar
  AFTER INSERT ON public.pengaduan_komentar
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_portal_on_pengaduan_komentar();

-- Emergency (future-ready): notify reporter household on create / status change
CREATE OR REPLACE FUNCTION public.notify_portal_on_emergency()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_warga_id uuid;
BEGIN
  v_warga_id := COALESCE(
    NEW.warga_id,
    public.resolve_warga_id_from_blok(NEW.reporter_blok)
  );
  IF v_warga_id IS NULL THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    PERFORM public.insert_notification_event(
      'emergency_created',
      'emergency',
      'Laporan Darurat Terkirim',
      'Laporan darurat Anda telah dicatat.',
      'emergency_incidents',
      NEW.id,
      'household',
      v_warga_id::text,
      '/darurat',
      jsonb_build_object('kind', NEW.kind, 'status', NEW.status, 'kode', NEW.kode)
    );
    RETURN NEW;
  END IF;

  IF NEW.status IS NOT DISTINCT FROM OLD.status THEN
    RETURN NEW;
  END IF;

  PERFORM public.insert_notification_event(
    'emergency_updated',
    'emergency',
    'Update Laporan Darurat',
    'Status darurat: ' || NEW.status,
    'emergency_incidents',
    NEW.id,
    'household',
    v_warga_id::text,
    '/darurat',
    jsonb_build_object('kind', NEW.kind, 'status', NEW.status, 'kode', NEW.kode)
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_portal_notify_emergency ON public.emergency_incidents;
CREATE TRIGGER trg_portal_notify_emergency
  AFTER INSERT OR UPDATE OF status ON public.emergency_incidents
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_portal_on_emergency();
