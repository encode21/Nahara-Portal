# Checklist Auth + tiga host Nahara

## Domain (Vercel — satu project)

| Host | Fungsi |
|------|--------|
| `nahara.id` (+ www → apex) | **Landing** — pilih Portal Warga atau Masuk Pengurus |
| `portal.nahara.id` | **Portal warga** (transparansi, tanpa login) |
| `ops.nahara.id` | **Ops** — login Estate / RT-RW / Admin |

Env production:

```
NEXT_PUBLIC_LANDING_HOST=nahara.id
NEXT_PUBLIC_PORTAL_HOST=portal.nahara.id
NEXT_PUBLIC_OPS_HOST=ops.nahara.id
NEXT_PUBLIC_SITE_URL=https://nahara.id
```

## Alur

1. Orang buka `nahara.id` → halaman pilih (bukan tebak warga vs estate)
2. **Portal Warga** → `portal.nahara.id`
3. **Masuk Pengurus** → `ops.nahara.id/login`
4. Deep link `nahara.id/pengaduan` → redirect ke `portal.nahara.id/pengaduan`
5. `nahara.id/login` → redirect ke `ops.nahara.id/login`

## App Metadata (SQL Editor)

```sql
UPDATE auth.users
SET raw_app_meta_data =
  coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role": "estate"}'::jsonb
WHERE email = 'estate@example.com';
```

Role: `admin` | `estate` | `rtrw` — lalu logout/login ulang di ops.

## Auth wajib

- [ ] Disable public signup
- [ ] Password + rate limit Auth
- [ ] Redeploy setelah ubah env domain
