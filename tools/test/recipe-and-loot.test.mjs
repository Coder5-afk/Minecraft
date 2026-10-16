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
  // Review finding I5 (final review): wood/stripped_wood had no recipe at all.
  woodRecipe: "baobab_wood", strippedWoodRecipe: "stripped_baobab_wood",
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
