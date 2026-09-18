# Nahara siteplan audit and implementation plan

Status: source audit, shared foundations and explicitly **unverified 2D and
provisional 3D previews** implemented on `feat/nahara-canonical-siteplan`.
Canonical alignment is **not implemented or verified**.

The latest milestone adds differentiated procedural houses, paved corridors,
camera transitions and street walking while locking the accepted placement
pipeline. See [current 3D milestone](nahara-3d-milestone.md) for implementation,
controls, tests and limitations. The phase-1 notes below describe the earlier
box-only stage, not the current visual/exploration feature set.

## Authorized provisional preview

The user authorized approximate overlay UX and brochure Tahap 1 as a provisional
numbering/type reference. The existing row geometry, ordering and addresses are
preserved, including conflicts. They are not canonical geometry.

The preview uses one SVG viewport containing the existing raster and approximate
polygons. Each polygon now supplies both fill and interaction; no additional
inset hit shape exists. Lighter fills, opacity control, overlay visibility,
keyboard focus and persistent touch selection improve inspection. Clicking or
keyboard-activating a lot immediately opens the existing warga modal with the
same lookup result; the card's details button is an optional way to reopen it.
A visible unverified notice and conflict messages
remain in the map. The database drawer also warns that map matching is unverified.
Missing resident data is labeled unavailable rather than confirmed vacant.

The brochure legend is stored separately in
`lib/nahara/provisional-reference.ts`, with source/page/scope and unverified
provenance. Type/Hoek swatches are reference colors, not payment colors. No Hoek
assignments, new lot addresses or source path mappings have been inferred.
Displayed house types still come from the user's row configuration, explicitly
labeled temporary. Printed brochure numbers remain candidates for Tahap 1 only.

Brochure page 7 defines RC as **Rumah Contoh**, not public/open space. Existing
RC preview regions keep their approximate boundaries and now use that wording.
This does not verify each region's present use or extent. The PDF has 16 raster
pages, with no extracted vector drawings or text. Pages 10/12/14 supply standard
Type 9/7/5 lot dimensions of 9/7/5 × 17 m; these do not establish site geometry.

