# African Trees Add-on — Design Spec

Date: 2026-10-16
Target: Minecraft Bedrock Edition 1.26.52
Status: Approved for planning

## Purpose

Add ~10 African tree species to the world, each naturally generated like a
vanilla wood type, each fully craftable into the same family of wood
products vanilla woods support (planks through boats). The goal is
content parity with vanilla wood types, not a new gameplay mechanic.

## Scope

**In scope:**
- 10 tree species, each with natural world generation, a full
  vanilla-parity block/item set, saplings, and a boat.
- A data-driven generator script that produces the add-on's JSON/texture
  files from one source-of-truth table, instead of hand-authored
  duplication across 10 species.
- A validation script that checks the generated pack for structural
  correctness (valid JSON, matching UUIDs/versions, resolvable
  cross-references).

**Out of scope (not building now):**
- Hand-painted or AI-generated artwork — textures are placeholder,
  programmatically generated, palette-differentiated per species.
- In-game visual/behavioral verification — no Minecraft client is
  available in this environment; see Testing.
- Per-species unique tree silhouettes beyond what Bedrock's built-in
  tree-feature primitives (trunk height, canopy type/radius) support.
  No custom `.mcstructure` prefabs.
- Crossplay/server admin concerns — this is a client-side content
  add-on only.

## Species

| id | display name | notes |
|---|---|---|
| `baobab` | Baobab | short thick trunk, very wide canopy |
| `acacia_umbrella` | Acacia | flat, wide umbrella canopy. Named distinctly from vanilla's built-in Acacia wood type to avoid confusion — vanilla already ships `minecraft:acacia_*`, so this is a related but separate wood family under the `africantrees` namespace |
| `african_mahogany` | African Mahogany | tall trunk, dense canopy |
| `african_blackwood` | African Blackwood (Ebony) | dark bark/planks, medium trunk |
| `iroko` | Iroko | tall trunk, broad canopy |
| `sapele` | Sapele | tall trunk, narrower canopy |
| `marula` | Marula | medium trunk, rounded canopy |
| `jackalberry` | Jackalberry | medium trunk, dense rounded canopy |
| `mopane` | Mopane | short-medium trunk, butterfly-shaped (approximated) canopy |
| `shea` | Shea | medium trunk, rounded canopy |

Each id is a snake_case species key used throughout identifiers, e.g.
`africantrees:baobab_log`, `africantrees:shea_boat`.

## Namespace & identity

- Namespace: `africantrees`
- Pack name: "African Trees"
- Behavior pack + resource pack as a paired `.mcaddon`
- `min_engine_version`: `[1, 26, 52]`
- Script API module (if any script is needed for boat render-controller
  wiring) pinned to the latest stable `@minecraft/server` release
  compatible with 1.26.x — exact version confirmed during implementation
  against the installed `minecraft-bedrock-addon-dev` skill reference,
  not asserted here.

## Per-species product set (full vanilla parity)

For each of the 10 species, generate:

Blocks: log, stripped log, wood (bark on all sides), stripped wood,
planks, stairs, slab, fence, fence gate, door, trapdoor, pressure plate,
button, sign (standing + wall), hanging sign, sapling.

Items: boat.

That's 16 block/item families × 10 species = 160 generated
definitions, plus associated recipes, loot tables, and textures per
family — on the order of 300+ generated files total across both packs.
This file count is the reason for the generator approach below rather
than hand authoring.

## World generation

- Mechanism: Bedrock's native data-driven `minecraft:tree_feature` +
  `feature_rule` (the same system vanilla uses for oak/spruce/acacia),
  not Script API. Script API cannot hook chunk generation; using it to
  place trees post-generation would be slow and desync-prone.
- Biome placement: all 10 species share one broad biome pool rather than
  per-species biome locks — `plains`, `sunflower_plains`, `forest`,
  `birch_forest`, `savanna`, `savanna_plateau`, `windswept_savanna`.
  Each species gets a modest, independent placement density so they
  read as a sprinkled addition, not a replacement for vanilla trees.
