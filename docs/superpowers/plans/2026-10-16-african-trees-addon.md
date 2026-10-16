# African Trees Add-on Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Bedrock `.mcaddon` that adds 10 African tree species, each with full vanilla-parity wood products (blocks, boat) and natural world generation, generated from one data table instead of hand-authored per species.

**Architecture:** A `data/trees.json` table drives a set of small template modules (`tools/lib/*`) that each produce one Bedrock JSON object per species; `tools/generate-pack.mjs` calls every template for every species and writes the result into `behavior_pack/` and `resource_pack/`; `tools/validate-pack.mjs` checks the generated output is structurally sound. Shape-bearing geometry (door, trapdoor, stairs, slab, fence, fence_gate, sign, hanging_sign, boat) is authored once per shape and shared across all 10 species — only texture bindings and block identifiers vary per species.

**Tech Stack:** Node.js (ESM, `.mjs`), built-in `node:test` + `node:assert/strict` (no new test framework dependency), `pngjs` (pure JS, no native build — chosen specifically because this sandbox's proxy blocks native-addon builds that fetch Node headers over plain HTTP, which is why `bedrock-protocol`'s `raknet-native` failed earlier), system `zip` CLI for packaging.

**Spec:** `docs/superpowers/specs/2026-10-16-african-trees-addon-design.md`

## Global Constraints

- Namespace: `africantrees` for every identifier.
- `min_engine_version`: `[1, 26, 52]` in both manifests.
- Species ids (fixed, exactly these 10, snake_case): `baobab`, `acacia_umbrella`, `african_mahogany`, `african_blackwood`, `iroko`, `sapele`, `marula`, `jackalberry`, `mopane`, `shea`.
- Shared biome pool for all 10 species' `feature_rule` placement: `plains`, `sunflower_plains`, `forest`, `birch_forest`, `savanna`, `savanna_plateau`, `windswept_savanna`.
- Full per-species family set: log, stripped_log, wood, stripped_wood, planks, stairs, slab, fence, fence_gate, door, trapdoor, pressure_plate, button, sign, hanging_sign, sapling (16 blocks) + boat (1 item/entity) = 17 families × 10 species = 170 generated block/item definitions (the spec's "160" figure omitted the boat row; this plan uses the correct 170).
- Generated `behavior_pack/` and `resource_pack/` directories are committed to the repo, not gitignored — they are the actual deliverable, not build output.
- No native-addon npm dependencies (sandbox network blocks their build step); `pngjs` is confirmed pure JS.
- None of the installed `.agents/skills/minecraft-*` skills document exact Bedrock block/item/feature component schemas (the Bedrock skill covers only manifest/folder/packaging; the world-gen and resource-pack skills in this bundle are Java Edition schemas, not Bedrock) — exact Bedrock component names/values are the implementer's own knowledge, checked against Microsoft's official Bedrock Creator docs (`https://learn.microsoft.com/minecraft/creator/`) wherever a step below says so, not against an installed skill reference.

## Review Focus

- A species id or display name colliding with an existing vanilla wood type (`oak`, `spruce`, `birch`, `jungle`, `acacia`, `dark_oak`, `mangrove`, `cherry`, `bamboo`, `crimson`, `warped`) would silently shadow or confuse vanilla content — Task 2 asserts none of the 10 ids match a vanilla wood type id.
- A `data/trees.json` entry missing a required field would otherwise propagate `undefined` silently into generated JSON rather than failing loudly — Task 2 asserts `loadTreeData()` throws on a missing required field.
- An invalid color value passed to the texture generator could silently emit a broken/blank texture instead of failing — Task 3 asserts the generator throws on invalid hex input.
- A typo'd id in a recipe or loot table (referencing a block/item that doesn't exist) would only surface in-game as a silent missing-item bug — Task 11 asserts `validate-pack.mjs` catches a deliberately broken reference, not just passes on the happy path.
- Running the generator twice should be idempotent (deterministic output, no drifting manifest UUIDs or duplicate entries) since it will be re-run whenever `data/trees.json` changes — Task 11 asserts two consecutive runs produce byte-identical output.

---

## Task 1: Repo scaffolding and manifests

