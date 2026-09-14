import { SITEPLAN_IMAGE } from "../constants/siteplan-blocks";

/** Legacy preview geometry only. No canonical source associations or numbering corrections. */
export type Point = [number, number];
export type LotPoly = {
  lotId: string;
  blokKey: string;
  unit: string;
  points: Point[];
  isRC?: boolean;
};
type RowDef = {
  blok: string;
  units: string[];
  tl: Point;
  tr: Point;
  br: Point;
  bl: Point;
};

// Koordinat ROWS ditulis di ruang siteplan sumber (1236×1188), lalu diskalakan ke JPG aktual.
const COORD_SOURCE = { width: 1236, height: 1188 };

function toImageCoords([x, y]: Point): Point {
  return [
    (x * SITEPLAN_IMAGE.width) / COORD_SOURCE.width,
    (y * SITEPLAN_IMAGE.height) / COORD_SOURCE.height,
  ];
}

function scaleRow(row: RowDef): RowDef {
  return {
    ...row,
    tl: toImageCoords(row.tl),
    tr: toImageCoords(row.tr),
    br: toImageCoords(row.br),
    bl: toImageCoords(row.bl),
  };
}

/** Perkecil sedikit agar overlay tidak menutupi garis kavling di JPG */
const ROW_EDGE_INSET = 1.5;

function insetRow(row: RowDef, pad: number): RowDef {
  return {
    ...row,
    tl: [row.tl[0] + pad, row.tl[1] + pad],
    tr: [row.tr[0] - pad, row.tr[1] + pad],
    br: [row.br[0] - pad, row.br[1] - pad],
    bl: [row.bl[0] + pad, row.bl[1] - pad],
  };
}

