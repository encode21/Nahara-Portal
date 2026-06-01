#!/usr/bin/env python3
"""Ekstrak koordinat kavling dari siteplan.jpg → siteplan-unit-rects.ts"""
from __future__ import annotations

from pathlib import Path

from PIL import Image
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
IMG = ROOT / "public" / "siteplan.jpg"
OUT = ROOT / "lib" / "constants" / "siteplan-unit-rects.ts"

W, H = 1024, 984
DERET_H, LABEL_H = 66, 25

ROW_ANCHORS = {
    8: {"atasY": 42, "nhb": {"x": 88, "w": 358}, "nht": {"x": 432, "w": 378}},
    7: {"atasY": 238, "nhb": {"x": 90, "w": 356}, "nht": {"x": 434, "w": 376}},
    6: {"atasY": 405, "nhb": {"x": 93, "w": 353}, "nht": {"x": 436, "w": 374}},
    5: {"atasY": 497, "nhb": {"x": 96, "w": 350}, "nht": {"x": 438, "w": 372}},
    4: {"atasY": 561, "nhb": {"x": 100, "w": 346}, "nht": {"x": 440, "w": 370}},
    3: {"atasY": 656, "nhb": {"x": 108, "w": 338}, "nht": {"x": 442, "w": 368}},
    2: {"atasY": 743, "nhb": {"x": 118, "w": 328}, "nht": {"x": 444, "w": 366}},
    1: {"atasY": 830, "nhb": {"x": 128, "w": 318}, "nht": {"x": 446, "w": 364}},
}

LOT_MAP = {
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


def detect_runs(
    gray: np.ndarray, y0: int, y1: int, x0: int, x1: int, *, threshold: float = 0.52, min_w: int = 8
) -> list[tuple[int, int]]:
    strip = gray[y0:y1, max(0, x0) : min(W, x1)]
    ox = max(0, x0)
    col_fill = (strip > 200).mean(axis=0)
    is_unit = col_fill > threshold
    runs: list[tuple[int, int]] = []
    in_run = False
    start = 0
    for i, v in enumerate(is_unit):
        if v and not in_run:
            start = i
            in_run = True
        elif not v and in_run:
            if i - start >= min_w:
                runs.append((ox + start, i - start))
            in_run = False
    if in_run and len(is_unit) - start >= min_w:
        runs.append((ox + start, len(is_unit) - start))
    return runs


def merge_to_count(runs: list[tuple[int, int]], target: int) -> list[tuple[int, int]]:
    runs = list(runs)
    while len(runs) > target:
        widths = [w for _, w in runs]
        idx = min(range(len(widths)), key=lambda i: widths[i])
        if idx == 0:
            runs[1] = (runs[0][0], runs[0][1] + runs[1][1])
            del runs[0]
        else:
            runs[idx - 1] = (runs[idx - 1][0], runs[idx - 1][1] + runs[idx][1])
            del runs[idx]
    while len(runs) < target and runs:
        widest = max(range(len(runs)), key=lambda i: runs[i][1])
        x, w = runs[widest]
        if w < 12:
            break
        runs[widest] = (x, w // 2)
        runs.insert(widest + 1, (x + w // 2, w - w // 2))
    return runs[:target]


def fmt_blok(row_id: str, num: int) -> str:
    return f"{row_id}/{num:02d}"


def main() -> None:
    gray = np.array(Image.open(IMG).convert("L"))
    rects: dict[str, dict[str, int]] = {}
    issues: list[str] = []

    pad_y = 3
    h = DERET_H - pad_y * 2

    for row_num, anchor in ROW_ANCHORS.items():
        for side, prefix in [("nhb", "NHB"), ("nht", "NHT")]:
            row_id = f"{prefix}-{row_num}"
            if row_id not in LOT_MAP:
                continue
            geo = anchor[side]
            layout = LOT_MAP[row_id]
            atas_y = anchor["atasY"]
            bawah_y = atas_y + DERET_H + LABEL_H
            x0 = geo["x"] - 20
            x1 = geo["x"] + geo["w"] + 20

            for y_base, nums in [(atas_y, layout["atas"]), (bawah_y, layout["bawah"])]:
                y0 = y_base + pad_y
                y1 = y_base + pad_y + h + 8
                runs = detect_runs(gray, y0, y1, x0, x1)
                if len(runs) != len(nums):
                    issues.append(f"{row_id}: {len(runs)} runs vs {len(nums)} nums")
                    runs = merge_to_count(runs, len(nums))
                for i, num in enumerate(nums):
                    if i >= len(runs):
                        break
                    x, rw = runs[i]
                    rects[fmt_blok(row_id, num)] = {"x": x, "y": y0, "w": rw, "h": h}

    lines = [
        "/**",
        " * Koordinat kavling — diekstrak dari siteplan.jpg (scripts/extract-siteplan-units.py).",
        " * Regenerate: python3 scripts/extract-siteplan-units.py",
        " */",
        "export type UnitRect = { x: number; y: number; w: number; h: number };",
        "",
        "export const SITEPLAN_UNIT_RECTS: Record<string, UnitRect> = {",
    ]
    for key in sorted(rects.keys()):
        r = rects[key]
        lines.append(f'  "{key}": {{ x: {r["x"]}, y: {r["y"]}, w: {r["w"]}, h: {r["h"]} }},')
    lines.append("};")
    lines.append("")

    OUT.write_text("\n".join(lines), encoding="utf-8")
    print(f"Wrote {len(rects)} rects → {OUT}")
    if issues:
        print(f"Adjusted {len(issues)} row(s):")
        for i in issues[:15]:
            print(f"  - {i}")


if __name__ == "__main__":
    main()
