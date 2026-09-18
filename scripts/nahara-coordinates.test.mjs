// node --experimental-strip-types --test scripts/nahara-coordinates.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { createCoordinateSystem } from "../lib/nahara/coordinates.ts";
import { houseTypeForRow } from "../lib/nahara/houseTypes.ts";

const close = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-9);

test("root viewBox center, origin offsets and elevation survive round-trip", () => {
  const system = createCoordinateSystem({ x: 10, y: -20, width: 1236, height: 1188 }, 0.1);
  assert.deepEqual(system.svgToWorld({ x: 628, y: 574 }, 1.65), { x: 0, y: 1.65, z: 0 });
  for (const point of [{ x: 10, y: -20 }, { x: 1246, y: 1168 }, { x: 634.17, y: 218.31 }]) {
    const result = system.worldToSvg(system.svgToWorld(point));
    close(result.x, point.x);
    close(result.y, point.y);
  }
});

test("uniform scale preserves angled edges and aspect ratio", () => {
  const system = createCoordinateSystem({ x: 0, y: 0, width: 1236, height: 1188 }, 0.2);
  const a = system.svgToWorld({ x: 20, y: 40 });
  const b = system.svgToWorld({ x: 50, y: 80 });
  close(Math.hypot(b.x - a.x, b.z - a.z), 10);
  close((b.x - a.x) / (b.z - a.z), 3 / 4);
});

test("frontages across a street produce opposite model directions", () => {
  const system = createCoordinateSystem({ x: 0, y: 0, width: 100, height: 100 }, 1);
  const front = { x: 50, y: 50 };
  close(system.frontageYaw({ x: 50, y: 25 }, front), 0);
  close(system.frontageYaw({ x: 50, y: 75 }, front), Math.PI);
  close(system.frontageYaw({ x: 25, y: 50 }, front), Math.PI / 2);
  close(system.frontageYaw({ x: 75, y: 50 }, front), -Math.PI / 2);
  assert.throws(() => system.frontageYaw(front, front));
});

test("invalid scale and degenerate viewBoxes fail explicitly", () => {
  const viewBox = { x: 0, y: 0, width: 100, height: 100 };
  for (const scale of [0, -1, NaN, Infinity]) assert.throws(() => createCoordinateSystem(viewBox, scale));
  assert.throws(() => createCoordinateSystem({ ...viewBox, width: 0 }, 1));
});

test("only confirmed rows receive a house type", () => {
  for (const row of [1, 2]) assert.equal(houseTypeForRow(row), 5);
  for (const row of [3, 8]) assert.equal(houseTypeForRow(row), 7);
  for (const row of [6, 7]) assert.equal(houseTypeForRow(row), 9);
  for (const row of [0, 4, 5, 9]) assert.equal(houseTypeForRow(row), null);
});
