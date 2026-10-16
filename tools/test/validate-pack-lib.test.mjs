import { test } from "node:test";
import assert from "node:assert/strict";
import { collectKnownIdentifiers, checkCrossReferences, ValidationError } from "../lib/validate-pack-lib.mjs";

function fakeParsed(entries) {
  return new Map(Object.entries(entries));
}

// Review finding I3 (final review of 2026-10-16-african-trees-addon):
// reproduces the reviewer's exact probe -- renaming a block's own
// identifier previously went uncaught because the validator reconstructed
// "known" identifiers from a suffix list instead of reading what the
// generator actually wrote.
test("a renamed block identifier makes a recipe that still points at the old name fail", () => {
  const parsed = fakeParsed({
    "behavior_pack/blocks/baobab_plank.json": { "minecraft:block": { description: { identifier: "africantrees:baobab_plank" } } },
    "behavior_pack/recipes/baobab_stairs.json": {
      "minecraft:recipe_shaped": { result: { item: "africantrees:baobab_stairs" }, key: { P: { item: "africantrees:baobab_planks" } } },
    },
  });
  assert.throws(() => checkCrossReferences(parsed), ValidationError);
});

// Reproduces the reviewer's second probe: a typo'd places_feature.
test("a typo'd places_feature reference fails", () => {
  const parsed = fakeParsed({
    "behavior_pack/features/baobab_tree.json": { "minecraft:tree_feature": { description: { identifier: "africantrees:baobab_tree" } } },
    "behavior_pack/feature_rules/baobab_tree_rule.json": {
      "minecraft:feature_rules": { description: { identifier: "africantrees:baobab_tree_rule", places_feature: "africantrees:baobab_treeee" } },
    },
  });
  assert.throws(() => checkCrossReferences(parsed), ValidationError);
});

test("collectKnownIdentifiers reads identifiers from behavior_pack files, ignoring resource_pack", () => {
  const parsed = fakeParsed({
    "behavior_pack/blocks/baobab_log.json": { "minecraft:block": { description: { identifier: "africantrees:baobab_log" } } },
    "resource_pack/entity/baobab_boat.json": { "minecraft:client_entity": { description: { identifier: "africantrees:baobab_boat" } } },
  });
  const known = collectKnownIdentifiers(parsed);
  assert.ok(known.has("africantrees:baobab_log"));
  assert.ok(!known.has("africantrees:baobab_boat"));
});