Source: [Nahara brochure, page 7](https://irp.cdn-website.com/3553c92d/files/uploaded/E-brochure%20Nahara%201.5.pdf#page=7).

## Authorized provisional 3D phase 1

The user's later instruction explicitly permits approximate 3D before canonical
alignment. This supersedes the earlier blocking gate for this provisional phase
only. The canonical requirements below still apply to any future accuracy claim.

- `lib/nahara/provisional-lots.ts` contains the unchanged legacy row, RC and
  subdivision definitions, shared by both views. Preview keys distinguish
  duplicate printed addresses; they are not canonical parcel IDs.
- `provisional-3d.ts` computes polygon area centroids and transforms the same
  vertices at 0.1 display units per JPG-preview coordinate. These are not metres.
  There was no stored yaw in the previous 2D renderer: even lots provisionally
  face the bottom quad edge and odd lots the top. This convention follows the
  old row arrangement, not verified road adjacency.
- Simple neutral boxes use the configured house types and brochure width/depth
  ratios. A uniform temporary fit keeps each box inside the convex approximate
  lot. Box height is also illustrative. RC has a plate but no typed house box.
- The R3F/Three.js module is dynamically imported only when switching to 3D,
  without SSR. Boxes use one instanced mesh and shared material; rendering is
  on demand, with capped DPR, no shadows and no textures. Status colors appear
  on plates only; a blue perimeter indicates selection.
- Both views use one selected preview key and the same activation/lookup
  callback. 3D plates and boxes open the existing warga modal immediately.
  The modal preserves resident name, occupancy and iuran, including when the
  address has a conflict. Missing rows are not labeled vacant.
- Orbit/zoom, reset camera, a permanent unverified label, WebGL failure fallback
  and a toggleable debug panel are included. Debug shows address, unique preview
  key, type, position, rotation and `validationState=provisional`.
- No walking, collision system, authoritative road mesh, detailed house model
  or numbering reconciliation is introduced.

Run geometry checks from the repository root:

```sh
node --test scripts/nahara-preview-geometry.test.cjs
```

Run the isolated browser fixture in one terminal, then tests in another:

```sh
npx next dev scripts/fixtures/nahara -H 127.0.0.1 -p 3100
npx playwright test --config scripts/playwright.nahara.config.ts
```

The fixture uses the real map/modal components, test-only residents and mocked
Supabase/auth modules; it makes no live database writes. By default the browser
config uses macOS Chrome; set `NAHARA_TEST_BROWSER` to another Chromium executable
if needed. This checks interactions/rendering, not physical accuracy or fps.

The sections below retain the original audit and canonical implementation gates.

## Source audit

| Source | Finding |
| --- | --- |
| `public/siteplan.svg` | 1,906,042 bytes, `viewBox="0 0 1236 1188"`, 3,297 paths, zero `data-lot-id` attributes, zero text elements |
| `assets/file.svg` | Byte-for-byte identical to the public SVG |
| `public/siteplan.jpg` | Current displayed plan, configured as 1024 × 984 |
| `docs/nahara-reference/siteplan-current.png` | Supplied UI screenshot; visibly demonstrates overlays crossing lot boundaries, RC and the eastern boulevard |
| `components/map/PetaLingkungan.tsx` | Active renderer: 249 generated residential shapes representing 248 distinct addresses, plus four manually defined RC shapes |
| `lib/constants/siteplan-lot-map.ts` | Another list with 349 addresses; not an authoritative SVG-to-lot association |
| `lib/constants/siteplan-unit-rects.ts` | Generated rectangular approximations; not source lot paths |
| `lib/constants/kavling-paths.ts` | Generated from synthetic `cluster-layout` geometry; not source lot paths |

The SVG contains anonymous cubic paths for the artwork, including boundaries
and lettering. The first path alone spans almost the entire viewBox; treating
each path as one house would be incorrect. There is no established association
between these 3,297 paths and the database addresses. This inventory identifies
all source geometry elements, **not 3,297 lots**.

Reproduce the inventory:

```sh
node scripts/audit-nahara-siteplan.mjs
node scripts/audit-nahara-siteplan.mjs --elements
```

The second command lists every geometry element's source index, existing ID,
lot ID if present, and SHA-256. These indexes are diagnostic references, never
new residential IDs. The source hash is
`41b94d1e804a7bcd88ad3e09cb270791a595bf4d4694652310017ca05497ab0c`.

## Why alignment is wrong

`PetaLingkunganCard` mounts `PetaLingkungan`, which displays a JPG and an
absolutely positioned SVG. `ROWS` supplies manually entered quadrilateral
corners. `rowToLots` divides each quadrilateral evenly by the number of units.
Individual SVG lot geometry is never read.

The shapes are scaled from 1236 × 1188 to 1024 × 984, inset at row level, and
inset again per lot. The visible polygon and the transparent hit polygon use
different insets. Consequently, the displayed boundary and click target differ
even before comparing them with the real plan.

Equal divisions cannot reproduce unequal widths, irregular corner lots, curved
edges, or RC gaps. Zoom magnifies this pre-existing mismatch. The current JPG
and overlay share a zoom container, so the evidence does not establish an
independent CSS zoom-transform bug. Fixing CSS alone cannot fix the geometry.

The older Python extractor also cannot be promoted to a canonical source: it
groups path bounds heuristically, reuses strips for multiple rows, and emits
rectangles. Its bounds function takes coordinate extrema including Bézier
control points; that is not the curve's actual filled boundary.

## Identity conflicts requiring authoritative input

- Active `ROWS` repeats `NHT-8/16`. The displayed plan also contains two adjacent
  “16” labels there. The separate lot list contains that address once. Removing
  one or renaming it would make an unverified identity decision.
- The lot list includes rows 4 and 5; the displayed plan shows rows 1, 2, 3, 6,
  7 and 8. These extra rows must not be placed in invented positions.
- The list contains `NHB-1/7`, `NHB-1/3` and `NHT-1/1`, absent from active `ROWS`.
  The bottom printed numbering also differs from the active renderer.
- The second upper NHB-2 label appears as “38” in the raster, while both active
  code and the separate list use 30. Do not silently rewrite either source.

Needed to finish semantic mapping: the original editable plan with identifiable
lot boundaries and authoritative numbering, or a verified element-to-address
mapping for this exact SVG with the numbering conflicts resolved. IDs need not
already be attached if the original lot elements and labels can be associated
unambiguously. Screenshots and house photographs do not resolve these conflicts.

## Canonical data and status

`lib/nahara/types.ts` proposes `NaharaLot`: canonical ID, existing normalized
database address, block, row, number, configured house type, status, source
element reference and source hash. Geometry metrics are derived caches tied to
that source: area centroid, bounds, primary frontage edge, width, depth and yaw.
RC/open-space features will be separate from residential lots.

The SVG remains the geometry authority. The database remains the status
authority. Do not duplicate path coordinates in a hand-maintained lot table.

The dashboard already reads Supabase `warga` joined to `iuran(status, bulan)`.
It computes `iuran_lunas` for the current month and passes `WargaWithIuran[]` to
the map. Preserve this query, `normalizeBlokKey`, existing modal callbacks and
payment updates. Current coloring precedence is vacancy, contract, then payment.

The current renderer assumes a missing resident means `Kosong`. The proposed
model uses `status: null` for unavailable status evidence, to avoid presenting
absence of a record as verified vacancy. No existing business behavior has been
changed; this distinction needs an explicit adapter when integrating the map.

## Type mapping and coordinates

`lib/nahara/houseTypes.ts` implements the requested configuration:

| Rows | House type |
| --- | --- |
| 1, 2 | 5 |
| 3, 8 | 7 |
| 6, 7 | 9 |
| Other rows | Unmapped; no fallback model |

`lib/nahara/coordinates.ts` implements a reversible, uniform transform:

```text
cx = viewBox.x + viewBox.width / 2
cy = viewBox.y + viewBox.height / 2
X = (svgX - cx) × scale
Z = (svgY - cy) × scale
Y = elevation
```

Apply each element's full SVG transform into root viewBox space first. A single
scale preserves distances, angles and aspect ratio. Calibrate it against a
verified physical dimension before treating world units as metres.

Compute area centroids from filled geometry, respecting holes and transforms;
do not use a path's starting point or a bounding-box center as its centroid.
For curves, establish a documented tessellation tolerance. Keep the original
curve in 2D and derive the 3D contour from it.

Determine primary frontage from adjacency to verified road geometry, explicitly
reviewing corners. With model front along local +Z, yaw is
`atan2(frontage.x - centroid.x, frontage.y - centroid.y)`.
The converter implements that convention, but does not invent road adjacency
or claim that actual lot frontages have been verified.

## Implementation sequence and gates

1. **Resolve source identities.** Validate every residential address against a
   source boundary and numbering. Separate roads, RC, labels and decoration.
   Attach `id="lot-NHB-6-12"` and `data-lot-id="NHB-6-12"` directly to the
   verified original lot element. Reject duplicate IDs and ambiguous mappings.
   Preserve every boundary, gap and original label.
2. **Correct 2D.** Render one inline canonical SVG with its original viewBox.
   Apply status fill, hover, selection, keyboard activation and click handlers
   to the same source element. Keep labels readable above fills and ensure
   label artwork does not intercept lot interactions. Preserve pan/pinch/zoom,
   desktop tooltips, mobile taps and existing administration modals. Keep
   selected lot ID in shared parent state for later 3D integration.
3. **Verify 2D before 3D.** Check every ID and especially curved eastern lots,
   corners, opposing frontages and RC boundaries. Exercise desktop and mobile
   widths, pan and zoom levels 1–5. Assert one interactive element per ID and
   no second hit/overlay geometry. Capture alignment screenshots and perform
   click/keyboard tests. The current passing utility tests do not satisfy this
   gate.
4. **Debug 3D geometry.** Lazy-load Three.js/R3F only after the 2D gate passes.
   Transform the same contours into ground footprints and simple debug boxes.
   Derive roads from verified source road contours. Verify every box's source
   bounds, centroid and frontage before adding detailed houses.
5. **Reusable houses.** Build optimized Type 5/7/9 models from
   `docs/nahara-reference/type-{5,7,9}-reference-01.png`. Validate compact/medium/
   premium silhouettes, hip roofs, window sections and Type 9's three-car
   carport. Fit within each lot with constrained uniform scaling; flag lots
   that do not fit. Use street/aerial photos for materials and landscaping.
6. **Environment and interaction.** Source-aligned roads, paving, planting,
   lamps and public spaces; realistic white architecture with status on lot
   plates/boundaries. Add master-plan, smooth house-focus and explore modes.
   Synchronize selection across 2D/3D. WASD/arrows/Shift and mobile joystick/look
   must stay within verified walkable geometry, with house collision checks.
7. **Performance.** Reuse materials/geometries, instance repeated details,
   constrain shadows and DPR, add LOD and lazy loading. Measure frame times on
   desktop and a representative mobile device before claiming 60/30fps.

Debug UI must display lot ID, type, SVG area centroid, world position, rotation,
source element and source validation state. Show SVG bounds and corresponding
3D bounds only in debug mode; bounds must never become substitute lot geometry.

## Validation of work implemented so far

- Five tests pass: viewBox offsets and round trips, preservation of angled-edge
  scale, opposite frontage directions, invalid transform inputs, and row mapping.
- Four additional geometry tests pass: every 3D plate round-trips to the preview
  vertices, all rotated boxes fit inside their lots, duplicate addresses retain
  separate keys, and missing residents remain distinct from confirmed vacancy.
- Browser regression passes with actual WebGL rendering: immediate warga modal
  from 2D and 3D, selecting a different 3D lot and returning to it in 2D,
  conflict warnings with resident details preserved, keyboard activation,
  missing-row wording, narrow-screen touch activation and mobile 3D rendering.
  Width changes now recenter the 2D viewport to avoid stale desktop pan offsets.
- A source comparison verified that the moved row/RC definitions, numbering,
  ordering, scaling and subdivision functions match the original renderer.
- `npx tsc --noEmit --incremental false` passes.
- `npm run lint` passes with an existing missing-effect-dependency warning in
  `components/warga/WargaPresenceHeartbeat.tsx`.
- Source assets, database and user reference folder remain untouched. The
  production renderer now offers the authorized approximate preview described
  above. No canonical 2D alignment, 3D placement or runtime performance claims
  can be made yet.
