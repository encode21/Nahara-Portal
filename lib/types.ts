export type Activity = {
  id: string;
  title: string;
  description: string | null;
  date: string;
  location: string | null;
  max_participants: number | null;
  registration_fee: number;
  image_url: string | null;
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
  kode: string | null;
  nama: string;
  blok: string | null;
  kategori: "Keamanan" | "Kebersihan" | "Infrastruktur" | "Lainnya";
  deskripsi: string;
  foto_url: string | null;
  status: "Baru" | "Diproses" | "Selesai" | "Ditolak";
  created_at: string;
};

export type PengaduanKomentar = {
  id: string;
  pengaduan_id: string;
  nama: string;
  pesan: string;
  is_pengurus: boolean;
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
  image_url: string | null;
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

export type EventEditionStatus = "draft" | "active" | "archived";

export type EventContestCategory =
  | "ibu"
  | "bapak"
  | "pasangan"
  | "dewasa_remaja"
  | "keluarga"
  | "balita"
  | "preteen"
  | "art"
  | "umum";

export type EventEdition = {
  id: string;
  year: number;
  slug: string;
  title: string;
  description: string | null;
  sop_text: string | null;
  starts_on: string | null;
  ends_on: string | null;
  registration_closes_at: string | null;
  status: EventEditionStatus;
  activity_id: string | null;
  campaign_id: string | null;
  /** Folder arsip Google Drive (canonical https://drive.google.com/drive/folders/…) */
  gallery_drive_url: string | null;
  created_at: string;
};

export type EventContest = {
  id: string;
  edition_id: string;
  sort_order: number;
  title: string;
  category: EventContestCategory;
  category_note: string | null;
  location: string | null;
  starts_at: string | null;
  ends_at: string | null;
  equipment: string | null;
  rules: string | null;
  team_size: number;
  max_entries: number | null;
  registration_open: boolean;
  is_competition: boolean;
  created_at: string;
};

export type EventContestEntry = {
  id: string;
  contest_id: string;
  display_name: string;
  partner_name: string | null;
  block_number: string | null;
  phone: string | null;
  notes: string | null;
  status: "registered" | "withdrawn";
  registered_at: string;
};

export type EventContestResult = {
  id: string;
  contest_id: string;
  entry_id: string | null;
  rank: number;
  winner_label: string;
  prize: string | null;
  published: boolean;
  announced_at: string | null;
  created_at: string;
};

export type GalleryMediaType = "image" | "video";

export type EventGalleryItem = {
  id: string;
  edition_id: string;
  /** Foto, atau poster untuk video */
  image_url: string;
  media_type: GalleryMediaType;
  /** URL MP4 di storage bila media_type = video */
  video_url: string | null;
  caption: string | null;
  /** dokumentasi | twibbon | lomba | malam_puncak | persiapan */
  category: string;
  sort_order: number;
  is_published: boolean;
  created_at: string;
};

export type PeakParticipantRole = "suami" | "istri";
export type PeakRegistrationStatus = "pending" | "verified" | "cancelled";
export type DoorPrizeKind = "door" | "utama";

export type EventPeakRegistration = {
  id: string;
  edition_id: string;
  blok_row: string;
  nomor_kavling: number;
  household_label: string;
  participant_name: string;
  participant_role: PeakParticipantRole;
  phone: string | null;
  twibbon_url: string;
  terms_accepted_at: string;
  status: PeakRegistrationStatus;
  registration_code: string;
  warga_id: string | null;
  verified_at: string | null;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
};

export type EventDoorPrize = {
  id: string;
  edition_id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  quantity: number;
  sort_order: number;
  is_active: boolean;
  kind: DoorPrizeKind;
  created_at: string;
};

export type EventDoorPrizeWinner = {
  id: string;
  edition_id: string;
  prize_id: string;
  registration_id: string;
  selected_at: string;
  selected_by: string | null;
};

export type EventPeakPushSubscription = {
  id: string;
  registration_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  user_agent: string | null;
  created_at: string;
};

export type DuckRaceStatus =
  | "ready"
  | "preparing"
  | "running"
  | "finished"
  | "cancelled";

export type DuckRaceParticipant = {
  household_label: string;
  blok_row: string;
  nomor_kavling: number;
};

export type DuckRaceRandomResult = {
  method: string;
  winner_index: number;
  participant_count: number;
  entropy?: string;
};

export type EventDuckRace = {
  id: string;
  edition_id: string;
  race_code: string;
  status: DuckRaceStatus;
  participant_count: number;
  participant_snapshot: DuckRaceParticipant[];
  winner_household_label: string | null;
  winner_blok_row: string | null;
  winner_nomor_kavling: number | null;
  random_result: DuckRaceRandomResult | null;
  exclude_previous_winners: boolean;
  started_at: string | null;
  finished_at: string | null;
  created_by: string | null;
  created_at: string;
};

export type KasSummary = {
  totalPemasukan: number;
  totalPengeluaran: number;
  saldo: number;
};

export type IuranWithWarga = Iuran & {
  warga: Pick<Warga, "nama" | "blok">;
};
