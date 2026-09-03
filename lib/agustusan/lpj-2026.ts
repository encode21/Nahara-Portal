/**
 * LPJ HUT RI ke-81 Cluster Nahara — curated from panitia spreadsheet.
 * Kolom Total di sheet adalah running total; nilai belanja = Price.
 * Jangan fetch Google Sheets di runtime.
 */

export type LpjExpenseSectionId =
  | "perlengkapan"
  | "print"
  | "konsumsi"
  | "hadiah";

export type LpjExpenseItem = {
  name: string;
  pic: string;
  amount: number;
  qty?: number;
};

export type LpjExpenseSection = {
  id: LpjExpenseSectionId;
  label: string;
  items: readonly LpjExpenseItem[];
};

export type LpjCashDonor = {
  name: string;
  amount: number;
};

export type LpjInKindItem = {
  name: string;
  donor: string;
  qty?: number;
};

export type LpjInKindGroup = {
  id: "barang" | "konsumsi";
  label: string;
  items: readonly LpjInKindItem[];
};

export type LpjIncomeLine = {
  id: "donasi" | "kas";
  label: string;
  amount: number;
};

function item(
  name: string,
  pic: string,
  amount: number,
  qty?: number,
): LpjExpenseItem {
  return qty != null ? { name, pic, amount, qty } : { name, pic, amount };
}

function sum(items: readonly { amount: number }[]): number {
  return items.reduce((s, i) => s + i.amount, 0);
}

function assertEqual(actual: number, expected: number, label: string) {
  if (actual !== expected) {
    throw new Error(`LPJ 2026 ${label}: expected ${expected}, got ${actual}`);
  }
}

export const LPJ_2026_YEAR = 2026;
export const LPJ_2026_TITLE = "Laporan Pertanggungjawaban Dana";
export const LPJ_2026_EVENT = "HUT RI ke-81 Cluster Nahara";
export const LPJ_2026_LOCATION = "Cimanggis Golf Estate";

export const LPJ_2026_EXPECTED = {
  incomeDonasi: 29_100_500,
  incomeKas: 7_000_000,
  incomeTotal: 36_100_500,
  expenseTotal: 32_141_806,
  surplus: 3_958_694,
  perlengkapan: 6_668_899,
  print: 448_500,
  konsumsi: 14_105_107,
  hadiah: 10_919_300,
  donorCount: 65,
} as const;

export const LPJ_2026_INCOME: readonly LpjIncomeLine[] = [
  {
    id: "donasi",
    label: "Donasi warga",
    amount: LPJ_2026_EXPECTED.incomeDonasi,
  },
  {
    id: "kas",
    label: "Subsidi Kas Nahara",
    amount: LPJ_2026_EXPECTED.incomeKas,
  },
];

