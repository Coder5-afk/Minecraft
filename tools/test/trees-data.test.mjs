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
