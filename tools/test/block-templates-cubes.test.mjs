import { test } from "node:test";
import assert from "node:assert/strict";
import { logBlock, strippedLogBlock, woodBlock, strippedWoodBlock, planksBlock, leavesBlock } from "../lib/block-templates/cubes.mjs";

const species = { id: "baobab", displayName: "Baobab", barkColorHex: "#8B5A2B", plankColorHex: "#C9A66B", leafColorHex: "#4C7A3B" };

test("cube/column block templates produce correctly identified blocks", () => {
  assert.equal(logBlock(species)["minecraft:block"].description.identifier, "africantrees:baobab_log");
  assert.equal(strippedLogBlock(species)["minecraft:block"].description.identifier, "africantrees:stripped_baobab_log");
  assert.equal(woodBlock(species)["minecraft:block"].description.identifier, "africantrees:baobab_wood");
  assert.equal(strippedWoodBlock(species)["minecraft:block"].description.identifier, "africantrees:stripped_baobab_wood");
  assert.equal(planksBlock(species)["minecraft:block"].description.identifier, "africantrees:baobab_planks");
});

// Review finding C3/I7 (final review): no leaves block existed at all, so
// the tree feature's canopy fell back to vanilla minecraft:leaves and
// leafColorHex was dead data.
test("leavesBlock is correctly identified and uses the species' own leaf texture", () => {
  const block = leavesBlock(species)["minecraft:block"];
  assert.equal(block.description.identifier, "africantrees:baobab_leaves");
  assert.equal(block.components["minecraft:material_instances"]["*"].texture, "baobab_leaves");
});

// Review finding C3/I5 (final review): log/wood had no loot link and no
// way to become stripped_log/stripped_wood at all. The log/wood loot is
// now linked (checked in generate-and-validate.test.mjs, which needs real
// generated output); stripping goes through the shared
// africantrees:strippable Script API custom component.
test("log and wood use the strippable custom component; stripped variants do not", () => {
  assert.ok(logBlock(species)["minecraft:block"].components["minecraft:custom_components"].includes("africantrees:strippable"));
  assert.ok(woodBlock(species)["minecraft:block"].components["minecraft:custom_components"].includes("africantrees:strippable"));
  assert.equal(strippedLogBlock(species)["minecraft:block"].components["minecraft:custom_components"], undefined);
  assert.equal(strippedWoodBlock(species)["minecraft:block"].components["minecraft:custom_components"], undefined);
});