/** 65 donatur tunai — urutan sheet (kiri 54, lalu kanan 11 TF Mandiri). */
export const LPJ_2026_CASH_DONORS: readonly LpjCashDonor[] = [
  { name: "Pak Ferdi", amount: 1_000_000 },
  { name: "Andri", amount: 500_000 },
  { name: "Nirwan", amount: 600_000 },
  { name: "Catur", amount: 500_500 },
  { name: "Andi NHT 1", amount: 2_000_000 },
  { name: "Andi NHT 6", amount: 200_000 },
  { name: "Chandra", amount: 1_000_000 },
  { name: "Wahyu", amount: 300_000 },
  { name: "Deris", amount: 500_000 },
  { name: "Fadilla", amount: 200_000 },
  { name: "Bayu", amount: 500_000 },
  { name: "Alfian", amount: 500_000 },
  { name: "Tommy", amount: 500_000 },
  { name: "Haris", amount: 300_000 },
  { name: "Temmy", amount: 500_000 },
  { name: "Chandra Ageng", amount: 350_000 },
  { name: "Ma'mun Fauzi", amount: 500_000 },
  { name: "Sugondo", amount: 250_000 },
  { name: "Erwin", amount: 300_000 },
  { name: "Helmi", amount: 500_000 },
  { name: "Pak Dian", amount: 500_000 },
  { name: "Pak Bambang", amount: 1_000_000 },
  { name: "Zikki", amount: 500_000 },
  { name: "Pak Adjie", amount: 1_000_000 },
  { name: "Pak Aep", amount: 500_000 },
  { name: "Pak Fauzi", amount: 250_000 },
  { name: "Pak Muchlis", amount: 400_000 },
  { name: "Pak Danny", amount: 500_000 },
  { name: "Pak Rio", amount: 300_000 },
  { name: "Pak Rudy", amount: 300_000 },
  { name: "Yusuf", amount: 400_000 },
  { name: "Ririn NHT6 No 12", amount: 500_000 },
  { name: "Yanti NHT2/19", amount: 200_000 },
  { name: "Tina NHT1/17", amount: 300_000 },
  { name: "Lia NHT2/5", amount: 300_000 },
  { name: "Pak Rahman NHT8/35", amount: 200_000 },
  { name: "Denny", amount: 500_000 },
  { name: "Pak Akram", amount: 250_000 },
  { name: "Andy NHB3", amount: 250_000 },
  { name: "Andreas", amount: 300_000 },
  { name: "Arie", amount: 200_000 },
  { name: "Ardie", amount: 200_000 },
  { name: "Bu keni", amount: 500_000 },
  { name: "Farah", amount: 200_000 },
  { name: "Rety NHT8/7", amount: 100_000 },
  { name: "Veron", amount: 1_000_000 },
  { name: "Ichsan Wira", amount: 200_000 },
  { name: "Whisnu", amount: 1_500_000 },
  { name: "Ita Rahmat Yana", amount: 200_000 },
  { name: "Haslianti", amount: 200_000 },
  { name: "HENI NHT8 No 12", amount: 500_000 },
  { name: "Amel NHT2 No 32", amount: 300_000 },
  { name: "Rahman NHB7 No. 1", amount: 1_000_000 },
  { name: "Tri Hastoeti", amount: 200_000 },
  { name: "Hafiz arya", amount: 400_000 },
  { name: "Desandri", amount: 200_000 },
  { name: "Deta/ Andreas NHT7 No 28", amount: 250_000 },
  { name: "Sony", amount: 500_000 },
  { name: "Yofi NHT1/1", amount: 200_000 },
  { name: "Ayu Putri NHT1/11", amount: 500_000 },
  { name: "Pak Eka NHB7/11", amount: 200_000 },
  { name: "Diva Oktavariani", amount: 150_000 },
  { name: "Bagas Jati N", amount: 400_000 },
  { name: "Andi Joko", amount: 300_000 },
  { name: "Alfia Fiferi", amount: 250_000 },
];

