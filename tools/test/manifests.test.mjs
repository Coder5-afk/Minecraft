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

// Review finding C3 (final review of 2026-10-16-african-trees-addon):
// sapling growth/bonemeal and door/trapdoor/fence-gate interaction relied
// on minecraft:on_random_tick / block "events", which were removed from
// Bedrock's block format (confirmed via wiki.bedrock.dev's block-ticking
// page: minecraft:random_ticking was removed in format 1.20.80). The
// modern replacement is a Script API custom block component, which needs
// a script module + @minecraft/server dependency in the manifest.
test("behavior pack declares a script module and the @minecraft/server dependency", () => {
  const bp = JSON.parse(readFileSync("behavior_pack/manifest.json", "utf8"));
  const scriptModule = bp.modules.find((m) => m.type === "script");
  assert.ok(scriptModule, "no script module declared");
  assert.equal(scriptModule.language, "javascript");
  assert.equal(scriptModule.entry, "scripts/main.js");
  const dep = bp.dependencies?.find((d) => d.module_name === "@minecraft/server");
  assert.ok(dep, "no @minecraft/server dependency declared");
});