**Files:**
- Create: `behavior_pack/manifest.json`
- Create: `resource_pack/manifest.json`
- Create: `resource_pack/pack_icon.png` (placeholder, reuse Task 3's solid-color generator once available — for this task, any valid 16x16+ PNG)
- Create: `data/manifest-ids.json`
- Create: `tools/lib/constants.mjs`
- Modify: `package.json` (add `pngjs` dependency; add `scripts.generate`, `scripts.validate`, `scripts.package`)
- Test: `tools/test/manifests.test.mjs`

**Interfaces:**
- Produces: `tools/lib/constants.mjs` exports `NAMESPACE` (string `"africantrees"`), `MIN_ENGINE_VERSION` (`[1, 26, 52]`), `BIOME_POOL` (array of the 7 biome strings from Global Constraints), `SPECIES_IDS` (array of the 10 id strings from Global Constraints, in the order listed).

- [ ] **Step 1: Generate and record fixed manifest UUIDs**

Run: `node -e "for (let i=0;i<4;i++) console.log(crypto.randomUUID())"`
Record the 4 output UUIDs in `data/manifest-ids.json` as `{ "behaviorPack": { "headerUuid": "...", "moduleUuid": "..." }, "resourcePack": { "headerUuid": "...", "moduleUuid": "..." } }`. These are generated once and never regenerated — regenerating them on every pack build would break pack identity/update detection in Minecraft.

- [ ] **Step 2: Write `tools/lib/constants.mjs`**

Plain ESM module exporting the four constants listed in Interfaces above, with no computation — literal values copied from Global Constraints.

- [ ] **Step 3: Write the failing test**

```js
// tools/test/manifests.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("both manifests are valid and distinct", () => {
  const bp = JSON.parse(readFileSync("behavior_pack/manifest.json", "utf8"));
  const rp = JSON.parse(readFileSync("resource_pack/manifest.json", "utf8"));
  assert.deepEqual(bp.header.min_engine_version, [1, 26, 52]);
  assert.deepEqual(rp.header.min_engine_version, [1, 26, 52]);
  assert.notEqual(bp.header.uuid, rp.header.uuid);
  assert.notEqual(bp.modules[0].uuid, rp.modules[0].uuid);
  assert.notEqual(bp.header.uuid, bp.modules[0].uuid);
});
```

- [ ] **Step 4: Run test to verify it fails**

Run: `node --test tools/test/manifests.test.mjs`
Expected: FAIL (`behavior_pack/manifest.json` does not exist yet)

- [ ] **Step 5: Write `behavior_pack/manifest.json` and `resource_pack/manifest.json`**

Use the standard Bedrock manifest shape (`format_version`, `header.name`, `header.description`, `header.uuid`, `header.version`, `header.min_engine_version`, one entry in `modules`). Pull UUIDs from `data/manifest-ids.json` by hand (manifests are static, not generated by the Task 11 pipeline). `header.version` starts at `[1, 0, 0]` for both. The resource pack's module `type` is `"resources"`; the behavior pack's module `type` is `"data"` (no Script API is required by this add-on — world-gen, growth, and crafting are all data-driven per the spec).

- [ ] **Step 6: Run test to verify it passes**

Run: `node --test tools/test/manifests.test.mjs`
Expected: PASS

- [ ] **Step 7: Create placeholder pack icon and wire package.json scripts**

`resource_pack/pack_icon.png`: any valid PNG for now (Task 3 will later make this a generated one if revisited; not test-gated here). `package.json`: add `"pngjs": "^7.0.0"` to dependencies, add `"generate": "node tools/generate-pack.mjs"`, `"validate": "node tools/validate-pack.mjs"`, `"package": "node tools/package-addon.mjs"` to scripts. Run `npm install` to confirm `pngjs` installs cleanly (pure JS, no native build expected).

- [ ] **Step 8: Commit**

```bash
git add behavior_pack/manifest.json resource_pack/manifest.json resource_pack/pack_icon.png data/manifest-ids.json tools/lib/constants.mjs tools/test/manifests.test.mjs package.json package-lock.json
git commit -m "Scaffold add-on manifests and shared constants"
```

---

## Task 2: Species data table and loader

**Files:**
- Create: `data/trees.json`
- Create: `tools/lib/trees-data.mjs`
- Test: `tools/test/trees-data.test.mjs`

**Interfaces:**
- Consumes: `SPECIES_IDS` from `tools/lib/constants.mjs` (Task 1).
- Produces: `loadTreeData(path = "data/trees.json")` returning `Species[]`, where each `Species` is `{ id: string, displayName: string, barkColorHex: string, plankColorHex: string, leafColorHex: string }`. Later tasks (3–10) take one `Species` object as their sole input.

- [ ] **Step 1: Write `data/trees.json`**

An array of exactly 10 objects, one per id in `SPECIES_IDS`'s order, each with `id`, `displayName` (title case, e.g. `"Baobab"`, `"Acacia"` for `acacia_umbrella`, `"African Mahogany"`, `"African Blackwood"`, `"Iroko"`, `"Sapele"`, `"Marula"`, `"Jackalberry"`, `"Mopane"`, `"Shea"`), `barkColorHex`, `plankColorHex`, `leafColorHex` (each a `"#RRGGBB"` string; pick 10 visually distinct palettes — exact hues are the implementer's call since the spec treats these as placeholder/distinguishable, not exact).

- [ ] **Step 2: Write the failing test**

```js
// tools/test/trees-data.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { loadTreeData } from "../lib/trees-data.mjs";

const VANILLA_WOOD_IDS = ["oak","spruce","birch","jungle","acacia","dark_oak","mangrove","cherry","bamboo","crimson","warped"];

test("loads exactly 10 species with required fields and no vanilla id collisions", () => {
  const species = loadTreeData();
  assert.equal(species.length, 10);
  const ids = species.map(s => s.id);
  assert.equal(new Set(ids).size, 10, "ids must be unique");
  for (const id of ids) assert.ok(!VANILLA_WOOD_IDS.includes(id), `${id} collides with a vanilla wood type`);
  for (const s of species) {
    for (const field of ["id", "displayName", "barkColorHex", "plankColorHex", "leafColorHex"]) {
      assert.ok(s[field], `missing ${field} on ${s.id}`);
    }
  }
});

test("throws when a required field is missing", () => {
  assert.throws(() => loadTreeData("tools/test/fixtures/trees-missing-field.json"));
});
```