export const LPJ_2026_EXPENSE_SECTIONS: readonly LpjExpenseSection[] = [
  {
    id: "perlengkapan",
    label: "Seksi Perlengkapan",
    items: [
      item("Bendera Plastik", "Erwin", 995_434),
      item("Umbul dan tiang", "Erwin", 1_500_000),
      item("Landscape pasang umbul", "Erwin", 250_000),
      item("Kawat dan tali rafiah pasang umbul", "Erwin", 63_000),
      item("Joran", "Erwin", 27_425),
      item("Joran", "Erwin", 28_800),
      item("Kaos kaki dan priwitan", "Erwin", 226_000),
      item("Corong", "Erwin", 110_000),
      item("Corong dan piring", "Erwin", 180_000),
      item("Tepung", "Erwin", 50_000),
      item("Gaple", "Erwin", 29_100),
      item("Kapur", "Erwin", 13_000),
      item("Bola Pingpong", "Erwin", 28_855),
      item("Bekron", "Erwin", 288_000),
      item("Refund Joran", "Erwin", -5_500),
      item("Admin Bank", "Erwin", 2_500),
      item("Tali tambang pasang backdrop", "Erwin", 40_000),
      item("Bendera utk lomba anak", "Erwin", 62_000, 50),
      item("Isi ulang gas portable dan steker colokan", "Erwin", 231_500),
      item("Sumpit bambu", "Erwin", 9_700, 50),
      item("Mangkok ayam jago", "Erwin", 148_710, 12),
      item("Start Flag", "Erwin", 117_000),
      item("Bendera pawai", "Erwin", 40_900, 100),
      item("Bola warna warni", "Erwin", 39_900, 100),
      item("Lampu hias warna warni panggung", "Erwin", 104_430),
      item("Lampu hias bintang panggung", "Erwin", 75_000),
      item("Admin Bank", "Erwin", 2_500),
      item("Plastik untuk seksi konsumsi", "Sony", 480_000),
      item("Bola, Pancingan", "Sony", 38_000),
      item("Sutil, kerupuk, tali rapiah", "Sony", 197_000),
      item("Balon", "Sony", 55_000, 100),
      item("Panggung, Kursi dan Jasa Tukang", "Fadilla", 802_500),
      item("Indomie sayur telor Superindo", "Widuri", 158_145),
      item("Biaya jasa cabut umbul-umbul", "Sony", 280_000),
    ],
  },
  {
    id: "print",
    label: "Print dan Fotokopi",
    items: [
      item("Banner", "Desandri", 330_000, 1),
      item("Print dan Jilid Proposal", "Desandri", 41_000),
      item("Fotokopi selebaran", "Widuri", 75_000),
      item("Admin Bank", "Widuri", 2_500),
    ],
  },
  {
    id: "konsumsi",
    label: "Seksi Konsumsi",
    items: [
      item("Holland Bakery", "Vidora", 519_600),
      item("Mineral water dus", "Vidora", 360_000, 15),
      item("Kue nampan", "Vidora", 350_000, 2),
      item("Isian goodie bag anak dan Cleo", "Vidora", 988_552),
      item("Snack lomba bapak malam", "Vidora", 349_065),
      item("Kacang 2 Kelinci", "Vidora", 246_600, 3),
      item("Sate ayam Cah Sulaeman", "Vidora", 1_060_000),
      item("Snack lomba balita", "Vidora", 433_000),
      item("Cleo dus", "Vidora", 240_000, 10),
      item("Kacang dan kopi final esport", "Vidora", 240_850),
      item("Arem-arem (lomba preteen dan ART)", "Vidora", 325_000),
      item("Snack 15 Agustus", "Vidora", 250_000),
      item("Kopi bapak-bapak after carnival", "Vidora", 107_000),
      item("Kopi bapak-bapak after carnival", "Vidora", 154_940),
      item("Prasmanan acara puncak", "Nisa", 5_002_500, 100),
      item("Nasi kuning acara carnival", "Nisa", 1_150_000, 50),
      item("Semangka dan salak", "Dhanty", 322_000, 8),
      item("Martabak Pecenongan 8 Agustus", "Dhanty", 292_500),
      item("Martabak Pecenongan 9 Agustus", "Dhanty", 423_500),
      item("Serabi dan putu mayang", "Dhanty", 520_000, 50),
      item("Semangka, salak, jeruk", "Dhanty", 385_000, 14),
      item("Martabak manis, martabak asin", "Dhanty", 385_000, 6),
    ],
  },
  {
    id: "hadiah",
    label: "Seksi Hadiah Lomba",
    items: [
      item("Pembelian kado ke 1", "Asma", 171_087),
      item("Pembelian kado ke 2", "Asma", 267_320),
      item("Pembelian kado ke 3", "Asma", 203_200),
      item("Pembelian kado ke 4", "Asma", 77_700),
      item("Pembelian kado ke 5", "Asma", 90_000),
      item("Pembelian kado ke 6", "Asma", 329_169),
      item("Pembelian kado ke 7", "Asma", 516_920),
      item("Pembelian kado ke 8", "Asma", 476_579),
      item("Pembelian kado ke 9", "Asma", 137_432),
      item("Pembelian kado ke 10", "Asma", 264_272),
      item("Pembelian kado ke 11", "Mba Tara", 159_680),
      item("Pembelian kado ke 12, kado ke 13", "Mba Tara", 406_198),
      item("Pembelian kado ke 14", "Mba Tara", 234_069),
      item("Pembelian kado ke 15", "Mba Tara", 117_271),
      item("Pembelian kado ke 16", "Mba Tara", 108_850),
      item("Pembelian kado ke 17", "Mba Tara", 32_229),
      item("Pembelian lakban", "Mba Tara", 67_664),
      item("Pembelian pita", "Mba Tara", 334_372),
      item("Pembelian lakban", "Mba Tara", 114_146),
      item("Pembelian lem tembak", "Mba Tara", 163_293),
      item("Pembelian kado ke 18", "Mba Tara", 2_406_000),
      item("Pembelian kado ke 19", "Asma", 294_000),
      item("Pembelian kado ke 20", "Asma, Tara, Tika", 624_000),
      item("Pembelian kado ke 21", "Asma", 1_215_000),
      item("Pembelian kado ke 22", "Asma, Tara, Tika", 669_000),
      item("Pembelian bungkus kado", "Asma", 24_000),
      item("Serok uang ART", "Asma", 1_000_000),
      item("Admin Bank", "Asma", 2_500),
      item("Pembelian kado ke 23", "Widuri", 208_349),
      item("Admin Bank", "Asma", 2_500),
      item("Uang tip security Nahara", "Fadilla", 100_000),
      item("Uang tip security Nahara", "Fadilla", 100_000),
      item("Admin Bank", "Asma", 2_500),
    ],
  },
];

