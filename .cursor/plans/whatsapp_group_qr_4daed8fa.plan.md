---
name: WhatsApp Group QR
overview: Tambah kartu “Keluarga Nahara” di Dashboard portal dengan QR grup WhatsApp dan tombol join ke invite link yang sudah ada.
todos:
  - id: asset-qr
    content: Crop & simpan QR ke public/assets/whatsapp-keluarga-nahara-qr.png
    status: in_progress
  - id: const-card
    content: Tambah konstanta + WhatsAppGroupCard, wire ke dashboard setelah QuickActions
    status: pending
isProject: false
---

# QR Grup WhatsApp di Dashboard Portal

## Asumsi

- “Halaman depan portal” = [`/dashboard`](<app/(portal)/dashboard/page.tsx>) (Beranda).
- Kartu kompak setelah **Aksi cepat**, sebelum Situation Center — mudah terlihat tanpa mengganggu ringkasan/peta.
- Landing `nahara.id` tidak diubah.

## Pendekatan

1. Simpan aset QR ke `public/assets/whatsapp-keluarga-nahara-qr.png` (crop dari screenshot yang dilampirkan supaya fokus ke kode QR + label grup, bukan full-screen green).
2. Konstanta invite di [`lib/constants/`](lib/constants/) (mis. `community.ts`):
   - nama: `Keluarga Nahara`
   - URL: `https://chat.whatsapp.com/B9cZ10ms1KvJKowbd2yxXk` (tanpa query tracking `mode=gi_t` jika tidak perlu; link tetap valid)
   - path QR: `/assets/whatsapp-keluarga-nahara-qr.png`
3. Komponen client/server sederhana `components/dashboard/WhatsAppGroupCard.tsx`:
   - `glass-card` + judul “Grup WhatsApp”
   - gambar QR (Next `Image`, ukuran tetap ~160–200px, `alt` jelas)
   - teks singkat: scan QR atau gabung lewat tombol
   - CTA `btn-primary` / link eksternal `target="_blank" rel="noopener noreferrer"` → invite URL
4. Pasang di [`app/(portal)/dashboard/page.tsx`](<app/(portal)/dashboard/page.tsx>) tepat setelah `<QuickActions />`.

## Yang tidak diubah

- Quick actions FAB, landing page, `/layanan`
- Tidak generate QR dinamis (pakai gambar yang kamu kasih)

## Verifikasi

- Buka `/dashboard` (portal): kartu tampil, QR terbaca, tombol buka invite WhatsApp.
- Mobile: QR tidak overflow; tombol mudah diketuk.
