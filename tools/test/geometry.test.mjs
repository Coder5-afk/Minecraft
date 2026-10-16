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