export const LPJ_2026_IN_KIND: readonly LpjInKindGroup[] = [
  {
    id: "barang",
    label: "Barang untuk acara dan hadiah lomba",
    items: [
      { name: "Sewa tenda", qty: 1, donor: "Pak Adjie" },
      { name: "Sewa organ tunggal", qty: 1, donor: "Pak Ferdi" },
      { name: "Karpet dasar panggung", qty: 1, donor: "Pak Bambang" },
      { name: "Voucher perawatan @Rp500.000", qty: 8, donor: "Bu Putri" },
      { name: "Uang baru segepok @Rp2.000", qty: 100, donor: "Mba Tara" },
      { name: "Uang baru segepok @Rp1.000", qty: 100, donor: "Mba Widuri" },
      { name: "Face mist dan serum", donor: "Bu Dok. Yessi" },
      { name: "Magic com", qty: 1, donor: "Mba Ummi" },
      { name: "Vacuum cleaner", qty: 1, donor: "Mba Lidya" },
      { name: "Perlengkapan mandi dan parfum", qty: 2, donor: "Mba Reny NHT7/16" },
      { name: "Tas beruang, kacamata", qty: 2, donor: "Mba Sylvi" },
      { name: "Accessories", qty: 10, donor: "Mba Sylvi" },
      { name: "Tas gemblok", qty: 1, donor: "Mba Sylvi" },
      { name: "Tumbler", qty: 1, donor: "Mba Sylvi" },
      { name: "Chopper", qty: 1, donor: "Mba Feby" },
      { name: "Baju batik", donor: "Bu Evy NHT 3" },
      { name: "Wajan dan tutup set untuk lomba Indomie", qty: 3, donor: "Mba Vidora" },
      { name: "Set keramik", qty: 2, donor: "Mba Tara" },
      { name: "Spatula set", qty: 3, donor: "Mba Widuri" },
      { name: "Indomie dus", qty: 2, donor: "Mba Widuri" },
      { name: "Payung", donor: "Marketing CGE" },
      { name: "Tas hadiah serok uang", qty: 2, donor: "Mba Tika" },
      { name: "Tas hadiah serok uang", qty: 1, donor: "Asma" },
      { name: "Uang tunai Rp200.000 tambahan serok uang", qty: 1, donor: "Vidora" },
      { name: "Uang tunai Rp50.000 tambahan serok uang", qty: 1, donor: "Puji" },
      { name: "Tumbler Smeg", qty: 1, donor: "Bu Santi" },
      { name: "Set mangkuk kecil isi 2", qty: 3, donor: "Mba Ummi" },
      { name: "Set pisau, set sendok", qty: 1, donor: "Mba Feby" },
      { name: "Tumbler", qty: 2, donor: "Mba Feby" },
    ],
  },
  {
    id: "konsumsi",
    label: "Makanan / konsumsi untuk rangkaian acara",
    items: [
      { name: "Bihun (8 Agustus)", donor: "Uti Dewi" },
      { name: "Mie celor acara puncak", donor: "Uti Dewi" },
      { name: "Bakso (9 Agustus)", donor: "Bu Dian" },
      { name: "Nasi dan mie goreng (final esport)", donor: "Bu Dian" },
      { name: "Siomay (acara puncak)", donor: "Bu Dian" },
      { name: "Es kuwut (9 Agustus)", donor: "Mba Widuri" },
      { name: "Es teler dan puding acara puncak", donor: "Mba Widuri" },
      { name: "Rujak dan gorengan tampah (8 Agustus)", donor: "Bu Santi" },
      { name: "Tumpeng acara puncak", qty: 1, donor: "Bu Santi" },
      { name: "Rebusan (gaple 8 Agustus)", donor: "Mba Nisa" },
      { name: "Es cendol acara puncak", donor: "Mba Meryka" },
      { name: "Jajanan tampah acara puncak", donor: "Mba Ayu" },
      { name: "Donat dan tahu goreng (15 Agustus)", donor: "Mba Vidora" },
      { name: "Bihun dan mie goreng (esport 9 Agustus)", donor: "Mba Tarra" },
      { name: "Bakso acara puncak", donor: "Mba Asma" },
      { name: "Le Mineral dus", qty: 5, donor: "Mba Anna" },
      { name: "Cleo dus", qty: 10, donor: "Mami Meda" },
      { name: "Lupis tampah acara puncak", donor: "Mba Rifi" },
    ],
  },
];

