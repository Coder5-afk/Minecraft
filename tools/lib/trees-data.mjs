import { readFileSync } from "node:fs";

const REQUIRED_FIELDS = ["id", "displayName", "barkColorHex", "plankColorHex", "leafColorHex"];

export function loadTreeData(path = "data/trees.json") {
  const species = JSON.parse(readFileSync(path, "utf8"));
  species.forEach((entry, index) => {
    for (const field of REQUIRED_FIELDS) {
      if (!entry[field]) {
        const label = entry.id ?? `index ${index}`;
        throw new Error(`Species entry ${label} is missing required field "${field}"`);
      }
    }
  });
  return species;
}
