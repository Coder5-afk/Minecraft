import { test } from "node:test";
import assert from "node:assert/strict";
import { signBlock, hangingSignBlock, saplingBlock } from "../lib/block-templates/special.mjs";

const species = { id: "baobab", displayName: "Baobab", barkColorHex: "#8B5A2B", plankColorHex: "#C9A66B", leafColorHex: "#4C7A3B" };

test("sign and hanging sign are correctly identified", () => {
  assert.equal(signBlock(species)["minecraft:block"].description.identifier, "africantrees:baobab_sign");
  assert.equal(hangingSignBlock(species)["minecraft:block"].description.identifier, "africantrees:baobab_hanging_sign");
});

test("sapling has 4 growth stages and a grow event wired to on_random_tick", () => {
  const block = saplingBlock(species)["minecraft:block"];
  assert.equal(block.description.identifier, "africantrees:baobab_sapling");
  const states = block.description.states["africantrees:growth_stage"];
  assert.deepEqual([...states].sort(), [0, 1, 2, 3]);
  const tick = block.components["minecraft:on_random_tick"];
  assert.equal(tick.event, "africantrees:grow_baobab");
});
