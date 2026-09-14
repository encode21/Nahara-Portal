# Nahara Reference

Referensi visual Cluster Nahara untuk desain UI, ilustrasi, dan dokumentasi produk.

Gunakan folder ini sebagai **sumber kebenaran tampilan lingkungan** — bukan aset runtime. Aset yang dipakai di app tetap di `public/`.

---

## Struktur

```
docs/nahara-reference/
├── README.md
├── siteplan-current.png      # Peta Lingkungan (screenshot UI)
├── street-environment.jpg    # Suasana jalan + warga
├── aerial-environment.jpg    # Foto drone / aerial
├── type-5-reference-01.png   # Tipe 5 — compact, 2 jendela
├── type-7-reference-01.png   # Tipe 7 — medium, 3 jendela
└── type-9-reference-01.png   # Tipe 9 — premium, carport 3
```

---

## Lingkungan

### `siteplan-current.png` — Peta Lingkungan

Screenshot peta interaktif saat ini (fitur Peta Lingkungan di portal).

| Aspek | Catatan |
| --- | --- |
| Blok | Nahara Barat / Nahara Timur, baris 1–3 & 6 |
| Jalan | ROW 9, Nahara Boulevard Timur |
| ID kavling | Contoh: `NHB-6/12` |
| Status | **Lunas** (hijau) · **Belum Bayar** (merah) · **Kontrak** (coklat) · **Kosong** (abu) |
| Area khusus | **RC** (Resource Center / fasilitas) |

Pakai untuk menyelaraskan overlay status, label blok, dan interaksi tooltip di peta.

### `street-environment.jpg` — Suasana jalan

Foto ground-level: paving block, rumah putih berjajar, pepohonan, satpam, warga, dan anak bersepeda.

Ciri visual yang harus konsisten di UI/hero:

- Jalan paving interlocking (abu + aksen merah tua)
- Rumah 2 lantai putih, aksen hitam (railing, carport)
- Lansekap tropis (palem, semak rendah)
- Nuansa komunitas aman & ramah keluarga

### `aerial-environment.jpg` — Aerial / drone

Foto drone kawasan: deretan rumah mengelilingi area hijau / minigolf di tengah.

Ciri:

- Deretan atap abu gelap + fasad putih
- Jalan paving lebar (abu + border merah)
- Taman tengah dengan bunker putih & bangku bundar
- Pohon & lansekap tersusun rapi

Cocok untuk hero, OG image, atau backdrop halaman publik.

---

## Tipe rumah

Palet bersama semua tipe: **putih bersih** + **hitam/abu gelap** (kusen, atap, carport) + molding klasik modern.

### Type 5 — Compact

| File | Isi |
| --- | --- |
| `type-5-reference-01.png` | Deretan terrace, tampak depan miring |

**Ciri pembeda**

- Paling ringkas / lebar kavling lebih sempit
- **2 jendela depan** (jendela utama + 1 slit sempit di samping)
- Carport 1–2 mobil, kanopi flat hitam
- Atap hip individual per unit

### Type 7 — Medium

| File | Isi |
| --- | --- |
| `type-7-reference-01.png` | Deretan terrace, sudut elevated |

**Ciri pembeda**

- Ukuran medium
- **3 jendela depan** — jendela utama di bay tengah + 2 slit sempit di kiri & kanan
- Proporsi lebih lebar dari Type 5, lebih kecil dari Type 9
- Carport ~2, kanopi flat hitam

### Type 9 — Premium

| File | Isi |
| --- | --- |
| `type-9-reference-01.png` | Unit corner / premium, suasana malam |

**Ciri pembeda**

- Paling besar / footprint lebar
- **Carport 3** (kanopi lebar)
- Balcony hitam di lantai 2
- Jendela vertikal tinggi (area tangga)
- Lansekap premium (palem spotlight, pergola samping)

---

## Quick compare

| | Type 5 | Type 7 | Type 9 |
| --- | --- | --- | --- |
| Skala | Compact | Medium | Premium |
| Jendela depan | **2** | **3** | Balcony + vertical |
| Carport | 1–2 | ~2 | **3** |
| Referensi | ✅ | ✅ | ✅ |

---

## Cara pakai

1. **Desain / copy UI** — samakan deskripsi fasad, paving, dan status peta dengan file di sini.
2. **Prompt AI / ilustrasi** — lampirkan file yang relevan (mis. Type 5 + street) supaya output selaras arsitektur Nahara.
3. **Jangan** mengganti `public/siteplan.jpg` atau aset runtime tanpa proses terpisah; folder ini hanya referensi.
