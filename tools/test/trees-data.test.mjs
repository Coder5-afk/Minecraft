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

// Review finding I8 (final review of 2026-10-16-african-trees-addon):
// the vanilla-collision/format/uniqueness checks above only ran against
// already-good committed data in a test. The loader itself must enforce
// them, since that's what tools/generate-pack.mjs actually calls.
test("throws when an id collides with a vanilla wood type", () => {
  assert.throws(() => loadTreeData("tools/test/fixtures/trees-vanilla-id-collision.json"));
});

test("throws when a display name collides with a vanilla wood type name", () => {
  assert.throws(() => loadTreeData("tools/test/fixtures/trees-vanilla-name-collision.json"));
});

test("throws when two entries share the same id", () => {
  assert.throws(() => loadTreeData("tools/test/fixtures/trees-duplicate-id.json"));
});

test("throws when an id is not lowercase snake_case", () => {
  assert.throws(() => loadTreeData("tools/test/fixtures/trees-bad-id-format.json"));
});
