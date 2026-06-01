#!/usr/bin/env python3
"""
Ekstrak kavling dari assets/file.svg.

1. Deteksi "strip" horizontal dari path SVG (deret unit)
2. Pasangkan strip → baris 8…1
3. Per deret: gabung path per sel (urutan kiri→kanan = nomor di siteplan-lot-map)

Regenerate:
  python3 scripts/extract-siteplan-from-svg.py
"""
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SVG = ROOT / "assets" / "file.svg"
OUT = ROOT / "lib/constants/siteplan-unit-rects.ts"

VIEW_W, VIEW_H = 1236, 1188
MID_X = 620  # pemisah NHB | NHT

DERET_H = 66 * (VIEW_H / 984)

LOT_MAP: dict[str, dict[str, list[int]]] = {
    "NHB-8": {"atas": [30, 28, 26, 22, 20, 18, 16, 12, 10, 8, 2], "bawah": [23, 21, 19, 17, 15, 11, 9, 7, 5, 1]},
    "NHB-7": {"atas": [20, 18, 16, 12, 10, 8, 6, 2], "bawah": [17, 15, 11, 9, 7, 5, 3, 1]},
    "NHB-6": {"atas": [20, 18, 16, 12, 10, 8, 6, 2], "bawah": [17, 15, 11, 9, 7, 5, 3, 1]},
    "NHB-5": {"atas": [32, 30, 28, 26, 22, 20, 18, 16, 12, 10, 8, 2], "bawah": [27, 25, 23, 21, 19, 17, 15, 11, 9, 7, 5, 3, 1]},
    "NHB-4": {"atas": [27, 25, 23, 21, 19, 17, 15, 11, 9, 7, 5, 3, 1], "bawah": [26, 22, 20, 18, 16, 12, 10, 8, 6, 2]},
    "NHB-3": {"atas": [28, 26, 22, 20, 18, 16, 12, 10, 8, 2], "bawah": [21, 19, 17, 15, 11, 9, 7, 5, 3, 1]},
    "NHB-2": {"atas": [32, 30, 28, 26, 22, 20, 18, 16, 12, 10, 8, 2], "bawah": [23, 21, 19, 15, 11, 9, 7, 5, 3]},
    "NHB-1": {"atas": [28, 26, 22, 20, 18, 16, 12, 10, 8, 2], "bawah": [23, 21, 19, 17, 15, 11, 9, 7, 5, 3, 1]},
    "NHT-8": {"atas": [56, 52, 50, 38, 36, 32, 30, 28, 26, 20, 18, 16, 10, 8, 6, 2], "bawah": [35, 33, 31, 29, 27, 25, 23, 21, 19, 17, 15, 11, 9, 7, 5, 3, 1]},
    "NHT-7": {"atas": [32, 30, 28, 26, 22, 20, 18, 16, 12, 10, 8, 6, 2], "bawah": [21, 19, 17, 15, 11, 9, 7, 5, 1]},
    "NHT-6": {"atas": [26, 22, 20, 18, 16, 12, 10, 8, 2], "bawah": [25, 23, 21, 19, 17, 15, 11, 9, 5]},
    "NHT-5": {"atas": [38, 36, 32, 30, 28, 26, 22, 20, 18, 16, 12, 10, 8, 2], "bawah": [37, 35, 33, 31, 29, 27, 25, 23, 21, 19, 17, 15, 11, 9, 7, 5, 3, 1]},
    "NHT-4": {"atas": [21, 19, 17, 15, 11, 9, 7, 5, 3, 1], "bawah": [20, 18, 16, 12, 10, 8, 6, 2]},
    "NHT-3": {"atas": [50, 38, 36, 32, 30, 28, 26, 20, 18, 16, 12, 10, 8, 2], "bawah": [23, 21, 19, 17, 15, 11, 9, 7, 5]},
    "NHT-2": {"atas": [36, 32, 30, 28, 26, 22, 20, 18, 16, 12, 10, 8, 2], "bawah": [19, 17, 15, 11, 9, 7, 5, 3]},
    "NHT-1": {"atas": [22, 20, 18, 16, 12, 10, 8, 6, 2], "bawah": [19, 17, 15, 11, 9, 7, 5, 3, 1]},
}

# (index strip atas, index strip bawah, nomor baris)
# Strip 10 & 12 dipakai ulang → assign_row potong vertikal (atas/bawah)
STRIP_ROW_PAIRS: list[tuple[int, int, int]] = [
    (1, 2, 8),
    (3, 5, 7),
    (7, 9, 6),
    (9, 10, 5),
    (10, 10, 4),
    (10, 10, 3),
    (12, 12, 2),
    (12, 12, 1),
]


def bbox_from_d(d: str) -> tuple[float, float, float, float] | None:
    nums = [float(x) for x in re.findall(r"[-+]?(?:\d+\.\d+|\d+)", d.replace("\n", " "))]
    if len(nums) < 4:
        return None
    xs, ys = nums[0::2], nums[1::2]
    if not xs:
        return None
    x0, y0 = min(xs), min(ys)
    return x0, y0, max(xs) - x0, max(ys) - y0


