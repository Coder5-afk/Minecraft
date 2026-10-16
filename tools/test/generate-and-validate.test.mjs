import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync, writeFileSync, copyFileSync } from "node:fs";

test("generator produces the expected file counts and validator passes", () => {
  execFileSync("node", ["tools/generate-pack.mjs"]);
  execFileSync("node", ["tools/validate-pack.mjs"]);
  const blockFiles = readdirSync("behavior_pack/blocks");
  assert.equal(blockFiles.length, 160); // 16 families x 10 species
  const boatItems = readdirSync("behavior_pack/items");
  assert.equal(boatItems.length, 10);
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
  // Ruling (ledgered, Task 11): the brief's plain
  // `.replace("africantrees:baobab_door", ...)` hits the FIRST occurrence
  // of that string in the file, which is `description.identifier` (the
  // recipe's own id, listed before `result` in the generated JSON) --
  // not the `result.item` cross-reference the test means to break.
  // Targeting the `"item": "..."` key makes the corruption land on the
  // actual reference.
  writeFileSync(path, original.replace('"item": "africantrees:baobab_door"', '"item": "africantrees:baobab_doorrr"'));
  assert.throws(() => execFileSync("node", ["tools/validate-pack.mjs"]));
  writeFileSync(path, original); // restore
});
