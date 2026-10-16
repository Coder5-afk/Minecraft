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