const sectionTotals = Object.fromEntries(
  LPJ_2026_EXPENSE_SECTIONS.map((s) => [s.id, sum(s.items)]),
) as Record<LpjExpenseSectionId, number>;

const incomeTotal = sum(LPJ_2026_INCOME);
const donorTotal = sum(LPJ_2026_CASH_DONORS);
const expenseTotal = sum(LPJ_2026_EXPENSE_SECTIONS.flatMap((s) => s.items));
const surplus = incomeTotal - expenseTotal;

assertEqual(donorTotal, LPJ_2026_EXPECTED.incomeDonasi, "cash donors");
assertEqual(LPJ_2026_CASH_DONORS.length, LPJ_2026_EXPECTED.donorCount, "donor count");
assertEqual(incomeTotal, LPJ_2026_EXPECTED.incomeTotal, "income total");
assertEqual(sectionTotals.perlengkapan, LPJ_2026_EXPECTED.perlengkapan, "perlengkapan");
assertEqual(sectionTotals.print, LPJ_2026_EXPECTED.print, "print");
assertEqual(sectionTotals.konsumsi, LPJ_2026_EXPECTED.konsumsi, "konsumsi");
assertEqual(sectionTotals.hadiah, LPJ_2026_EXPECTED.hadiah, "hadiah");
assertEqual(expenseTotal, LPJ_2026_EXPECTED.expenseTotal, "expense total");
assertEqual(surplus, LPJ_2026_EXPECTED.surplus, "surplus");

export const LPJ_2026 = {
  year: LPJ_2026_YEAR,
  title: LPJ_2026_TITLE,
  event: LPJ_2026_EVENT,
  location: LPJ_2026_LOCATION,
  income: LPJ_2026_INCOME,
  incomeTotal,
  expenseTotal,
  surplus,
  donors: LPJ_2026_CASH_DONORS,
  donorTotal,
  sections: LPJ_2026_EXPENSE_SECTIONS,
  sectionTotals,
  inKind: LPJ_2026_IN_KIND,
} as const;

export function getLpjByYear(year: number) {
  if (year === LPJ_2026_YEAR) return LPJ_2026;
  return null;
}
