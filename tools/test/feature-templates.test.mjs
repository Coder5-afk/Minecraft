import { test } from "node:test";
import assert from "node:assert/strict";
import { treeFeature, treeFeatureRule } from "../lib/feature-templates.mjs";
import { BIOME_POOL } from "../lib/constants.mjs";

const species = { id: "baobab", displayName: "Baobab", barkColorHex: "#8B5A2B", plankColorHex: "#C9A66B", leafColorHex: "#4C7A3B" };

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
