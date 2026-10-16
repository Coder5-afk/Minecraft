import { test } from "node:test";
import assert from "node:assert/strict";
import { stairsBlock, slabBlock, fenceBlock, fenceGateBlock, doorBlock, trapdoorBlock, pressurePlateBlock, buttonBlock } from "../lib/block-templates/shaped.mjs";

const species = { id: "baobab", displayName: "Baobab", barkColorHex: "#8B5A2B", plankColorHex: "#C9A66B", leafColorHex: "#4C7A3B" };

const cases = [
  [stairsBlock, "stairs", "geometry.africantrees_stairs"],
  [slabBlock, "slab", "geometry.africantrees_slab"],
  [fenceBlock, "fence", "geometry.africantrees_fence"],
  [fenceGateBlock, "fence_gate", "geometry.africantrees_fence_gate"],
  [doorBlock, "door", "geometry.africantrees_door"],
  [trapdoorBlock, "trapdoor", "geometry.africantrees_trapdoor"],
];

test("shaped block templates reference the correct identifier and shared geometry", () => {
  for (const [fn, suffix, geoId] of cases) {
    const block = fn(species)["minecraft:block"];
    assert.equal(block.description.identifier, `africantrees:baobab_${suffix}`);
    assert.equal(block.components["minecraft:geometry"], geoId);
  }
});

test("pressure plate and button are correctly identified", () => {
  assert.equal(pressurePlateBlock(species)["minecraft:block"].description.identifier, "africantrees:baobab_pressure_plate");
  assert.equal(buttonBlock(species)["minecraft:block"].description.identifier, "africantrees:baobab_button");
});
