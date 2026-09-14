import type { HouseType } from "./types";

/** Confirmed mapping from the project brief; never infer types from lot width. */
export const HOUSE_TYPE_BY_ROW: Readonly<Partial<Record<number, HouseType>>> = {
  1: 5,
  2: 5,
  3: 7,
  8: 7,
  6: 9,
  7: 9,
};

export function houseTypeForRow(row: number): HouseType | null {
  return HOUSE_TYPE_BY_ROW[row] ?? null;
}