// Coordinate system mengikuti file siteplan asli: viewBox 0 0 1236 1188.
// Setiap unit dibuat sebagai POLYGON, bukan bounding box rect.
// Untuk baris miring/melengkung, titik kiri-kanan row dibuat trapezoid supaya overlay ikut bentuk kavling.
const ROWS: RowDef[] = [
  // Top boulevard rows
  {
    blok: "NAHARA BARAT 8",
    units: ["30", "28", "26", "22", "20", "18", "16", "12", "10", "8", "2"],
    tl: [58, 18],
    tr: [502, 18],
    br: [502, 91],
    bl: [58, 91],
  },
  {
    blok: "NAHARA TIMUR 8",
    units: [
      "56",
      "52",
      "50",
      "38",
      "36",
      "32",
      "30",
      "28",
      "26",
      "20",
      "18",
      "16",
      "16",
      "10",
      "8",
      "6",
      "2",
    ],
    tl: [520, 18],
    tr: [1170, 18],
    br: [1170, 92],
    bl: [520, 92],
  },

  // Pola tiap blok antar jalan:
  //   [Row N bawah] + [Row M atas] back-to-back, lalu jalan Row M.
  // Barat 8 / Timur 8 bawah, lalu Row 7 atas
  {
    blok: "NAHARA BARAT 8",
    units: ["23", "21", "19", "17", "15", "11", "9", "7", "5", "1"],
    tl: [72, 127],
    tr: [498, 127],
    br: [498, 212],
    bl: [72, 212],
  },
  {
    blok: "NAHARA BARAT 7",
    units: ["20", "18", "16", "12", "10", "8", "6", "2"],
    tl: [72, 212],
    tr: [498, 212],
    br: [498, 289],
    bl: [72, 289],
  },
  {
    blok: "NAHARA TIMUR 8",
    units: [
      "35",
      "33",
      "31",
      "29",
      "27",
      "25",
      "23",
      "21",
      "19",
      "17",
      "15",
      "11",
      "9",
      "7",
      "5",
      "3",
      "1",
    ],
    tl: [525, 127],
    tr: [1145, 127],
    br: [1145, 212],
    bl: [525, 212],
  },
  {
    blok: "NAHARA TIMUR 7",
    units: [
      "32",
      "30",
      "28",
      "26",
      "22",
      "20",
      "18",
      "16",
      "12",
      "10",
      "8",
      "6",
      "2",
    ],
    tl: [525, 212],
    tr: [1145, 212],
    br: [1145, 289],
    bl: [525, 289],
  },

  // Barat 7 / Timur 7 bawah, lalu Row 6 atas
  {
    blok: "NAHARA BARAT 7",
    units: ["17", "15", "11", "9", "7", "5", "3", "1"],
    tl: [80, 322],
    tr: [500, 322],
    br: [500, 408],
    bl: [80, 408],
  },
  {
    blok: "NAHARA BARAT 6",
    units: ["20", "18", "16", "12", "10", "8", "6", "2"],
    tl: [80, 408],
    tr: [500, 408],
    br: [500, 486],
    bl: [80, 486],
  },
  {
    blok: "NAHARA TIMUR 7",
    units: ["21", "19", "17", "15", "11", "9", "7", "5", "1"],
    tl: [525, 322],
    tr: [985, 322],
    br: [985, 408],
    bl: [525, 408],
  },
  {
    blok: "NAHARA TIMUR 6",
    units: ["26", "22", "20", "18", "16", "12", "10", "8", "2"],
    tl: [525, 408],
    tr: [985, 408],
    br: [985, 487],
    bl: [525, 487],
  },

  // Barat 6 / Timur 6 bawah, lalu Row 3 atas
  {
    blok: "NAHARA BARAT 6",
    units: ["17", "15", "11", "9", "7", "5", "3", "1"],
    tl: [81, 520],
    tr: [500, 520],
    br: [500, 604],
    bl: [82, 604],
  },
  {
    blok: "NAHARA BARAT 3",
    units: ["28", "26", "22", "20", "18", "16", "12", "10", "8", "2"],
    tl: [82, 604],
    tr: [500, 604],
    br: [500, 682],
    bl: [86, 682],
  },
  {
    blok: "NAHARA TIMUR 6",
    units: ["25", "23", "21", "19", "17", "15", "11", "9", "5"],
    tl: [525, 520],
    tr: [950, 520],
    br: [950, 604],
    bl: [525, 604],
  },
  {
    blok: "NAHARA TIMUR 3",
    units: [
      "50",
      "38",
      "36",
      "32",
      "30",
      "28",
      "26",
      "20",
      "18",
      "16",
      "12",
      "10",
      "8",
      "6",
      "2",
    ],
    tl: [525, 604],
    tr: [1090, 604],
    br: [1090, 683],
    bl: [525, 683],
  },

  // Barat 3 / Timur 3 bawah, lalu Row 2 atas
  {
    blok: "NAHARA BARAT 3",
    units: ["21", "19", "17", "15", "11", "9", "7", "5", "3", "1"],
    tl: [105, 715],
    tr: [500, 715],
    br: [500, 793],
    bl: [115, 793],
  },
  {
    blok: "NAHARA BARAT 2",
    units: ["32", "30", "28", "26", "22", "20", "18", "16", "12", "10", "8", "2"],
    tl: [115, 793],
    tr: [500, 793],
    br: [500, 870],
    bl: [140, 870],
  },
  {
    blok: "NAHARA TIMUR 3",
    units: ["23", "21", "19", "17", "15", "11", "9", "7", "5"],
    tl: [525, 715],
    tr: [930, 715],
    br: [930, 793],
    bl: [525, 793],
  },
  {
    blok: "NAHARA TIMUR 2",
    units: [
      "36",
      "32",
      "30",
      "28",
      "26",
      "22",
      "20",
      "18",
      "16",
      "12",
      "10",
      "8",
    ],
    tl: [525, 793],
    tr: [875, 793],
    br: [875, 870],
    bl: [525, 870],
  },
  {
    blok: "NAHARA TIMUR 2",
    units: ["2"],
    tl: [875, 793],
    tr: [930, 793],
    br: [925, 870],
    bl: [875, 870],
  },

  // Barat 2 / Timur 2 bawah, lalu Row 1 atas
  {
    blok: "NAHARA BARAT 2",
    units: ["23", "21", "19", "15", "11", "9", "7", "5", "3"],
    tl: [158, 904],
    tr: [505, 904],
    br: [505, 984],
    bl: [177, 984],
  },
  {
    blok: "NAHARA BARAT 1",
    units: ["28", "26", "22", "20", "18", "16", "12", "10", "8", "2"],
    tl: [177, 984],
    tr: [505, 984],
    br: [505, 1062],
    bl: [193, 1062],
  },
  {
    blok: "NAHARA TIMUR 2",
    units: ["19", "17", "15", "11", "9", "7", "5", "3"],
    tl: [525, 904],
    tr: [850, 904],
    br: [825, 984],
    bl: [525, 984],
  },
  {
    blok: "NAHARA TIMUR 1",
    units: ["22", "20", "18", "16", "12", "10", "8", "6", "2"],
    tl: [525, 984],
    tr: [825, 984],
    br: [800, 1062],
    bl: [525, 1062],
  },

  // Barat 1 / Timur 1 bawah
  {
    blok: "NAHARA BARAT 1",
    units: ["23", "21", "19", "17", "15", "11", "9", "5", "1"],
    tl: [198, 1080],
    tr: [506, 1080],
    br: [506, 1158],
    bl: [214, 1158],
  },
  {
    blok: "NAHARA TIMUR 1",
    units: ["19", "17", "15", "11", "9", "7", "5", "3"],
    tl: [525, 1080],
    tr: [805, 1080],
    br: [792, 1158],
    bl: [525, 1158],
  },
];