- Shape differentiation per species comes from varying trunk
  height range and canopy type/radius using Bedrock's built-in canopy
  generator options (exact enum values confirmed during implementation).

## Sapling & growth

- Breaking a tree drops its logs plus a small chance of its sapling
  (vanilla-style drop rate).
- A planted sapling ages via random tick through growth stages, then
  places the same tree feature used for world generation at its
  location, consuming the sapling.
- Bone meal used on a sapling forces that same placement immediately
  (high success chance per use, matching vanilla bonemeal-on-sapling
  behavior) instead of waiting for random tick.

## Crafting

Each species' planks craft from its own logs/wood at the vanilla 1:4
ratio. From planks, the same vanilla-shaped recipes produce stairs,
slabs, fences, fence gates, doors, trapdoors, pressure plates, buttons,
signs, hanging signs (sticks/chains as vanilla requires), and boats —
all auto-generated per species from one recipe template per product
type, parameterized by species planks/stick ids.

## Architecture: generator over hand authoring

- `data/trees.json` — the source-of-truth table: one entry per species
  with its id, display name, bark/leaf/plank color palette, and any
  per-species overrides (e.g. mopane's distinct canopy shape).
- `tools/generate-pack.mjs` — a Node script (using the `bedrock-protocol`-free
  parts of the existing `package.json` tooling) that reads the table and
  a fixed set of JSON templates (one per block/item/feature/recipe type,
  shared across all 10 species) and writes the stamped-out files into
  `behavior_pack/` and `resource_pack/`.
- `tools/templates/` — the template set; each template has species-keyed
  placeholders filled from `data/trees.json`.
- Generated output (`behavior_pack/`, `resource_pack/`) is committed to
  the repo alongside the generator, since that's what Minecraft actually
  loads — the generator is dev tooling to keep 10 species consistent,
  not a build step players run.
- Adding an 11th species later: add one row to `data/trees.json`, rerun
  the generator, commit the diff.

## Textures

Placeholder, programmatically generated (not hand-painted, not
AI-generated) — one small script produces 16×16 bark/plank/leaf PNGs per
species from its palette in `data/trees.json`, distinguishable
species-to-species but not detailed artwork. Swapping in real art later
only touches `resource_pack/textures/`; no other part of the add-on
changes.

## Validation (see Testing)

A Node check script (`tools/validate-pack.mjs`) that:
- Parses every generated JSON file and confirms it's valid JSON.
- Confirms behavior pack and resource pack manifests share matching
  `min_engine_version` and have distinct, valid UUIDs per module.
- Confirms every recipe/loot-table reference resolves to a block/item id
  that exists in the generated set (catches typos/missing species
  entries).
- Confirms exactly 160 block/item definitions and 10 boat entities were
  generated (count check against the species table).

## Testing

No Minecraft client is available in this sandbox, so in-game
verification (tree silhouettes look right, growth timing feels right,
boats render and float correctly, crafting works at the table) cannot be
done here and is **not** claimed as verified by this work. What *is*
verified here: the generator runs cleanly, produces the expected file
count and structure, every file is valid JSON, and cross-references
resolve — i.e., the pack is structurally sound and should load without
errors, but gameplay feel is unverified until loaded in-game.

## Open considerations (non-blocking)

- "Acacia" already exists as a vanilla Bedrock wood type tied to the
  savanna biome; this add-on's `acacia_umbrella` is a distinct,
  separately-namespaced species, not a replacement — flagged here for
  visibility, not a blocker, since the user approved the species list
  with this name.
- Exact Bedrock canopy-generator enum values and boat render-controller
  mechanics will be confirmed against the `minecraft-bedrock-addon-dev`
  and `minecraft-world-generation` skill references during
  implementation planning, rather than asserted precisely in this spec.
