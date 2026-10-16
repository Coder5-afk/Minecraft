import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("both manifests are valid and distinct", () => {
  const bp = JSON.parse(readFileSync("behavior_pack/manifest.json", "utf8"));
  const rp = JSON.parse(readFileSync("resource_pack/manifest.json", "utf8"));
  assert.deepEqual(bp.header.min_engine_version, [1, 26, 52]);
  assert.deepEqual(rp.header.min_engine_version, [1, 26, 52]);
  assert.notEqual(bp.header.uuid, rp.header.uuid);
  assert.notEqual(bp.modules[0].uuid, rp.modules[0].uuid);
  assert.notEqual(bp.header.uuid, bp.modules[0].uuid);
});
