import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { MIN_ENGINE_VERSION } from "./constants.mjs";

const NAMESPACE = "africantrees";

export class ValidationError extends Error {}

export function walkJsonFiles(dir) {
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

export function parseAllJson(roots = ["behavior_pack", "resource_pack"]) {
  const parsed = new Map();
  for (const root of roots) {
    for (const path of walkJsonFiles(root)) {
      try {
        parsed.set(path, JSON.parse(readFileSync(path, "utf8")));
      } catch (err) {
        throw new ValidationError(`invalid JSON in ${path}: ${err.message}`);
      }
    }
  }
  return parsed;
}

export function checkManifests() {
  const bp = JSON.parse(readFileSync("behavior_pack/manifest.json", "utf8"));
  const rp = JSON.parse(readFileSync("resource_pack/manifest.json", "utf8"));
  if (JSON.stringify(bp.header.min_engine_version) !== JSON.stringify(MIN_ENGINE_VERSION)) {
    throw new ValidationError("behavior_pack/manifest.json min_engine_version mismatch");
  }
  if (JSON.stringify(rp.header.min_engine_version) !== JSON.stringify(MIN_ENGINE_VERSION)) {
    throw new ValidationError("resource_pack/manifest.json min_engine_version mismatch");
  }
  if (bp.header.uuid === rp.header.uuid) throw new ValidationError("behavior_pack and resource_pack header uuids must differ");
  if (bp.modules[0].uuid === rp.modules[0].uuid) throw new ValidationError("behavior_pack and resource_pack module uuids must differ");
  if (bp.header.uuid === bp.modules[0].uuid) throw new ValidationError("behavior_pack header and module uuids must differ");
}

function identifierOf(json) {
  for (const key of Object.keys(json)) {
    if (key === "format_version") continue;
    const section = json[key];
    if (section?.description?.identifier) return section.description.identifier;
  }
  return undefined;
}

// Review finding I3 (final review of 2026-10-16-african-trees-addon): this
// used to reconstruct expected identifiers from a hardcoded suffix list,
// which meant it checked recipes/loot tables against what *should* exist,
// not what the generator actually wrote -- a renamed/typo'd block
// identifier in a template would never be caught. This instead reads
// every generated file's own description.identifier, so the known set is
// always exactly what's on disk.
export function collectKnownIdentifiers(parsed) {
  const known = new Set();
  for (const [path, json] of parsed.entries()) {
    if (!path.startsWith("behavior_pack")) continue;
    const id = identifierOf(json);
    if (id) known.add(id);
  }
  return known;
}

function collectReferencedIds(obj, found) {
  if (Array.isArray(obj)) {
    for (const item of obj) collectReferencedIds(item, found);
  } else if (obj && typeof obj === "object") {
    for (const [key, value] of Object.entries(obj)) {
      // Review finding I3: "places_feature" and "entity"
      // (minecraft:entity_placer.entity) are references too, not just
      // "item"/"name" -- missing them is exactly how the reviewer's
      // typo'd-places_feature probe slipped through.
      if ((key === "item" || key === "name" || key === "places_feature" || key === "entity") &&
          typeof value === "string" && value.startsWith(`${NAMESPACE}:`)) {
        found.add(value);
      }
      collectReferencedIds(value, found);
    }
  }
}

export function checkCrossReferences(parsed) {
  const known = collectKnownIdentifiers(parsed);
  const referenceBearing = ["recipes", "loot_tables", "feature_rules", "items"].map((d) => join("behavior_pack", d));
  for (const [path, json] of parsed.entries()) {
    if (!referenceBearing.some((prefix) => path.startsWith(prefix))) continue;
    const referenced = new Set();
    collectReferencedIds(json, referenced);
    for (const id of referenced) {
      if (!known.has(id)) {
        throw new ValidationError(`${path} references unknown identifier "${id}"`);
      }
    }
  }
}

export function checkExpectedCounts(species, blockFamilyCount) {
  const blockFiles = readdirSync("behavior_pack/blocks");
  const expectedBlocks = species.length * blockFamilyCount;
  if (blockFiles.length !== expectedBlocks) {
    throw new ValidationError(`expected ${expectedBlocks} block files (${blockFamilyCount} families x ${species.length} species), found ${blockFiles.length}`);
  }
  const boatItems = readdirSync("behavior_pack/items");
  if (boatItems.length !== species.length) {
    throw new ValidationError(`expected ${species.length} boat item files, found ${boatItems.length}`);
  }
}
