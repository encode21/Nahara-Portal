const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const ts = require("typescript");
// Use the project's TypeScript compiler; no generated test source is committed.
require.extensions[".ts"] = (module, filename) => module._compile(ts.transpileModule(
  fs.readFileSync(filename, "utf8"),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } },
).outputText, filename);
const { SITEPLAN_LOT_POLYGONS } = require("../lib/nahara/provisional-lots.ts");
const { previewPlacement, PREVIEW_COORDINATES, polygonCentroid } = require("../lib/nahara/provisional-3d.ts");
const { getHouseStyle, statusLabel } = require("../lib/nahara/preview-status.ts");
const { createHash } = require("node:crypto");
const path = require("node:path");
const { createWalkNetwork, streetSpawn, moveOnRoad, insidePolygon } = require("../lib/nahara/walk-network.ts");
const { HOUSE_VISUALS } = require("../lib/nahara/house-visuals.ts");

test("accepted placement, yaw and row mapping sources remain locked", () => {
  const hashes = {
    "provisional-lots.ts": "e6ec6d5f3656d34274e1cbb903099d95e63ee13adb8dd03a074e775b153e52f0",
    "provisional-3d.ts": "be67776cc215be6db8b907870d4e7ac061a296df660fb3fd8396582877a72267",
    "houseTypes.ts": "4db24948546866054e54b08412323aec3b4af6a6cc6b56dc80364e95a6cfb666",
    "walk-network.ts": "76f770dace5d4ca938f8c23596be54995e93d2dfca5a4a05a8d6285e6a1136bf",
    "../../components/3d/LotPlates.tsx": "c1a878f991b96211a4c9256abad3243f86a6d425a57c915be20c9c55878d657c",
    "../../components/3d/CameraRig.tsx": "08f0bfcde2876b83cef88d0ff03806f29b41ecd427117a1a5c2c8a9961edb937",
    "../../components/3d/WalkJoystick.tsx": "249fb3c6773594c04154df5559d9109f9607bcdb1822052138d5b4cbfc83f691",
  };
  for (const [file, hash] of Object.entries(hashes)) {
    assert.equal(createHash("sha256").update(fs.readFileSync(path.join(__dirname, "../lib/nahara", file))).digest("hex"), hash);
  }
});

test("LOD changes visibility only; house construction/placement and road/anchor generation stay locked", () => {
  for (const [file, start, end, hash] of [
    ["HouseModels.tsx", "function makeHouse", "  const target =", "5314691acd762276fb97d07dcfa1d1ea6f29e41b153f89bbe20b233b02ffd819"],
    ["Neighborhood.tsx", "export function Neighborhood", "  return <group>", "8879294091ec78e857b2313cb4366ac00338125d18caa310370732ac30ad3419"],
  ]) {
    const source = fs.readFileSync(path.join(__dirname, "../components/3d", file), "utf8");
    assert.equal(createHash("sha256").update(source.slice(source.indexOf(start), source.indexOf(end))).digest("hex"), hash);
  }
});

test("in-world resident presentation is allowlisted by audience; ops cannot see payments", () => {
  const { residentPresentation } = require("../lib/nahara/resident-presentation.ts");
  const resident = { nama: "Warga Uji", status_hunian: "Tetap", iuran_lunas: false, phone: "private", email: "private" };
  assert.deepEqual(residentPresentation("NHB-6/12", "public", resident), { address: "NHB-6/12" });
  assert.deepEqual(residentPresentation("NHB-6/12", "resident", resident), { address: "NHB-6/12", name: "Warga Uji" });
  assert.deepEqual(residentPresentation("NHB-6/12", "ops", resident), { address: "NHB-6/12", name: "Warga Uji", occupancy: "Tetap" });
  assert.equal(residentPresentation("NHB-6/12", "admin", resident).status, "Belum Bayar");
  assert.equal(residentPresentation("NHB-6/12", "admin").status, "Data hunian belum tersedia");
});

test("unselected street entry uses the unchanged road mask and faces a traversable direction", () => {
  const { nearestRoadEntry } = require("../lib/nahara/street-entry.ts");
  const network = createWalkNetwork(SITEPLAN_LOT_POLYGONS.map(previewPlacement));
  for (const near of [[0, 0], [80, 100], [-30, 20]]) {
    const entry = nearestRoadEntry(network, near);
    assert.ok(entry);
    assert.equal(network.canWalk(...entry.point), true);
    assert.equal(network.canWalk(entry.point[0] - Math.sin(entry.yaw) * 0.1, entry.point[1] - Math.cos(entry.yaw) * 0.1), true);
  }
});

