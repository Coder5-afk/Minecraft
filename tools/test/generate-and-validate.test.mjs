import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { loadTreeData } from "../lib/trees-data.mjs";

const SPECIES_COUNT = loadTreeData().length;
const BLOCK_FAMILIES = 17; // Review finding I8: derive from data, not a hardcoded 160.

test("generator produces the expected file counts and validator passes", () => {
  execFileSync("node", ["tools/generate-pack.mjs"]);
  execFileSync("node", ["tools/validate-pack.mjs"]);
  const blockFiles = readdirSync("behavior_pack/blocks");
  assert.equal(blockFiles.length, BLOCK_FAMILIES * SPECIES_COUNT);
  const boatItems = readdirSync("behavior_pack/items");
  assert.equal(boatItems.length, SPECIES_COUNT);
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
  try {
    writeFileSync(path, original.replace('"item": "africantrees:baobab_door"', '"item": "africantrees:baobab_doorrr"'));
    assert.throws(() => execFileSync("node", ["tools/validate-pack.mjs"]));
  } finally {
    writeFileSync(path, original); // restore even if the assertion above fails
  }
});

// Review finding C1 (final review of 2026-10-16-african-trees-addon):
// terrain_texture.json was written to the resource pack root, where
// Bedrock never reads it -- the real location is resource_pack/textures/.
// There was also no item_texture.json, so item icons (the boats) had
// nowhere to resolve from.
test("terrain and item texture atlases are written where Bedrock actually reads them", () => {
  execFileSync("node", ["tools/generate-pack.mjs"]);
  assert.ok(existsSync("resource_pack/textures/terrain_texture.json"));
  assert.ok(!existsSync("resource_pack/terrain_texture.json"), "stale root-level copy should not exist");
  assert.ok(existsSync("resource_pack/textures/item_texture.json"));
  const itemTextures = JSON.parse(readFileSync("resource_pack/textures/item_texture.json", "utf8"));
  assert.ok(itemTextures.texture_data["baobab_boat"]);
});

// Review finding C3 (final review): the log loot table was never linked
// from the log block, so it would never fire in-game.
test("log block declares minecraft:loot pointing at its loot table", () => {
  execFileSync("node", ["tools/generate-pack.mjs"]);
  const log = JSON.parse(readFileSync("behavior_pack/blocks/baobab_log.json", "utf8"));
  assert.equal(log["minecraft:block"].components["minecraft:loot"], "loot_tables/blocks/baobab_log.json");
});
