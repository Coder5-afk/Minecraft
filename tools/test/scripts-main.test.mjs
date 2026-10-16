import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

// Review finding C3 (final review): sapling growth, bonemeal, log/wood
// stripping and door/trapdoor/fence-gate interaction all previously relied
// on removed data-driven block events (minecraft:on_random_tick /
// "events" / minecraft:on_interact). This can't be executed in Node (it
// needs the real @minecraft/server runtime), so this test only proves the
// script registers the three custom components the block templates
// reference by name -- not that the in-game behavior is correct, which
// needs an actual client.
const script = readFileSync("behavior_pack/scripts/main.js", "utf8");

test("registers the sapling growth, strippable, and toggleable custom components", () => {
  assert.match(script, /registerCustomComponent\(\s*["']africantrees:sapling_growth["']/);
  assert.match(script, /registerCustomComponent\(\s*["']africantrees:strippable["']/);
  assert.match(script, /registerCustomComponent\(\s*["']africantrees:toggleable["']/);
});

test("sapling growth component defines onRandomTick and onPlayerInteract", () => {
  const match = script.match(/registerCustomComponent\(\s*["']africantrees:sapling_growth["'],\s*\{([\s\S]*?)\}\s*\)/);
  assert.ok(match, "sapling_growth component body not found");
  assert.match(match[1], /onRandomTick/);
  assert.match(match[1], /onPlayerInteract/);
});
