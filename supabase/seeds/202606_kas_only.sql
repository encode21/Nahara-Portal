-- Seed arus kas Juni 2026 → kas_entries + warga + iuran (Peta Lingkungan)
-- Idempotent: hapus batch [SEED JUN26] lalu insert ulang
-- Target saldo akhir: Rp 12.773.817
-- Cara jalankan: Supabase → SQL Editor → paste file ini → Run

DELETE FROM kas_entries WHERE description LIKE '[SEED JUN26]%';

INSERT INTO kas_entries (type, amount, description, category, date) VALUES
  ('pemasukan', 2950000, '[SEED JUN26] Saldo Awal — Migrasi iuran wajib dari Bendahara RT', 'Saldo Awal', '2026-06-01'),
  ('pemasukan', 500000, '[SEED JUN26] Widuri (NHT-2/11) Jun 2026 to Mar 2027', 'Iuran', '2026-06-01'),
  ('pemasukan', 100000, '[SEED JUN26] Heni Purnama (NHT-8/12) Jun 2026 to Jul 2026', 'Iuran', '2026-06-01'),
  ('pemasukan', 350000, '[SEED JUN26] Umi Zahra S (NHT-1/20) Jun 2026 to Dec 2026', 'Iuran', '2026-06-01'),
  ('pemasukan', 350000, '[SEED JUN26] Anisa Sulistia (NHB-8/30) Jun 2026 to Dec 2026', 'Iuran', '2026-06-01'),
  ('pemasukan', 350000, '[SEED JUN26] Vidora Sapta (NHT-3/50) Jun 2026 to Dec 2026', 'Iuran', '2026-06-01'),
  ('pemasukan', 350000, '[SEED JUN26] Firly Angga (NHT-8/33) Jun 2026 to Dec 2026', 'Iuran', '2026-06-01'),
  ('pemasukan', 100000, '[SEED JUN26] Ayu Trihandayani (NHT-1/11) Jun 2026 to Jul 2026', 'Iuran', '2026-06-01'),
  ('pemasukan', 600000, '[SEED JUN26] Philander / Mami Meda (NHT-3/5) Jun 2026 to May 2027', 'Iuran', '2026-06-01'),
  ('pemasukan', 350000, '[SEED JUN26] Anna / Haris (NHT-3/32) Jun 2026 to Dec 2026', 'Iuran', '2026-06-01'),
  ('pemasukan', 50000, '[SEED JUN26] Renny Saraswati (NHT-7/6) Jun 2026', 'Iuran', '2026-06-01'),
  ('pemasukan', 350000, '[SEED JUN26] Dok Yessi / Pak Dani (NHT-6/5) Jun 2026 to Dec 2026', 'Iuran', '2026-06-01'),
  ('pemasukan', 200000, '[SEED JUN26] Sylvia D (NHT-2/30) Jun 2026 to Sep 2026', 'Iuran', '2026-06-02'),
  ('pemasukan', 350000, '[SEED JUN26] Herdianita / Andi (NHT-1/10) Jun 2026 to Dec 2026', 'Iuran', '2026-06-02'),
  ('pemasukan', 950000, '[SEED JUN26] Rifianty Fitrianis (NHT-6/8) Jun 2026 to Dec 2027', 'Iuran', '2026-06-02'),
  ('pemasukan', 350000, '[SEED JUN26] Chairunnisa R / Icha (NHT-3/28) Jun 2026 to Dec 2026', 'Iuran', '2026-06-03'),
  ('pemasukan', 50000, '[SEED JUN26] Rosiyela There (NHT-2/12) Jun 2026', 'Iuran', '2026-06-04'),
  ('pemasukan', 100000, '[SEED JUN26] Difia Setyo (NHT-1/16) Jun 2026 to Jul 2026', 'Iuran', '2026-06-09'),
  ('pemasukan', 350000, '[SEED JUN26] Puji A / Dian F (NHT-3/20) Jun 2026 to Dec 2026', 'Iuran', '2026-06-09'),
  ('pemasukan', 150000, '[SEED JUN26] Lia Octavia / Sony (NHT-8/52) Jun 2026 to Aug 2026', 'Iuran', '2026-06-09'),
  ('pemasukan', 100000, '[SEED JUN26] Merika Dwi P (NHT-2/7) Jun 2026 to Jul 2026', 'Iuran', '2026-06-09'),
  ('pemasukan', 250000, '[SEED JUN26] Dian / Bambang (NHT-6/10) Aug 2026 to Dec 2026', 'Iuran', '2026-06-11'),
  ('pemasukan', 350000, '[SEED JUN26] Kartika Ramadhanty (NHT-3/16) Jun 2026 to Dec 2026', 'Iuran', '2026-06-11'),
  ('pemasukan', 100000, '[SEED JUN26] Sri Suryani (NHT-8/36) Jun 2026 to Jul 2026', 'Iuran', '2026-06-16'),
  ('pemasukan', 300000, '[SEED JUN26] Widya Karim (NHT-3/7) Jun 2026 to Nov 2026', 'Iuran', '2026-06-16'),
  ('pemasukan', 100000, '[SEED JUN26] Rizky Ayu (NHT-2/6) Jun 2026 to Jul 2026', 'Iuran', '2026-06-19'),
  ('pemasukan', 100000, '[SEED JUN26] Rizma U (NHT-2/9) Jun 2026 to Jul 2026', 'Iuran', '2026-06-26'),
  ('pemasukan', 50000, '[SEED JUN26] Uty Dewi (NHT-6/17) Jun 2026', 'Iuran', '2026-06-26'),
  ('pemasukan', 50000, '[SEED JUN26] Mira / Rio (NHT-1/18) Jun 2026', 'Iuran', '2026-06-26'),
  ('pemasukan', 100000, '[SEED JUN26] Prida (NHT-3/6) Jun 2026 to Jul 2026', 'Iuran', '2026-06-28'),
  ('pemasukan', 600000, '[SEED JUN26] Putri (NHT-8/28) Jun 2026 to May 2027', 'Iuran', '2026-06-28'),
  ('pemasukan', 1806817, '[SEED JUN26] Mutasi saldo dana Dansos ke Rek. Nahara', 'Lainnya', '2026-06-29'),
  ('pengeluaran', 20000, '[SEED JUN26] Biaya ganti kartu ATM Nahara', 'Operasional', '2026-06-29'),
  ('pengeluaran', 13000, '[SEED JUN26] Biaya Administrasi Rekening', 'Operasional', '2026-06-30');

-- Verifikasi: SELECT type, COUNT(*), SUM(amount) FROM kas_entries WHERE description LIKE '[SEED JUN26]%' GROUP BY 1;
