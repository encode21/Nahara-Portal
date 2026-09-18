# Nahara procedural houses and street exploration

Implemented on `feat/nahara-canonical-siteplan`. These are reference-guided,
low-poly procedural houses, not GLB assets or a surveyed reconstruction.

## Locked placement

The accepted lot definitions, coordinate/centroid/yaw conversion and row mapping
remain byte-for-byte unchanged. Regression tests pin their SHA-256 hashes:

- `lib/nahara/provisional-lots.ts`
- `lib/nahara/provisional-3d.ts`
- `lib/nahara/houseTypes.ts`
- `lib/nahara/walk-network.ts`
- `components/3d/LotPlates.tsx`, `CameraRig.tsx`, `WalkJoystick.tsx`

The house construction/transforms and road/anchor generator sections are also
hash-pinned. Mobile rendering adds visibility tags and packed-instance picking
to their render wrappers only; it does not edit model vertices or placement.

Every model root uses the existing world centroid and yaw. A uniform scale from
the existing fit (`box.depth / 17`) is applied to the visual template. New details
are local to that template; no lots are repositioned or renumbered. Duplicate
addresses retain their distinct preview keys. `validationState=provisional`
remains visible, and database statuses remain separate from geometry validation.

## House representations

`components/3d/HouseModels.tsx` builds three reusable models, configured by
`lib/nahara/house-visuals.ts` and the existing row/type mapping:

| Type | Rows | Visible distinctions |
| --- | --- | --- |
| 5 | 1, 2 | Compact frontage, two window sections, smaller one-bay canopy |
| 7 | 3, 8 | Wider three-section facade, two-bay canopy |
| 9 | 6, 7 | Broad premium facade, balcony railing, three-bay canopy |

All use two-storey white walls, raised facade frames, cornices, dark windows,
hip roofs with coarse tile courses, black canopy supports, paved carports and
small planted front gardens. The supplied Type 5/7/9 reference photos guide
these differences. There are no fake residents, cars or commercial buildings.

## Streets and navigation

`lib/nahara/walk-network.ts` derives a provisional corridor mask from gaps around
the locked lot polygons. It does not add a rectangular city grid or modify the
plan. All lots, including RC, are excluded from walking. Cells too close to
parcel boundaries are excluded as well; the largest connected corridor is used
to avoid spawning on disconnected islands.

The same mask supplies the paving surface and movement checks. Paving uses a
small generated block-pattern texture; edge accents, garden trees, palms and
street lamps provide a restrained streetscape. Decorations are anchored to
parcel frontage corners, not arbitrarily scattered over the road network.

These paths are inferred from spacing, not authoritative road or sidewalk
boundaries. A selected lot needs a reachable path in front of it for street
entry. If no such point exists, the street-entry action is disabled with a
message. No unknown RC area is assumed to be public access.

## Camera and controls

- **MASTERPLAN:** orbit, pan and zoom. `← Kembali ke Peta` smoothly restores
  the saved aerial position, orientation and orbit target, preserving selection.
- **House Focus:** clicking a house or plate selects the same preview key used
  by 2D, starts a camera flight and immediately opens the existing warga modal.
  `Fokus Rumah` can refocus an existing selection without reopening the modal.
- **STREET_EXPLORE:** `Jelajahi Jalan` enters the existing road mask near the
  aerial orbit target without requiring selection and faces down the corridor.
  `Jelajahi Sekitar` enters in front of the selected house, facing its facade.
  OrbitControls are unmounted in this mode. Smooth descent ends at eye height.
  Click the canvas to capture the mouse (a browser user gesture is required);
  move the mouse to look, WASD/arrows to walk, Shift to sprint, ESC to release.
  Pointer-lock denial/unsupported browsers retain drag-look. Touch uses the left
  joystick and scene dragging on the right. Controls have acceleration/damping,
  no head bob and no vertical movement. Speeds are 3.5/6.5 nominal model m/s.
  The full control hint minimizes after nine seconds.
- **Nearby house inspection:** a small forward-cone target card supports
  `Lihat Rumah (E)`. E works while the mouse is captured; inspection releases
  it and opens the existing warga modal without changing street position/mode.
  Canvas clicks during walking capture the mouse rather than starting a flight.