- [ ] **Step 3: Create the missing-field fixture**

`tools/test/fixtures/trees-missing-field.json`: a copy of one valid entry with `plankColorHex` deleted, wrapped in an array.

- [ ] **Step 4: Run test to verify it fails**

Run: `node --test tools/test/trees-data.test.mjs`
Expected: FAIL (`trees-data.mjs` does not exist yet)

- [ ] **Step 5: Implement `loadTreeData(path)` in `tools/lib/trees-data.mjs`**

Reads and `JSON.parse`s the file at `path`, then for each entry validates all 5 required fields are present and truthy, throwing a descriptive `Error` naming the missing field and the entry's `id` (or index, if `id` itself is missing) on the first failure.

- [ ] **Step 6: Run test to verify it passes**

Run: `node --test tools/test/trees-data.test.mjs`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add data/trees.json tools/lib/trees-data.mjs tools/test/trees-data.test.mjs tools/test/fixtures/trees-missing-field.json
git commit -m "Add species data table and loader"
```

---

## Task 3: Placeholder texture generator

**Files:**
- Create: `tools/lib/texture-gen.mjs`
- Test: `tools/test/texture-gen.test.mjs`

**Interfaces:**
- Produces: `pngFromSolidColor(hex, size = 16)` and `pngFromTwoTone(hexA, hexB, size = 16)`, both returning a `Buffer` containing a valid PNG. `hex` is a `"#RRGGBB"` string; both throw on malformed input (missing `#`, wrong length, non-hex characters).

- [ ] **Step 1: Write the failing test**

```js
// tools/test/texture-gen.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { PNG } from "pngjs";
import { pngFromSolidColor, pngFromTwoTone } from "../lib/texture-gen.mjs";

const PNG_SIGNATURE = Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]);

test("pngFromSolidColor produces a valid 16x16 PNG", () => {
  const buf = pngFromSolidColor("#8B5A2B");
  assert.ok(buf.subarray(0, 8).equals(PNG_SIGNATURE));
  const png = PNG.sync.read(buf);
  assert.equal(png.width, 16);
  assert.equal(png.height, 16);
});

test("pngFromTwoTone produces a valid 16x16 PNG", () => {
  const buf = pngFromTwoTone("#8B5A2B", "#5C3A1E");
  const png = PNG.sync.read(buf);
  assert.equal(png.width, 16);
  assert.equal(png.height, 16);
});

test("rejects malformed hex colors", () => {
  assert.throws(() => pngFromSolidColor("not-a-color"));
  assert.throws(() => pngFromTwoTone("#fff", "#5C3A1E"));
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tools/test/texture-gen.test.mjs`
Expected: FAIL (`texture-gen.mjs` does not exist yet)

- [ ] **Step 3: Implement `tools/lib/texture-gen.mjs`**

Validate hex input with a strict `/^#[0-9a-fA-F]{6}$/` check in both functions before use, throwing `Error` otherwise. `pngFromSolidColor` fills every pixel with the parsed RGB (alpha 255) using `pngjs`'s `PNG` constructor and `PNG.sync.write`. `pngFromTwoTone` fills a banded pattern (e.g. alternating horizontal rows or a border/fill split) using both colors — exact pattern is the implementer's call, only validity/size is pinned.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tools/test/texture-gen.test.mjs`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add tools/lib/texture-gen.mjs tools/test/texture-gen.test.mjs
git commit -m "Add placeholder texture generator"
```

---

## Task 4: Shared shape geometry (one per block family, reused by all species)

**Files:**
- Create: `resource_pack/models/blocks/door.geo.json`, `trapdoor.geo.json`, `stairs.geo.json`, `slab.geo.json`, `fence.geo.json`, `fence_gate.geo.json`, `sign.geo.json`, `hanging_sign.geo.json`, `boat.geo.json` (9 files)
- Test: `tools/test/geometry.test.mjs`

**Interfaces:**
- Produces: 9 fixed geometry identifiers, each `geometry.africantrees_<shape>` (e.g. `geometry.africantrees_door`), consumed by Tasks 6, 7, and 9's block/item/entity templates as a literal string constant.

- [ ] **Step 1: Write the failing test**

