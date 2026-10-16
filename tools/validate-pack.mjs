import { loadTreeData } from "./lib/trees-data.mjs";
import { checkManifests, parseAllJson, checkCrossReferences, checkExpectedCounts, ValidationError } from "./lib/validate-pack-lib.mjs";

const BLOCK_FAMILY_COUNT = 17;

function main() {
  try {
    checkManifests();
    const species = loadTreeData();
    checkExpectedCounts(species, BLOCK_FAMILY_COUNT);
    const parsed = parseAllJson();
    checkCrossReferences(parsed);
    console.log(`validate-pack: OK (${parsed.size} JSON files checked)`);
  } catch (err) {
    if (err instanceof ValidationError) {
      console.error(`validate-pack: ${err.message}`);
      process.exit(1);
    }
    throw err;
  }
}

main();