- **Eye height:** 1.65 in nominal model metres, converted through the median
  model fit scale. This gives human-height proportions, not a metre-accurate
  claim about the neighborhood.
- **Collision:** motion is substepped and constrained to the paved corridor
  mask, preventing traversal of houses/private parcels and sprint tunneling.
  Movement pauses while a modal is open, the window loses focus or the page is
  hidden. Closing a modal restores keyboard focus to the walk canvas.

The debug panel shows selection, type, lot world position/yaw, camera position,
preview key and validation state. It sits outside the canvas so it does not
cover the street or joystick. Camera transition state disables street/focus
commands while a flight is in progress.

## Rendering and checks

### Mobile quality and selective bubbles

`RenderBudget.tsx` applies visibility-only LOD to the same three house templates.
Automatic quality uses a narrow-screen/coarse-pointer media query; the dropdown
can override it with **Hemat / mobile** or **Standar**. Mobile caps DPR at 1
(standard: 1.5). No real-time shadow maps are enabled; the road texture remains
128×128. No extra house models, materials or textures are introduced.

Each instanced batch packs only frustum-visible instances, retaining an explicit
source-index map so picking always resolves the original preview key. Mobile
omits distant trim/garden detail beyond approximately 22 display units and palm
detail beyond 30. Nearby houses retain the unchanged complete template. Standard
masterplan retains all original detail; walking uses distance detail limits.
Mobile street visibility ends at 58 display units with matching fog (standard:
150); aerial view retains the whole cluster. These are rendering distances, not
surveyed metres. The walk controller, corridor mask and collisions are unchanged.

The debug panel reports submitted house/vegetation instance parts and triangles;
these exclude road/plate draw calls and are **not measured FPS**. The browser
test confirms lower pixel and triangle budgets on an emulated high-DPR mobile
viewport. Actual thermal behavior and sustained FPS need real-device testing.

`ResidentBubbles.tsx` mounts at most two screen-facing labels: selection plus
desktop hover or the street controller's nearby forward target. There are no
permanent labels on all lots. Labels do not intercept walking/orbit gestures.
The selected popup includes detail/focus/explore actions; mouse-lock and E
inspection keep their behavior. A touch tap can inspect a house while walking,
without a camera flight; dragging remains look input. The existing immediate
warga modal remains available. Labels and panels use a short entrance animation
and honor reduced-motion preferences; the existing selected boundary is retained.

`resident-presentation.ts` is an allowlisted DTO for new bubbles/popups:

- Public/loading: address only (plus non-personal type/validation in the panel).
- Authenticated ordinary session: address and available resident name.
- Existing ops/registry roles: additionally occupancy, but **not payments**.
- Admin: occupancy and existing payment/status label.

Missing records never imply a confirmed vacant house. No family name is invented;
the existing `nama` is used verbatim. This is a presentation boundary, **not a
replacement for server authorization or Supabase RLS**. The existing 2D map,
status plates, legacy debug data and warga modal access are not re-authorized by
this change. Server-side audience-specific data delivery would be required
before exposing this existing authenticated map as a public application.

Models merge parts by material and instance those batches across each type.
All status plates share one vertex-colored mesh with per-triangle lot picking.
Road cells merge into horizontal strips, and palms/lamps are instanced. There
are no hundreds of unique house materials, external HDR downloads or dynamic
shadow maps. DPR stays capped and rendering is on demand outside walking and
camera transitions. Actual mobile hardware fps has not been benchmarked.

Run from the repository root:

```sh
node --experimental-strip-types --test scripts/nahara-coordinates.test.mjs
node --test scripts/nahara-preview-geometry.test.cjs
npx tsc --noEmit --incremental false
npm run lint
```

Browser fixture and regression tests (separate terminals):

```sh
npx next dev scripts/fixtures/nahara -H 127.0.0.1 -p 3100
npx playwright test --config scripts/playwright.nahara.config.ts
```

The browser fixture uses the real map/modal components with mocked database and
auth modules. It tests selection synchronization, resident/conflict handling,
focus/street/masterplan transitions, unselected road entry, saved aerial camera
restoration, pointer lock, keyboard and touch movement, sprinting and modal pause.
Unit checks cover unchanged placement/visual/road sources, type visual
configuration, plate round trips, fit and collision-safe street spawns/movement.