```js
// tools/test/geometry.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";

const SHAPES = ["door","trapdoor","stairs","slab","fence","fence_gate","sign","hanging_sign","boat"];

test("every shared shape geometry file is valid and correctly identified", () => {
  for (const shape of SHAPES) {
    const geo = JSON.parse(readFileSync(`resource_pack/models/blocks/${shape}.geo.json`, "utf8"));
    const def = geo["minecraft:geometry"][0];
    assert.equal(def.description.identifier, `geometry.africantrees_${shape}`);
    assert.ok(Array.isArray(def.bones) && def.bones.length > 0);
  }
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tools/test/geometry.test.mjs`
Expected: FAIL (geometry files don't exist yet)

- [ ] **Step 3: Author the 9 geometry files**

Each file follows the standard Bedrock geometry format (`format_version`, one entry in `minecraft:geometry` with `description.identifier` set to the fixed string above, `description.texture_width`/`texture_height` set to 16, and a `bones` array with at least one cube element approximating that shape). Check exact current Bedrock geometry schema fields (any version-specific keys beyond what's used here) against Microsoft's official Bedrock Creator docs before finalizing — this plan pins the identifier and structural validity, not exact vertex coordinates, since shape fidelity is a modeling task not a programmatic one.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tools/test/geometry.test.mjs`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add resource_pack/models/blocks/*.geo.json tools/test/geometry.test.mjs
git commit -m "Add shared shape geometry for all wood-product block families"
```

---

## Task 5: Cube/column block templates (log, stripped_log, wood, stripped_wood, planks)

**Files:**
- Create: `tools/lib/block-templates/cubes.mjs`
- Test: `tools/test/block-templates-cubes.test.mjs`

**Interfaces:**
- Consumes: a `Species` object (Task 2's shape).
- Produces: `logBlock(species)`, `strippedLogBlock(species)`, `woodBlock(species)`, `strippedWoodBlock(species)`, `planksBlock(species)` — each `(Species) => object`, each object's `["minecraft:block"].description.identifier` equal to `africantrees:<species.id>_<suffix>` for suffixes `log`, `stripped_log`, `wood`, `stripped_wood`, `planks` respectively.

- [ ] **Step 1: Write the failing test**

```js
// tools/test/block-templates-cubes.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { logBlock, strippedLogBlock, woodBlock, strippedWoodBlock, planksBlock } from "../lib/block-templates/cubes.mjs";

const species = { id: "baobab", displayName: "Baobab", barkColorHex: "#8B5A2B", plankColorHex: "#C9A66B", leafColorHex: "#4C7A3B" };

test("cube/column block templates produce correctly identified blocks", () => {
  assert.equal(logBlock(species)["minecraft:block"].description.identifier, "africantrees:baobab_log");
  assert.equal(strippedLogBlock(species)["minecraft:block"].description.identifier, "africantrees:stripped_baobab_log");
  assert.equal(woodBlock(species)["minecraft:block"].description.identifier, "africantrees:baobab_wood");
  assert.equal(strippedWoodBlock(species)["minecraft:block"].description.identifier, "africantrees:stripped_baobab_wood");
  assert.equal(planksBlock(species)["minecraft:block"].description.identifier, "africantrees:baobab_planks");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tools/test/block-templates-cubes.test.mjs`
Expected: FAIL (`cubes.mjs` does not exist yet)

- [ ] **Step 3: Implement `tools/lib/block-templates/cubes.mjs`**

Each function returns a standard Bedrock block definition (`format_version`, `minecraft:block.description.identifier`, `minecraft:block.components` including at minimum `minecraft:geometry` set to `"minecraft:geometry.full_block"` and `minecraft:material_instances` referencing per-species texture short names — e.g. `<species.id>_log`, `<species.id>_log_top` for the log's two faces, `<species.id>_planks` for planks). Exact remaining vanilla-parity components (destroy time, flammability, map color) are the implementer's call, checked against official docs; only the identifier is pinned by the test.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tools/test/block-templates-cubes.test.mjs`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add tools/lib/block-templates/cubes.mjs tools/test/block-templates-cubes.test.mjs
git commit -m "Add cube/column block templates (log, wood, planks family)"
```

---

## Task 6: Shaped block templates (stairs, slab, fence, fence_gate, door, trapdoor, pressure_plate, button)

**Files:**
- Create: `tools/lib/block-templates/shaped.mjs`
- Test: `tools/test/block-templates-shaped.test.mjs`

**Interfaces:**
- Consumes: a `Species` object (Task 2); the 9 geometry identifiers from Task 4.
- Produces: `stairsBlock`, `slabBlock`, `fenceBlock`, `fenceGateBlock`, `doorBlock`, `trapdoorBlock`, `pressurePlateBlock`, `buttonBlock` — each `(Species) => object`, identifier `africantrees:<species.id>_<suffix>`, and (for stairs/slab/fence/fence_gate/door/trapdoor) `["minecraft:block"].components["minecraft:geometry"]` equal to the matching Task 4 geometry identifier (`geometry.africantrees_stairs`, etc. — pressure_plate and button use `minecraft:geometry.full_block`-style flat/simple built-in shapes, not a Task 4 file, since vanilla already provides those primitives).

- [ ] **Step 1: Write the failing test**

```js
// tools/test/block-templates-shaped.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { stairsBlock, slabBlock, fenceBlock, fenceGateBlock, doorBlock, trapdoorBlock, pressurePlateBlock, buttonBlock } from "../lib/block-templates/shaped.mjs";

const species = { id: "baobab", displayName: "Baobab", barkColorHex: "#8B5A2B", plankColorHex: "#C9A66B", leafColorHex: "#4C7A3B" };

const cases = [
  [stairsBlock, "stairs", "geometry.africantrees_stairs"],
  [slabBlock, "slab", "geometry.africantrees_slab"],
  [fenceBlock, "fence", "geometry.africantrees_fence"],
  [fenceGateBlock, "fence_gate", "geometry.africantrees_fence_gate"],
  [doorBlock, "door", "geometry.africantrees_door"],
  [trapdoorBlock, "trapdoor", "geometry.africantrees_trapdoor"],
];

test("shaped block templates reference the correct identifier and shared geometry", () => {
  for (const [fn, suffix, geoId] of cases) {
    const block = fn(species)["minecraft:block"];
    assert.equal(block.description.identifier, `africantrees:baobab_${suffix}`);
    assert.equal(block.components["minecraft:geometry"], geoId);
  }
});

test("pressure plate and button are correctly identified", () => {
  assert.equal(pressurePlateBlock(species)["minecraft:block"].description.identifier, "africantrees:baobab_pressure_plate");
  assert.equal(buttonBlock(species)["minecraft:block"].description.identifier, "africantrees:baobab_button");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tools/test/block-templates-shaped.test.mjs`
Expected: FAIL (`shaped.mjs` does not exist yet)

- [ ] **Step 3: Implement `tools/lib/block-templates/shaped.mjs`**

Each function returns a Bedrock block definition analogous to Task 5's, but with `minecraft:geometry` pointing at the relevant Task 4 identifier (for the 6 shapes that have one) or a built-in vanilla primitive for pressure_plate/button. Door/trapdoor/fence_gate additionally need their standard open/closed or hinge states — check exact Bedrock state/trait names against official docs; the test only pins identifier and geometry reference.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tools/test/block-templates-shaped.test.mjs`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add tools/lib/block-templates/shaped.mjs tools/test/block-templates-shaped.test.mjs
git commit -m "Add shaped block templates (stairs, slab, fence, door, trapdoor family)"
```

---

## Task 7: Sign, hanging sign, and sapling block templates

**Files:**
- Create: `tools/lib/block-templates/special.mjs`
- Test: `tools/test/block-templates-special.test.mjs`

**Interfaces:**
- Consumes: a `Species` object (Task 2); `geometry.africantrees_sign` / `geometry.africantrees_hanging_sign` (Task 4).
- Produces: `signBlock(species)`, `hangingSignBlock(species)`, `saplingBlock(species)` — each `(Species) => object`. Sapling's block has an int block state `africantrees:growth_stage` with exactly the 4 values `0, 1, 2, 3`, and a `minecraft:on_random_tick` component whose event name is `africantrees:grow_<species.id>`.

- [ ] **Step 1: Write the failing test**

```js
// tools/test/block-templates-special.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { signBlock, hangingSignBlock, saplingBlock } from "../lib/block-templates/special.mjs";

const species = { id: "baobab", displayName: "Baobab", barkColorHex: "#8B5A2B", plankColorHex: "#C9A66B", leafColorHex: "#4C7A3B" };

test("sign and hanging sign are correctly identified", () => {
  assert.equal(signBlock(species)["minecraft:block"].description.identifier, "africantrees:baobab_sign");
  assert.equal(hangingSignBlock(species)["minecraft:block"].description.identifier, "africantrees:baobab_hanging_sign");
});

test("sapling has 4 growth stages and a grow event wired to on_random_tick", () => {
  const block = saplingBlock(species)["minecraft:block"];
  assert.equal(block.description.identifier, "africantrees:baobab_sapling");
  const states = block.description.states["africantrees:growth_stage"];
  assert.deepEqual([...states].sort(), [0, 1, 2, 3]);
  const tick = block.components["minecraft:on_random_tick"];
  assert.equal(tick.event, "africantrees:grow_baobab");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tools/test/block-templates-special.test.mjs`
Expected: FAIL (`special.mjs` does not exist yet)

- [ ] **Step 3: Implement `tools/lib/block-templates/special.mjs`**

`signBlock`/`hangingSignBlock` follow the same shape as Task 6's shaped blocks, geometry from Task 4. `saplingBlock` defines the `africantrees:growth_stage` int state (`0`–`3`) and a `minecraft:on_random_tick` component firing event `africantrees:grow_<species.id>` with a modest probability per tick (exact chance is the implementer's call; vanilla-comparable is fine) — that event's handler (incrementing the stage, or at stage 3 placing the tree feature and removing the sapling) is wired in Task 8 alongside the tree feature it calls.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tools/test/block-templates-special.test.mjs`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add tools/lib/block-templates/special.mjs tools/test/block-templates-special.test.mjs
git commit -m "Add sign, hanging sign, and sapling block templates"
```

---

## Task 8: Tree feature, feature rule, and growth/bonemeal wiring

**Files:**
- Create: `tools/lib/feature-templates.mjs`
- Modify: `tools/lib/block-templates/special.mjs` (wire the sapling's grow event and a bonemeal interaction to reference the tree feature below — same file as Task 7, since the sapling block's event wiring and the feature it calls are one cohesive deliverable)
- Test: `tools/test/feature-templates.test.mjs`

**Interfaces:**
- Consumes: a `Species` object (Task 2); `BIOME_POOL` (Task 1).
- Produces: `treeFeature(species)` (identifier `africantrees:<species.id>_tree`) and `treeFeatureRule(species)` (identifier `africantrees:<species.id>_tree_rule`, places `africantrees:<species.id>_tree`, biome filter built from `BIOME_POOL`) — both `(Species) => object`.

- [ ] **Step 1: Write the failing test**

```js
// tools/test/feature-templates.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { treeFeature, treeFeatureRule } from "../lib/feature-templates.mjs";
import { BIOME_POOL } from "../lib/constants.mjs";

const species = { id: "baobab", displayName: "Baobab", barkColorHex: "#8B5A2B", plankColorHex: "#C9A66B", leafColorHex: "#4C7A3B" };

test("tree feature and its rule are correctly identified and linked", () => {
  const feature = treeFeature(species);
  assert.equal(feature["minecraft:feature"]?.description?.identifier ?? feature.description.identifier, "africantrees:baobab_tree");

  const rule = treeFeatureRule(species);
  const ruleDef = rule["minecraft:feature_rules"];
  assert.equal(ruleDef.description.identifier, "africantrees:baobab_tree_rule");
  assert.equal(ruleDef.description.places_feature, "africantrees:baobab_tree");
  const biomeJson = JSON.stringify(ruleDef.distribution.biome_filter);
  for (const biome of BIOME_POOL) assert.ok(biomeJson.includes(biome), `missing biome ${biome}`);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tools/test/feature-templates.test.mjs`
Expected: FAIL (`feature-templates.mjs` does not exist yet)

- [ ] **Step 3: Implement `tools/lib/feature-templates.mjs`**

`treeFeature` returns a `minecraft:tree_feature` definition (trunk block `africantrees:<id>_log`, canopy using `africantrees:<id>_wood`-or-leaf-block as appropriate — check the current Bedrock tree_feature schema's exact trunk/canopy key names against official docs, since this plan pins identifiers and the biome linkage, not the full trunk/canopy schema). `treeFeatureRule` returns a `minecraft:feature_rules` definition whose `distribution.biome_filter` includes every entry in `BIOME_POOL` (via whatever the current schema's biome-tag-match predicate is) and whose `places_feature` is the matching tree feature's identifier.

- [ ] **Step 4: Update the sapling's grow event in `tools/lib/block-templates/special.mjs`**

The `africantrees:grow_<id>` event from Task 7 should, at `growth_stage` 3, run a command/event sequence that places `africantrees:<id>_tree` at the sapling's location and removes the sapling block — and bone meal used on the sapling should trigger the same placement immediately rather than waiting for the next random tick. Exact Bedrock event/command syntax for "place this feature here" is implementer knowledge, checked against official docs; this step only requires that the event name and target feature identifier match Task 8's `treeFeature` output.

- [ ] **Step 5: Run test to verify it passes**

Run: `node --test tools/test/feature-templates.test.mjs`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add tools/lib/feature-templates.mjs tools/lib/block-templates/special.mjs tools/test/feature-templates.test.mjs
git commit -m "Add tree feature/feature_rule and wire sapling growth to it"
```

---

## Task 9: Boat item and entity (behavior + client)

**Files:**
- Create: `tools/lib/item-templates.mjs`
- Create: `tools/lib/entity-templates.mjs`
- Test: `tools/test/boat-templates.test.mjs`

**Interfaces:**
- Consumes: a `Species` object (Task 2); `geometry.africantrees_boat` (Task 4).
- Produces: `boatItem(species)` (identifier `africantrees:<id>_boat`), `boatServerEntity(species)` (identifier `africantrees:<id>_boat`), `boatClientEntity(species)` (same identifier, references `geometry.africantrees_boat` and a per-species texture short name `<id>_boat`) — all `(Species) => object`.

- [ ] **Step 1: Write the failing test**

```js
// tools/test/boat-templates.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { boatItem } from "../lib/item-templates.mjs";
import { boatServerEntity, boatClientEntity } from "../lib/entity-templates.mjs";

const species = { id: "baobab", displayName: "Baobab", barkColorHex: "#8B5A2B", plankColorHex: "#C9A66B", leafColorHex: "#4C7A3B" };

test("boat item and entity are correctly identified and linked to shared geometry", () => {
  assert.equal(boatItem(species)["minecraft:item"].description.identifier, "africantrees:baobab_boat");
  assert.equal(boatServerEntity(species)["minecraft:entity"].description.identifier, "africantrees:baobab_boat");

  const client = boatClientEntity(species)["minecraft:client_entity"];
  assert.equal(client.description.identifier, "africantrees:baobab_boat");
  assert.equal(client.description.geometry.default, "geometry.africantrees_boat");
  assert.equal(client.description.textures.default, "textures/entity/baobab_boat");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tools/test/boat-templates.test.mjs`
Expected: FAIL (modules don't exist yet)

- [ ] **Step 3: Implement `tools/lib/item-templates.mjs` and `tools/lib/entity-templates.mjs`**

`boatItem` is a standard Bedrock item definition with a `minecraft:icon` component referencing `<id>_boat` and (checked against official docs) whatever component spawns the boat entity on water-right-click in the current schema. `boatServerEntity` reuses vanilla's boat movement/buoyancy component under the new identifier. `boatClientEntity` is a `minecraft:client_entity` definition with `description.geometry.default` set to the Task 4 geometry identifier and `description.textures.default` set to `textures/entity/<id>_boat`.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tools/test/boat-templates.test.mjs`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add tools/lib/item-templates.mjs tools/lib/entity-templates.mjs tools/test/boat-templates.test.mjs
git commit -m "Add boat item and entity templates"
```

---

## Task 10: Recipes and loot tables

**Files:**
- Create: `tools/lib/recipe-templates.mjs`
- Create: `tools/lib/loot-table-templates.mjs`
- Test: `tools/test/recipe-and-loot.test.mjs`

**Interfaces:**
- Consumes: a `Species` object (Task 2).
- Produces: from `recipe-templates.mjs`: `planksRecipe`, `stairsRecipe`, `slabRecipe`, `fenceRecipe`, `fenceGateRecipe`, `doorRecipe`, `trapdoorRecipe`, `pressurePlateRecipe`, `buttonRecipe`, `signRecipe`, `hangingSignRecipe`, `boatRecipe` — each `(Species) => object` whose `result.item` (or equivalent per recipe type) is `africantrees:<id>_<suffix>`. From `loot-table-templates.mjs`: `logLootTable(species)` returning a loot table that always drops `africantrees:<id>_log` and drops `africantrees:<id>_sapling` with probability `0.05`.

- [ ] **Step 1: Write the failing test**

```js
// tools/test/recipe-and-loot.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import * as recipes from "../lib/recipe-templates.mjs";
import { logLootTable } from "../lib/loot-table-templates.mjs";

const species = { id: "baobab", displayName: "Baobab", barkColorHex: "#8B5A2B", plankColorHex: "#C9A66B", leafColorHex: "#4C7A3B" };

const expected = {
  planksRecipe: "baobab_planks", stairsRecipe: "baobab_stairs", slabRecipe: "baobab_slab",
  fenceRecipe: "baobab_fence", fenceGateRecipe: "baobab_fence_gate", doorRecipe: "baobab_door",
  trapdoorRecipe: "baobab_trapdoor", pressurePlateRecipe: "baobab_pressure_plate",
  buttonRecipe: "baobab_button", signRecipe: "baobab_sign", hangingSignRecipe: "baobab_hanging_sign",
  boatRecipe: "baobab_boat",
};

test("every recipe produces the correct result item", () => {
  for (const [fnName, suffix] of Object.entries(expected)) {
    const recipe = recipes[fnName](species);
    const resultId = recipe["minecraft:recipe_shaped"]?.result?.item ?? recipe["minecraft:recipe_shapeless"]?.result?.item;
    assert.equal(resultId, `africantrees:${suffix}`);
  }
});

test("log loot table always drops the log and sometimes a sapling at 5%", () => {
  const table = logLootTable(species);
  const entries = table.pools.flatMap(p => p.entries);
  const log = entries.find(e => e.name === "africantrees:baobab_log");
  const sapling = entries.find(e => e.name === "africantrees:baobab_sapling");
  assert.ok(log);
  assert.ok(sapling);
  const saplingPool = table.pools.find(p => p.entries.includes(sapling));
  assert.equal(saplingPool.rolls, 1);
  const chanceFn = sapling.functions?.find(f => f.function === "random_chance" || f.function === "minecraft:random_chance");
  assert.equal(chanceFn.chance ?? chanceFn.probability, 0.05);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tools/test/recipe-and-loot.test.mjs`
Expected: FAIL (modules don't exist yet)

- [ ] **Step 3: Implement `tools/lib/recipe-templates.mjs` and `tools/lib/loot-table-templates.mjs`**

Each recipe function returns a standard Bedrock `minecraft:recipe_shaped` (or `recipe_shapeless` where no grid pattern matters, e.g. planks from logs) with ingredients drawn from the species' own planks/logs/sticks ids and vanilla sticks/chains where vanilla recipes use them (check exact vanilla recipe patterns — e.g. door is 6 planks in a 2x3 pattern, sign is 6 planks + 1 stick, boat is 5 planks — against official docs; this plan pins only the result item). `logLootTable` always includes the log entry and a sapling entry gated at `0.05` via a `random_chance` loot function, following the same two-pool-or-one-pool-with-function structure vanilla oak log loot tables use.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tools/test/recipe-and-loot.test.mjs`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add tools/lib/recipe-templates.mjs tools/lib/loot-table-templates.mjs tools/test/recipe-and-loot.test.mjs
git commit -m "Add crafting recipes and log loot tables"
```

---

## Task 11: Generator orchestrator, validator, and packaging

**Files:**
- Create: `tools/generate-pack.mjs`
- Create: `tools/validate-pack.mjs`
- Create: `tools/package-addon.mjs`
- Test: `tools/test/generate-and-validate.test.mjs`

**Interfaces:**
- Consumes: every template function from Tasks 3–10, `loadTreeData` (Task 2).
- Produces: all generated files on disk under `behavior_pack/` and `resource_pack/` (paths below); `validate-pack.mjs` exits 0 on a sound pack and non-zero (printing the specific problem) otherwise; `package-addon.mjs` writes `dist/african-trees.mcaddon`.

Exact generated-output paths (per species `id`, per block/item suffix `suffix`):
- `behavior_pack/blocks/<id>_<suffix>.json` for all 16 block families
- `behavior_pack/items/<id>_boat.json`
- `behavior_pack/entities/<id>_boat.json`
- `behavior_pack/recipes/<id>_<suffix>.json` for all 12 recipe families
- `behavior_pack/loot_tables/blocks/<id>_log.json`
- `behavior_pack/features/<id>_tree.json`
- `behavior_pack/feature_rules/<id>_tree_rule.json`
- `resource_pack/entity/<id>_boat.json`
- `resource_pack/textures/blocks/<id>_bark.png`, `<id>_bark_top.png`, `<id>_planks.png`, `<id>_leaves.png`
- `resource_pack/textures/entity/<id>_boat.png`
- `resource_pack/terrain_texture.json` and `resource_pack/texts/en_US.lang` are single merged files (not per-species), aggregating every species' texture short names and display-name translation keys respectively.

- [ ] **Step 1: Write the failing integration test**

```js
// tools/test/generate-and-validate.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync, writeFileSync, copyFileSync } from "node:fs";

test("generator produces the expected file counts and validator passes", () => {
  execFileSync("node", ["tools/generate-pack.mjs"]);
  execFileSync("node", ["tools/validate-pack.mjs"]);
  const blockFiles = readdirSync("behavior_pack/blocks");
  assert.equal(blockFiles.length, 160); // 16 families x 10 species
  const boatItems = readdirSync("behavior_pack/items");
  assert.equal(boatItems.length, 10);
});

test("generator is idempotent across two runs", () => {
  execFileSync("node", ["tools/generate-pack.mjs"]);
  const before = readFileSync("behavior_pack/blocks/baobab_log.json");
  execFileSync("node", ["tools/generate-pack.mjs"]);
  const after = readFileSync("behavior_pack/blocks/baobab_log.json");
  assert.ok(before.equals(after));
});

test("validator catches a deliberately broken cross-reference", () => {
  execFileSync("node", ["tools/generate-pack.mjs"]);
  const path = "behavior_pack/recipes/baobab_door.json";
  const original = readFileSync(path, "utf8");
  writeFileSync(path, original.replace("africantrees:baobab_door", "africantrees:baobab_doorrr"));
  assert.throws(() => execFileSync("node", ["tools/validate-pack.mjs"]));
  writeFileSync(path, original); // restore
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tools/test/generate-and-validate.test.mjs`
Expected: FAIL (`generate-pack.mjs` does not exist yet)

- [ ] **Step 3: Implement `tools/generate-pack.mjs`**

Load species via `loadTreeData()`. For each species, call every template function from Tasks 5–10 and write each result as pretty-printed JSON (`JSON.stringify(obj, null, 2)`) to its path above; call Task 3's texture functions for each species' 5 textures and write the PNG buffers to their paths above. Merge all species' terrain texture entries into one `resource_pack/terrain_texture.json` write, and all display-name lang lines into one `resource_pack/texts/en_US.lang` write. Deterministic: no random values, no timestamps, in the output (re-running produces byte-identical files).

- [ ] **Step 4: Implement `tools/validate-pack.mjs`**

Walk every `.json` file under `behavior_pack/` and `resource_pack/`, parsing each (fail loudly naming the file on a parse error). Load `behavior_pack/manifest.json` and `resource_pack/manifest.json`, confirming `min_engine_version` matches and UUIDs are distinct (same checks as Task 1's test, re-run here as a standing validator rather than a one-off test). Collect every block/item/entity identifier the generator produced, then scan every recipe and loot table file's referenced ids, failing loudly (naming the file and the missing id) if any reference doesn't resolve to a collected identifier. Exit code 0 on success, 1 and a printed reason on any failure.

- [ ] **Step 5: Implement `tools/package-addon.mjs`**

Shell out to the system `zip` CLI (available in this environment; confirm with `which zip` before relying on it) via `execFileSync`, zipping `behavior_pack/` and `resource_pack/` contents (not the folders themselves — per the `minecraft-bedrock-addon-dev` skill's packaging note, pack contents go at the archive root) into two intermediate `.mcpack`-shaped payloads, then combine both into `dist/african-trees.mcaddon`. Create `dist/` if missing.

- [ ] **Step 6: Run test to verify it passes**

Run: `node --test tools/test/generate-and-validate.test.mjs`
Expected: PASS

- [ ] **Step 7: Run the full test suite**

Run: `node --test tools/test/`
Expected: PASS (every test file from Tasks 1–11)

- [ ] **Step 8: Generate, validate, and package the real pack**

Run: `npm run generate && npm run validate && npm run package`
Expected: all three succeed; `dist/african-trees.mcaddon` exists and is non-empty.

- [ ] **Step 9: Commit**

```bash
git add tools/generate-pack.mjs tools/validate-pack.mjs tools/package-addon.mjs tools/test/generate-and-validate.test.mjs behavior_pack resource_pack .gitignore
git commit -m "Add generator orchestrator, validator, and packaging; generate the full pack"
```

Note: `dist/` (the packaged `.mcaddon`) should be gitignored — it's a build artifact of committed source, unlike `behavior_pack/`/`resource_pack/` which are the generator's committed output.

---

## Final note on verification

No Minecraft client exists in this environment. Every task above verifies structural correctness (valid JSON, correct identifiers, resolvable cross-references, deterministic generation) — not in-game behavior (tree silhouettes, growth timing, boat floating, crafting table UI). Loading `dist/african-trees.mcaddon` in an actual Bedrock 1.26.52 client and confirming those is the user's final step, not something this plan can close out.
