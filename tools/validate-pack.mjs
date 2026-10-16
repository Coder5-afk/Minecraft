import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { loadTreeData } from "./lib/trees-data.mjs";
import { MIN_ENGINE_VERSION } from "./lib/constants.mjs";

const NAMESPACE = "africantrees";

const BLOCK_SUFFIXES = [
  "log", "stripped_log", "wood", "stripped_wood", "planks",
  "stairs", "slab", "fence", "fence_gate", "door", "trapdoor",
  "pressure_plate", "button", "sign", "hanging_sign", "sapling",
];

const RECIPE_SUFFIXES = [
  "planks", "stairs", "slab", "fence", "fence_gate", "door", "trapdoor",
  "pressure_plate", "button", "sign", "hanging_sign", "boat",
];

function fail(message) {
  console.error(`validate-pack: ${message}`);
  process.exit(1);
}

function walkJsonFiles(dir) {
  const results = [];
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    const stat = statSync(path);
    if (stat.isDirectory()) {
      results.push(...walkJsonFiles(path));
    } else if (entry.endsWith(".json")) {
      results.push(path);
    }
  }
  return results;
}

function parseAllJson() {
  const parsed = new Map();
  for (const root of ["behavior_pack", "resource_pack"]) {
    for (const path of walkJsonFiles(root)) {
      try {
        parsed.set(path, JSON.parse(readFileSync(path, "utf8")));
      } catch (err) {
        fail(`invalid JSON in ${path}: ${err.message}`);
      }
    }
  }
  return parsed;
}

function checkManifests() {
  const bp = JSON.parse(readFileSync("behavior_pack/manifest.json", "utf8"));
  const rp = JSON.parse(readFileSync("resource_pack/manifest.json", "utf8"));
  if (JSON.stringify(bp.header.min_engine_version) !== JSON.stringify(MIN_ENGINE_VERSION)) {
    fail(`behavior_pack/manifest.json min_engine_version mismatch`);
  }
  if (JSON.stringify(rp.header.min_engine_version) !== JSON.stringify(MIN_ENGINE_VERSION)) {
    fail(`resource_pack/manifest.json min_engine_version mismatch`);
  }
  if (bp.header.uuid === rp.header.uuid) fail("behavior_pack and resource_pack header uuids must differ");
  if (bp.modules[0].uuid === rp.modules[0].uuid) fail("behavior_pack and resource_pack module uuids must differ");
  if (bp.header.uuid === bp.modules[0].uuid) fail("behavior_pack header and module uuids must differ");
}

function blockIdentifier(id, suffix) {
  // stripped_log/stripped_wood are prefixed (stripped_<id>_log), matching
  // vanilla's own naming (stripped_oak_log) -- every other suffix is
  // appended after the species id.
  if (suffix === "stripped_log") return `${NAMESPACE}:stripped_${id}_log`;
  if (suffix === "stripped_wood") return `${NAMESPACE}:stripped_${id}_wood`;
  return `${NAMESPACE}:${id}_${suffix}`;
}

function expectedIdentifiers(species) {
  const ids = new Set();
  for (const sp of species) {
    for (const suffix of BLOCK_SUFFIXES) ids.add(blockIdentifier(sp.id, suffix));
    ids.add(`${NAMESPACE}:${sp.id}_boat`);
  }
  return ids;
}

function collectReferencedIds(obj, found) {
  if (Array.isArray(obj)) {
    for (const item of obj) collectReferencedIds(item, found);
  } else if (obj && typeof obj === "object") {
    for (const [key, value] of Object.entries(obj)) {
      if ((key === "item" || key === "name") && typeof value === "string" && value.startsWith(`${NAMESPACE}:`)) {
        found.add(value);
      }
      collectReferencedIds(value, found);
    }
  }
}

function checkCrossReferences(parsed, species) {
  const known = expectedIdentifiers(species);
  for (const [path, json] of parsed.entries()) {
    if (!path.includes(`${join("behavior_pack", "recipes")}`) && !path.includes(`${join("behavior_pack", "loot_tables")}`)) {
      continue;
    }
    const referenced = new Set();
    collectReferencedIds(json, referenced);
    for (const id of referenced) {
      if (!known.has(id)) {
        fail(`${path} references unknown identifier "${id}"`);
      }
    }
  }
}

function main() {
  checkManifests();
  const species = loadTreeData();
  const parsed = parseAllJson();
  checkCrossReferences(parsed, species);
  console.log(`validate-pack: OK (${parsed.size} JSON files checked)`);
}

main();