const RC_POLYS: LotPoly[] = [
  {
    lotId: "RC-TIMUR-6",
    blokKey: "RC-TIMUR-6",
    unit: "RC",
    isRC: true,
    points: [
      [950, 520],
      [1090, 520],
      [1090, 604],
      [950, 604],
    ],
  },
  {
    lotId: "RC-TIMUR-3-A",
    blokKey: "RC-TIMUR-3-A",
    unit: "RC",
    isRC: true,
    points: [
      [875, 715],
      [930, 715],
      [925, 793],
      [875, 793],
    ],
  },
  {
    lotId: "RC-TIMUR-2-A",
    blokKey: "RC-TIMUR-2-A",
    unit: "RC",
    isRC: true,
    points: [
      [830, 904],
      [920, 904],
      [905, 984],
      [825, 984],
    ],
  },
  {
    lotId: "RC-TIMUR-2-B",
    blokKey: "RC-TIMUR-2-B",
    unit: "RC 2",
    isRC: true,
    points: [
      [790, 984],
      [875, 984],
      [860, 1062],
      [775, 1062],
    ],
  },
];

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function interp(a: Point, b: Point, t: number): Point {
  return [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];
}

function rowToLots(row: RowDef): LotPoly[] {
  const n = row.units.length;
  return row.units.map((unit, index) => {
    const a = index / n;
    const b = (index + 1) / n;
    return {
      lotId: `${row.blok}-${row.tl[0]}-${row.tl[1]}-${unit}-${index}`,
      blokKey: `${row.blok} ${unit}`,
      unit,
      points: [
        interp(row.tl, row.tr, a),
        interp(row.tl, row.tr, b),
        interp(row.bl, row.br, b),
        interp(row.bl, row.br, a),
      ],
    };
  });
}

const SCALED_ROWS = ROWS.map(scaleRow).map((row) => insetRow(row, ROW_EDGE_INSET));

export const SITEPLAN_LOT_POLYGONS: LotPoly[] = [
  ...SCALED_ROWS.flatMap(rowToLots),
  ...RC_POLYS.map((rc) => ({
    ...rc,
    points: rc.points.map((p) => toImageCoords(p)),
  })),
];