test("visual types have different window sections, parking and premium balcony", () => {
  assert.deepEqual([5, 7, 9].map((t) => HOUSE_VISUALS[t].windowSections), [2, 3, 3]);
  assert.deepEqual([5, 7, 9].map((t) => HOUSE_VISUALS[t].parkingBays), [1, 2, 3]);
  assert.equal(HOUSE_VISUALS[9].balcony, true);
  assert.equal(HOUSE_VISUALS[5].balcony, false);
});

test("street spawn and movement stay on public corridors, including long sprint steps", () => {
  const placements = SITEPLAN_LOT_POLYGONS.map(previewPlacement);
  const network = createWalkNetwork(placements);
  assert.ok(network.mask.some(Boolean));
  assert.ok(network.eyeHeight > 0);
  for (const p of placements) {
    assert.equal(network.canWalk(p.position.x, p.position.z), false);
    const spawn = streetSpawn(network, p);
    if (!spawn) continue;
    assert.equal(network.canWalk(...spawn), true);
    const stopped = moveOnRoad(network, spawn, (p.position.x - spawn[0]) * 20, (p.position.z - spawn[1]) * 20);
    assert.equal(network.canWalk(...stopped), true);
    assert.equal(placements.some((other) => insidePolygon(stopped, other.points)), false);
  }
  assert.ok(streetSpawn(network, placements.find((p) => p.lot.blokKey === "NAHARA BARAT 6 12")));
});

test("every provisional plate round-trips to the exact preview vertices", () => {
  for (const lot of SITEPLAN_LOT_POLYGONS) {
    const p = previewPlacement(lot);
    assert.equal(p.validationState, "provisional");
    p.points.forEach(([x, z], i) => {
      const source = PREVIEW_COORDINATES.worldToSvg({ x, y: 0, z });
      assert.ok(Math.abs(source.x - lot.points[i][0]) < 1e-8);
      assert.ok(Math.abs(source.y - lot.points[i][1]) < 1e-8);
    });
    assert.ok(Number.isFinite(p.rotation));
  }
});

test("rotated temporary boxes fit inside all convex provisional lot boundaries", () => {
  for (const lot of SITEPLAN_LOT_POLYGONS.filter((p) => !p.isRC)) {
    const p = previewPlacement(lot);
    assert.ok(p.box.width > 0 && p.box.depth > 0 && p.box.height > 0);
    assert.ok(Math.abs(p.box.width / p.box.depth - p.type / 17) < 1e-8);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      const x = p.position.x + Math.cos(p.rotation) * p.box.width / 2 * sx + Math.sin(p.rotation) * p.box.depth / 2 * sz;
      const z = p.position.z - Math.sin(p.rotation) * p.box.width / 2 * sx + Math.cos(p.rotation) * p.box.depth / 2 * sz;
      p.points.forEach((a, i) => {
        const b = p.points[(i + 1) % p.points.length];
        const cross = (b[0] - a[0]) * (z - a[1]) - (b[1] - a[1]) * (x - a[0]);
        assert.ok(cross >= -1e-8, `${lot.lotId}: box outside lot`);
      });
    }
  }
});

test("duplicate addresses remain separate selectable preview keys", () => {
  const duplicates = SITEPLAN_LOT_POLYGONS.filter((p) => p.blokKey === "NAHARA TIMUR 8 16");
  assert.equal(duplicates.length, 2);
  assert.notEqual(duplicates[0].lotId, duplicates[1].lotId);
  assert.equal(new Set(SITEPLAN_LOT_POLYGONS.map((p) => p.lotId)).size, SITEPLAN_LOT_POLYGONS.length);
});

test("centroid uses polygon area; missing residents are distinct from vacant", () => {
  assert.deepEqual(polygonCentroid([[0, 0], [6, 0], [0, 6]]), [2, 2]);
  assert.equal(statusLabel(), "Data hunian belum tersedia");
  assert.notDeepEqual(getHouseStyle(), getHouseStyle({ status_hunian: "Kosong" }));
  assert.equal(statusLabel({ status_hunian: "Kontrak", iuran_lunas: true }), "Kontrak");
  assert.equal(statusLabel({ status_hunian: "Tetap", iuran_lunas: true }), "Lunas");
  assert.equal(statusLabel({ status_hunian: "Tetap", iuran_lunas: false }), "Belum Bayar");
});
