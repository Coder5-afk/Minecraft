import { test } from "node:test";
import assert from "node:assert/strict";
import { signBlock, hangingSignBlock, saplingBlock } from "../lib/block-templates/special.mjs";

const species = { id: "baobab", displayName: "Baobab", barkColorHex: "#8B5A2B", plankColorHex: "#C9A66B", leafColorHex: "#4C7A3B" };

test("sign and hanging sign are correctly identified", () => {
  assert.equal(signBlock(species)["minecraft:block"].description.identifier, "africantrees:baobab_sign");
  assert.equal(hangingSignBlock(species)["minecraft:block"].description.identifier, "africantrees:baobab_hanging_sign");
});

// Review finding C3 (final review): minecraft:on_random_tick was removed
// from Bedrock's block format (format 1.20.80) -- growth now goes through
// the africantrees:sapling_growth Script API custom component instead
// (behavior_pack/scripts/main.js), which derives the species id from the
// block's own type id rather than needing one hardcoded event per species.
test("sapling has 4 growth stages and uses the sapling_growth custom component", () => {
  const block = saplingBlock(species)["minecraft:block"];
  assert.equal(block.description.identifier, "africantrees:baobab_sapling");
  const states = block.description.states["africantrees:growth_stage"];
  assert.deepEqual([...states].sort(), [0, 1, 2, 3]);
  assert.ok(block.components["minecraft:custom_components"].includes("africantrees:sapling_growth"));
  assert.equal(block.components["minecraft:on_random_tick"], undefined);
});
