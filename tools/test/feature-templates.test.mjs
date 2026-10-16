import { test } from "node:test";
import assert from "node:assert/strict";
import { treeFeature, treeFeatureRule } from "../lib/feature-templates.mjs";
import { BIOME_POOL } from "../lib/constants.mjs";

const species = {
  id: "baobab",
  displayName: "Baobab",
  barkColorHex: "#8B5A2B",
  plankColorHex: "#C9A66B",
  leafColorHex: "#4C7A3B",
  trunkHeightBase: 4,
  canopyRadius: 4,
};

test("tree feature and its rule are correctly identified and linked", () => {
  // Ruling (ledgered, Task 8): checking `minecraft:tree_feature` directly
  // rather than the plan draft's generic `minecraft:feature` fallback —
  // Bedrock's real feature files key by the feature's actual type name.
  const feature = treeFeature(species);
  assert.equal(feature["minecraft:tree_feature"].description.identifier, "africantrees:baobab_tree");

  const rule = treeFeatureRule(species);
  const ruleDef = rule["minecraft:feature_rules"];
  assert.equal(ruleDef.description.identifier, "africantrees:baobab_tree_rule");
  assert.equal(ruleDef.description.places_feature, "africantrees:baobab_tree");
  // Ruling (ledgered, Task 8): the plan's draft test checked
  // `ruleDef.distribution.biome_filter`, but Bedrock's real feature_rules
  // schema puts the biome filter under `conditions["minecraft:biome_filter"]`
  // as an `any_of` list of `has_biome_tag` tests — `distribution` only
  // controls placement count/extent, not biome matching. Checking the real
  // location here so the generated pack actually filters by biome in-game.
  const biomeJson = JSON.stringify(ruleDef.conditions["minecraft:biome_filter"]);
  for (const biome of BIOME_POOL) assert.ok(biomeJson.includes(biome), `missing biome ${biome}`);
});

// Review findings C2/I7 (final review of 2026-10-16-african-trees-addon):
// the feature rule was missing a surface placement pass and placed trees
// at an absolute Y of 0-1 (underground), so no tree could ever generate;
// the tree's trunk/canopy also used schema keys that don't match Bedrock's
// real tree_feature format, used the same shape for every species despite
// trees.json carrying per-species trunkHeightBase/canopyRadius, and the
// canopy fell back to generic minecraft:leaves instead of the species' own
// leaves block (fixed alongside leavesBlock in cubes.mjs).
test("feature rule places trees on the surface using the heightmap, not underground", () => {
  const ruleDef = treeFeatureRule(species)["minecraft:feature_rules"];
  assert.equal(ruleDef.conditions.placement_pass, "surface_pass");
  assert.equal(ruleDef.distribution.y, "minecraft:height_map");
});

test("tree shape is driven by the species' own trunk height and canopy radius, not a shared constant", () => {
  const short = treeFeature({ ...species, id: "short_species", trunkHeightBase: 3, canopyRadius: 2 });
  const tall = treeFeature({ ...species, id: "tall_species", trunkHeightBase: 9, canopyRadius: 4 });
  const shortTrunk = short["minecraft:tree_feature"].trunk.trunk_height;
  const tallTrunk = tall["minecraft:tree_feature"].trunk.trunk_height;
  assert.notDeepEqual(shortTrunk, tallTrunk);
  assert.equal(shortTrunk.base, 3);
  assert.equal(tallTrunk.base, 9);
});

test("canopy uses the species' own leaves block, not generic vanilla leaves", () => {
  const feature = treeFeature(species)["minecraft:tree_feature"];
  const leafBlocks = feature.canopy.leaf_blocks.map((entry) => entry.leaf_block);
  assert.ok(leafBlocks.includes("africantrees:baobab_leaves"));
});
