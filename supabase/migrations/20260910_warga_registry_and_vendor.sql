-- Nahara Portal — Warga registry (KK/KTP), vendor, registry roles
-- Roles: ketua | it | sekretaris (+ admin) via app_metadata.role

CREATE OR REPLACE FUNCTION public.is_warga_registry()
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = pg_catalog, public
AS $$
  SELECT coalesce(
    (auth.jwt() -> 'app_metadata' ->> 'role') IN (
      'admin', 'ketua', 'it', 'sekretaris'
    ),
    false
  );
$$;

REVOKE ALL ON FUNCTION public.is_warga_registry() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_warga_registry() TO anon, authenticated;

-- Warga directory write: admin OR registry roles
DROP POLICY IF EXISTS "admin_all_warga" ON warga;
CREATE POLICY "registry_all_warga"
  ON warga FOR ALL TO authenticated
  USING (public.is_warga_registry())
  WITH CHECK (public.is_warga_registry());

-- ========== warga_dokumen (private KK/KTP metadata) ==========

CREATE TABLE IF NOT EXISTS public.warga_dokumen (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  warga_id uuid NOT NULL REFERENCES public.warga(id) ON DELETE CASCADE,
  jenis text NOT NULL CHECK (jenis IN ('kk', 'ktp')),
  nomor text,
  nama_tertera text,
  storage_path text NOT NULL,
  uploaded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS warga_dokumen_warga_id_idx
  ON public.warga_dokumen (warga_id);

-- One active KK per household
CREATE UNIQUE INDEX IF NOT EXISTS warga_dokumen_one_kk_per_warga
  ON public.warga_dokumen (warga_id)
  WHERE jenis = 'kk';

ALTER TABLE public.warga_dokumen ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "registry_all_warga_dokumen" ON public.warga_dokumen;
CREATE POLICY "registry_all_warga_dokumen"
  ON public.warga_dokumen FOR ALL TO authenticated
  USING (public.is_warga_registry())
  WITH CHECK (public.is_warga_registry());

-- ========== warga_anggota ==========

CREATE TABLE IF NOT EXISTS public.warga_anggota (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  warga_id uuid NOT NULL REFERENCES public.warga(id) ON DELETE CASCADE,
  nama text NOT NULL,
  hubungan text NOT NULL CHECK (
    hubungan IN ('kepala', 'istri', 'anak', 'lainnya')
  ),
  nik text,
  dokumen_id uuid REFERENCES public.warga_dokumen(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS warga_anggota_warga_id_idx
  ON public.warga_anggota (warga_id);

ALTER TABLE public.warga_anggota ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "registry_all_warga_anggota" ON public.warga_anggota;
CREATE POLICY "registry_all_warga_anggota"
  ON public.warga_anggota FOR ALL TO authenticated
  USING (public.is_warga_registry())
  WITH CHECK (public.is_warga_registry());

-- ========== vendor ==========

CREATE TABLE IF NOT EXISTS public.vendor (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nama text NOT NULL,
  kategori text NOT NULL CHECK (
    kategori IN (
      'tukang', 'galon', 'taman', 'gorden', 'furniture', 'lainnya'
    )
  ),
  telepon text,
  whatsapp text,
  catatan text,
  aktif boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS vendor_kategori_aktif_idx
  ON public.vendor (kategori, aktif);

ALTER TABLE public.vendor ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_vendor_aktif" ON public.vendor;
CREATE POLICY "public_read_vendor_aktif"
  ON public.vendor FOR SELECT TO anon, authenticated
  USING (aktif = true OR public.is_warga_registry());

DROP POLICY IF EXISTS "registry_write_vendor" ON public.vendor;
CREATE POLICY "registry_write_vendor"
  ON public.vendor FOR ALL TO authenticated
  USING (public.is_warga_registry())
  WITH CHECK (public.is_warga_registry());

-- ========== Private storage: warga-dokumen ==========

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'warga-dokumen',
  'warga-dokumen',
  false,
  10485760,
  ARRAY[
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/pdf'
  ]::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DO $$
DECLARE pol record;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname LIKE '%warga_dokumen%'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "registry_select_warga_dokumen"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'warga-dokumen'
    AND public.is_warga_registry()
  );

CREATE POLICY "registry_insert_warga_dokumen"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'warga-dokumen'
    AND public.is_warga_registry()
  );

CREATE POLICY "registry_update_warga_dokumen"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'warga-dokumen'
    AND public.is_warga_registry()
  )
  WITH CHECK (
    bucket_id = 'warga-dokumen'
    AND public.is_warga_registry()
  );

CREATE POLICY "registry_delete_warga_dokumen"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'warga-dokumen'
    AND public.is_warga_registry()
  );
