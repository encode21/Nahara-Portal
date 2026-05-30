export type Activity = {
  id: string;
  title: string;
  description: string | null;
  date: string;
  location: string | null;
  max_participants: number | null;
  registration_fee: number;
  created_at: string;
};

export type Participant = {
  id: string;
  activity_id: string;
  name: string;
  phone: string | null;
  block_number: string | null;
  payment_status: boolean;
  attendance_status: boolean;
  registered_at: string;
};

export type KasEntry = {
  id: string;
  type: "pemasukan" | "pengeluaran";
  amount: number;
  description: string;
  category: string | null;
  date: string;
  created_at: string;
};

export type Warga = {
  id: string;
  nama: string;
  blok: string;
  blok_row: string;
  nomor_kavling: number | null;
  status_hunian: "Tetap" | "Kontrak" | "Kosong";
  telepon: string | null;
  created_at: string;
};

export type WargaWithIuran = {
  id: string;
  nama: string;
  blok: string;
  blok_row: string;
  nomor_kavling: number;
  status_hunian: "Tetap" | "Kontrak" | "Kosong";
  iuran_lunas: boolean;
  telepon?: string;
};

export type Iuran = {
  id: string;
  warga_id: string;
  bulan: string;
  nominal: number;
  status: boolean;
  paid_at: string | null;
  created_at: string;
};

export type Pengaduan = {
  id: string;
  nama: string;
  blok: string | null;
  kategori: "Keamanan" | "Kebersihan" | "Infrastruktur" | "Lainnya";
  deskripsi: string;
  foto_url: string | null;
  status: "Baru" | "Diproses" | "Selesai";
  created_at: string;
};

export type DonasiCampaign = {
  id: string;
  judul: string;
  deskripsi: string | null;
  target_amount: number;
  collected_amount: number;
  deadline: string | null;
  is_active: boolean;
  created_at: string;
};

export type Pengumuman = {
  id: string;
  judul: string;
  isi: string | null;
  created_by: string | null;
  created_at: string;
};

export type CctvCamera = {
  id: string;
  nama: string;
  lokasi: string | null;
  stream_url: string | null;
  is_online: boolean;
  created_at: string;
};

export type SecurityStaff = {
  id: string;
  nama: string;
  jabatan: string | null;
  telepon: string | null;
  shift: string | null;
  is_active: boolean;
  created_at: string;
};

export type SecurityUser = {
  id: string;
  staff_id: string | null;
  email: string;
  nama: string;
  receive_notifications: boolean;
  created_at: string;
};

export type SecurityNotification = {
  id: string;
  pengaduan_id: string | null;
  staff_id: string | null;
  user_email: string;
  jenis: string;
  judul: string;
  pesan: string | null;
  is_read: boolean;
  created_at: string;
};

export type ActivityWithCounts = Activity & {
  participant_count?: number;
  paid_count?: number;
  attending_count?: number;
};

export type KasSummary = {
  totalPemasukan: number;
  totalPengeluaran: number;
  saldo: number;
};

export type IuranWithWarga = Iuran & {
  warga: Pick<Warga, "nama" | "blok">;
};
