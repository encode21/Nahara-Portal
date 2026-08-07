# Checklist keamanan Auth + dual-host (Supabase / Vercel)

Jalankan migration `20260807_harden_portal_security.sql`, lalu atur Auth dan domain.

## Domain (Vercel)

- [ ] Domain **`nahara.id`** (+ www → apex) → project Nahara (**ops** / login pengurus)
- [ ] Domain **`portal.nahara.id`** → project yang sama (**portal warga**)
- [ ] Env production:
  - `NEXT_PUBLIC_PORTAL_HOST=portal.nahara.id`
  - `NEXT_PUBLIC_OPS_HOST=nahara.id`
  - `NEXT_PUBLIC_SITE_URL=https://portal.nahara.id`

## Perilaku host

| Siapa | URL |
|-------|-----|
| Warga | `https://portal.nahara.id` |
| Anon di `nahara.id` | Hard redirect → portal (kecuali `/login`) |
| Estate / RT-RW / Admin | `https://nahara.id/login` lalu sesuai role |

## App Metadata (Authentication → Users → user → App Metadata)

Pengurus penuh:
```json
{ "role": "admin" }
```

Estate:
```json
{ "role": "estate" }
```

RT/RW:
```json
{ "role": "rtrw" }
```

Petugas security (notifikasi saja): **jangan** set `role` admin/estate/rtrw kecuali memang perlu.

Setelah mengubah metadata: **logout lalu login lagi**.

## Auth wajib

- [ ] Disable public email signup (invite / Add user manual)
- [ ] Password policy kuat
- [ ] Rate limiting Auth aktif

## Verifikasi cepat

| Kasus | Hasil |
|-------|--------|
| Buka `nahara.id/dashboard` tanpa login | Redirect ke `portal.nahara.id/dashboard` |
| Buka `nahara.id/login` | Form login tetap di ops |
| Login `estate` / `rtrw` | Nav: Pengumuman, Kegiatan, Pengaduan; tidak ada Iuran/Keuangan |
| Login `admin` | Full + Kelola |
| Anon di portal | Baca penuh termasuk keuangan (transparansi) |
| `?redirect=//evil.com` | Ditolak → path aman internal |
