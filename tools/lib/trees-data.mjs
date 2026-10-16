import { readFileSync } from "node:fs";

const REQUIRED_FIELDS = [
  "id",
  "displayName",
  "barkColorHex",
  "plankColorHex",
  "leafColorHex",
  "trunkHeightBase",
  "canopyRadius",
];

const VANILLA_WOOD_IDS = ["oak", "spruce", "birch", "jungle", "acacia", "dark_oak", "mangrove", "cherry", "bamboo", "crimson", "warped"];
const VANILLA_WOOD_NAMES = ["Oak", "Spruce", "Birch", "Jungle", "Acacia", "Dark Oak", "Mangrove", "Cherry", "Bamboo", "Crimson", "Warped"];

const ID_PATTERN = /^[a-z][a-z0-9_]*$/;

export function loadTreeData(path = "data/trees.json") {
  const species = JSON.parse(readFileSync(path, "utf8"));
  const seenIds = new Set();

  species.forEach((entry, index) => {
    const label = entry.id ?? `index ${index}`;

    for (const field of REQUIRED_FIELDS) {
      if (entry[field] === undefined || entry[field] === null || entry[field] === "") {
        throw new Error(`Species entry ${label} is missing required field "${field}"`);
      }
    }

    if (!ID_PATTERN.test(entry.id)) {
      throw new Error(`Species id "${entry.id}" must be lowercase snake_case (matching ${ID_PATTERN})`);
    }

    if (seenIds.has(entry.id)) {
      throw new Error(`Duplicate species id "${entry.id}"`);
    }
    seenIds.add(entry.id);

    if (VANILLA_WOOD_IDS.includes(entry.id)) {
      throw new Error(`Species id "${entry.id}" collides with a vanilla wood type`);
    }

    if (VANILLA_WOOD_NAMES.includes(entry.displayName)) {
      throw new Error(`Species displayName "${entry.displayName}" collides with a vanilla wood type name`);
    }
  });

  return species;
}
