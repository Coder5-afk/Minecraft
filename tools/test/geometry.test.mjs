import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const SHAPES = ["door","trapdoor","stairs","slab","fence","fence_gate","sign","hanging_sign","boat"];

test("every shared shape geometry file is valid and correctly identified", () => {
  for (const shape of SHAPES) {
    const geo = JSON.parse(readFileSync(`resource_pack/models/blocks/${shape}.geo.json`, "utf8"));
    const def = geo["minecraft:geometry"][0];
    assert.equal(def.description.identifier, `geometry.africantrees_${shape}`);
    assert.ok(Array.isArray(def.bones) && def.bones.length > 0);
  }
});

// Review finding I4 (final review of 2026-10-16-african-trees-addon):
// custom block geometry is limited to 30px (1.875 blocks) in any
// dimension; door.geo.json's cube was 32px tall.
test("every cube in every geometry stays within the 30px custom-geometry limit", () => {
  for (const shape of SHAPES) {
    const geo = JSON.parse(readFileSync(`resource_pack/models/blocks/${shape}.geo.json`, "utf8"));
    for (const bone of geo["minecraft:geometry"][0].bones) {
      for (const cube of bone.cubes) {
        for (const dimension of cube.size) {
          assert.ok(dimension <= 30, `${shape}.geo.json has a cube dimension of ${dimension}px, over the 30px limit`);
        }
      }
    }
  }
});
