# Checklist keamanan Auth (Supabase)

Jalankan di **Supabase Dashboard** setelah deploy migration `20260807_harden_portal_security.sql`.

## Wajib

- [ ] **Disable public signup** — Authentication → Providers → Email: matikan pendaftaran publik / jangan izinkan user membuat akun sendiri
- [ ] Buat akun pengurus hanya lewat **Authentication → Users → Add user** (atau Invite)
- [ ] Untuk setiap pengurus, set **App Metadata**:
  ```json
  { "role": "admin" }
  ```
- [ ] Akun petugas security yang hanya pantau notifikasi: **tanpa** `"role": "admin"`
- [ ] Password policy: panjang minimum kuat (project Auth settings)
- [ ] Rate limiting / proteksi brute-force Auth (sesuai paket project)

## Sesuai kebutuhan

- [ ] Review JWT / session expiry
- [ ] MFA untuk akun admin (jika tersedia)
- [ ] Pastikan `NEXT_PUBLIC_SITE_URL` dan domain Vercel konsisten (`nahara.id`)

## Verifikasi cepat

| Akun | Harus bisa | Harus gagal |
|------|------------|-------------|
| Anon | Baca portal, kirim pengaduan, twibbon | Mutasi kas/warga, upload `kegiatan/` |
| Security (tanpa admin) | Login, notifikasi sendiri | `/activities`, ubah iuran/kas |
| Admin (`role=admin`) | Kelola penuh | — |
| `?redirect=//evil.com` setelah login | Jatuh ke `/dashboard` | Redirect keluar domain |
