WITH v(nama, blok, blok_row, nomor_kavling) AS (
VALUES
  ('Anisa Sulistia','NHB-8/30','NHB-8',30),
  ('Herdianita / Andi','NHT-1/10','NHT-1',10),
  ('Ayu Trihandayani','NHT-1/11','NHT-1',11),
  ('Difia Setyo / Fia','NHT-1/16','NHT-1',16),
  ('Mira / Rio','NHT-1/18','NHT-1',18),
  ('Umi Zahra S','NHT-1/20','NHT-1',20),
  ('Widuri / Andri','NHT-2/11','NHT-2',11),
  ('Rosiyela Theresilia','NHT-2/12','NHT-2',12),
  ('Asmawati','NHT-2/15','NHT-2',15),
  ('Kustiyanti','NHT-2/19','NHT-2',19),
  ('Alfian / Della','NHT-2/20','NHT-2',20),
  ('Sylvia D','NHT-2/30','NHT-2',30),
  ('Siti Fadlia','NHT-2/5','NHT-2',5),
  ('Rizki Ayu / Kiki','NHT-2/6','NHT-2',6),
  ('Meryka Dwi P','NHT-2/7','NHT-2',7),
  ('Nurleli Novida / Muklis','NHT-2/8','NHT-2',8),
  ('Rizma / Fadillah','NHT-2/9','NHT-2',9),
  ('Nina','NHT-3/10','NHT-3',10),
  ('Kartika Ramadhanty','NHT-3/16','NHT-3',16),
  ('Iyas','NHT-3/19','NHT-3',19),
  ('Puji / Dian','NHT-3/20','NHT-3',20),
  ('Chairunnisa R / Icha','NHT-3/28','NHT-3',28),
  ('Anna / Haris','NHT-3/32','NHT-3',32),
  ('Philander / Mami Meda','NHT-3/5','NHT-3',5),
  ('Vidora Sapta','NHT-3/50','NHT-3',50),
  ('Prida','NHT-3/6','NHT-3',6),
  ('Widya Karim','NHT-3/7','NHT-3',7),
  ('Dian P','NHT-6/10','NHT-6',10),
  ('Ririn','NHT-6/12','NHT-6',12),
  ('Uty Dewi','NHT-6/17','NHT-6',17),
  ('Keni. R','NHT-6/18','NHT-6',18),
  ('Yessi / Dani','NHT-6/5','NHT-6',5),
  ('Arie Pujihastuti','NHT-6/7','NHT-6',7),
  ('Rifianty Fitrianis','NHT-6/8','NHT-6',8),
  ('Tiarma Arine / Hafiz Arya','NHT-7/1','NHT-7',1),
  ('Renny Saraswati','NHT-7/16','NHT-7',16),
  ('Laila. F','NHT-7/22','NHT-7',22),
  ('Deta / Andreas','NHT-7/28','NHT-7',28),
  ('Ritawati','NHT-7/6','NHT-7',6),
  ('Terry. T','NHT-7/9','NHT-7',9),
  ('Heni Purnama','NHT-8/12','NHT-8',12),
  ('Idha Abralia / Ayu','NHT-8/15','NHT-8',15),
  ('Rizki / Catur','NHT-8/16','NHT-8',16),
  ('Eny / Wahyu Arif','NHT-8/21','NHT-8',21),
  ('Tika / Yusuf','NHT-8/27','NHT-8',27),
  ('Putri','NHT-8/28','NHT-8',28),
  ('Firly Angga','NHT-8/33','NHT-8',33),
  ('Zara Nani','NHT-8/35','NHT-8',35),
  ('Sri Suryani','NHT-8/36','NHT-8',36),
  ('Farah','NHT-8/5','NHT-8',5),
  ('Ericka Sanjaya / Robert','NHT-8/50','NHT-8',50),
  ('Lia Octavia / Sony','NHT-8/52','NHT-8',52)
)
INSERT INTO warga (nama, blok, blok_row, nomor_kavling, status_hunian)
SELECT v.nama, v.blok, v.blok_row, v.nomor_kavling, 'Tetap'
FROM v
WHERE NOT EXISTS (SELECT 1 FROM warga w WHERE w.blok = v.blok);

UPDATE warga w
SET
  nama = CASE WHEN w.nama IS NULL OR btrim(w.nama) = '' OR w.nama = w.blok THEN v.nama ELSE w.nama END,
  blok_row = v.blok_row,
  nomor_kavling = v.nomor_kavling,
  status_hunian = CASE WHEN w.status_hunian = 'Kosong' THEN 'Tetap' ELSE w.status_hunian END
FROM v
WHERE w.blok = v.blok;