def parse_boxes(svg: str) -> list[dict]:
    paths = re.findall(r'<path[^>]*\sd="([^"]+)"', svg, re.DOTALL)
    out: list[dict] = []
    for d in paths:
        b = bbox_from_d(d)
        if not b:
            continue
        x, y, w, h = b
        if 8 < w < 140 and 18 < h < 120 and 20 < y < VIEW_H - 20 and 30 < x < VIEW_W - 20:
            out.append({"x": x, "y": y, "w": w, "h": h, "cx": x + w / 2, "cy": y + h / 2})
    return out


def split_strips(boxes: list[dict], gap: float = 28) -> list[list[dict]]:
    boxes = sorted(boxes, key=lambda b: b["cy"])
    if not boxes:
        return []
    strips: list[list[dict]] = [[boxes[0]]]
    for b in boxes[1:]:
        if b["cy"] - strips[-1][-1]["cy"] > gap:
            strips.append([b])
        else:
            strips[-1].append(b)
    return strips


def merge_boxes(boxes: list[dict]) -> tuple[float, float, float, float]:
    x0 = min(b["x"] for b in boxes)
    y0 = min(b["y"] for b in boxes)
    x1 = max(b["x"] + b["w"] for b in boxes)
    y1 = max(b["y"] + b["h"] for b in boxes)
    return x0, y0, x1 - x0, y1 - y0


def split_into_n(boxes: list[dict], n: int) -> list[list[dict]]:
    """Bagi path menjadi n kelompok berdasarkan jarak horizontal terbesar."""
    if n <= 0:
        return []
    if not boxes:
        return [[] for _ in range(n)]
    boxes = sorted(boxes, key=lambda b: b["cx"])
    if len(boxes) <= n:
        groups: list[list[dict]] = [[b] for b in boxes]
        while len(groups) < n:
            groups.append([])
        return groups

    gaps: list[tuple[float, int]] = []
    for i in range(len(boxes) - 1):
        gap = boxes[i + 1]["x"] - (boxes[i]["x"] + boxes[i]["w"])
        gaps.append((gap, i))
    split_indices = sorted(gaps, reverse=True)[: n - 1]
    split_indices = sorted(idx for _, idx in split_indices)

    groups: list[list[dict]] = []
    prev = 0
    for idx in split_indices:
        groups.append(boxes[prev : idx + 1])
        prev = idx + 1
    groups.append(boxes[prev:])
    return groups


def strip_y_range(strip: list[dict]) -> tuple[float, float]:
    return min(b["y"] for b in strip), max(b["y"] + b["h"] for b in strip)


def assign_deret(
    pool: list[dict],
    row_id: str,
    nums: list[int],
    rects: dict[str, dict[str, float]],
) -> None:
    groups = split_into_n(pool, len(nums))
    for num, group in zip(nums, groups):
        if not group:
            continue
        key = f"{row_id}/{num:02d}"
        x, y, w, h = merge_boxes(group)
        rects[key] = {
            "x": round(x, 1),
            "y": round(y, 1),
            "w": round(w, 1),
            "h": round(h, 1),
        }


def assign_row(
    strips: list[list[dict]],
    row_num: int,
    atas_idx: int,
    bawah_idx: int,
    rects: dict[str, dict[str, float]],
) -> None:
    for side in ("NHB", "NHT"):
        row_id = f"{side}-{row_num}"
        if row_id not in LOT_MAP:
            continue
        layout = LOT_MAP[row_id]
        is_nhb = side == "NHB"

        for deret, strip_idx, nums in [
            ("atas", atas_idx, layout["atas"]),
            ("bawah", bawah_idx, layout["bawah"]),
        ]:
            if strip_idx >= len(strips):
                continue
            strip = strips[strip_idx]
            if atas_idx == bawah_idx:
                y0, y1 = strip_y_range(strip)
                mid = (y0 + y1) / 2
                pool = [b for b in strip if (b["cy"] < mid if deret == "atas" else b["cy"] >= mid)]
            else:
                pool = list(strip)

            pool = [b for b in pool if (b["cx"] < MID_X) == is_nhb]
            assign_deret(pool, row_id, nums, rects)


def main() -> None:
    svg = SVG.read_text(encoding="utf-8", errors="ignore")
    boxes = parse_boxes(svg)
    strips = split_strips(boxes)

    rects: dict[str, dict[str, float]] = {}

    for atas_i, bawah_i, row_num in STRIP_ROW_PAIRS:
        assign_row(strips, row_num, atas_i, bawah_i, rects)

    lines = [
        "/**",
        " * Kavling dari assets/file.svg",
        " * Regenerate: python3 scripts/extract-siteplan-from-svg.py",
        " * Override manual: lib/constants/siteplan-unit-overrides.ts",
        f" * viewBox: 0 0 {VIEW_W} {VIEW_H}",
        " */",
        "export type UnitRect = { x: number; y: number; w: number; h: number };",
        "",
        f"export const SITEPLAN_VIEWBOX = {{ width: {VIEW_W}, height: {VIEW_H} }} as const;",
        "",
        "export const SITEPLAN_UNIT_RECTS: Record<string, UnitRect> = {",
    ]
    for key in sorted(rects.keys()):
        r = rects[key]
        lines.append(
            f'  "{key}": {{ x: {r["x"]}, y: {r["y"]}, w: {r["w"]}, h: {r["h"]} }},'
        )
    lines.append("};")
    lines.append("")

    OUT.write_text("\n".join(lines), encoding="utf-8")
    print(f"Strips: {len(strips)}, wrote {len(rects)} rects → {OUT}")


if __name__ == "__main__":
    main()
