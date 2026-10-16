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

// Review finding I4 (final review): door/trapdoor/fence_gate fired
// "africantrees:toggle_open" via minecraft:on_interact, but that event was
// never defined anywhere (and minecraft:on_interact/events don't exist in
// Bedrock's current block format regardless -- see special.mjs). Replaced
// with the africantrees:toggleable Script API custom component.
test("door, trapdoor, and fence gate use the toggleable custom component, not a dangling event", () => {
  for (const fn of [doorBlock, trapdoorBlock, fenceGateBlock]) {
    const block = fn(species)["minecraft:block"];
    assert.ok(block.components["minecraft:custom_components"].includes("africantrees:toggleable"));
    assert.equal(block.components["minecraft:on_interact"], undefined);
    assert.deepEqual(block.description.states["africantrees:open"], [false, true]);
  }
});
