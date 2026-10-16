import { BIOME_POOL } from "./constants.mjs";

const NAMESPACE = "africantrees";

// Schema reconstructed from Microsoft Learn's tree_feature/feature_rules
// reference fragments and the bedrock.dev Features docs (exact field names
// could not be fetched directly in this sandbox -- see the implementation
// ledger's Task-11-fix-pass ruling). Verify trunk/canopy field names and
// `placement_pass`/`distribution.y` against the official Bedrock Creator
// docs or an in-game content-log error before shipping.
export function treeFeature(species) {
  const identifier = `${NAMESPACE}:${species.id}_tree`;
  return {
    format_version: "1.13.0",
    "minecraft:tree_feature": {
      description: { identifier },
      base_block: ["minecraft:dirt", "minecraft:grass"],
      may_grow_on: ["minecraft:dirt", "minecraft:grass"],
      may_replace: ["minecraft:air", `${NAMESPACE}:${species.id}_sapling`],
      trunk: {
        trunk_block: `${NAMESPACE}:${species.id}_log`,
        trunk_height: { base: species.trunkHeightBase, intervals: [2], min_height_for_canopy: 2 },
        trunk_width: 1,
      },
      canopy: {
        canopy_height: Math.max(2, Math.round(species.canopyRadius * 0.75)),
        canopy_radius: species.canopyRadius,
        leaf_blocks: [{ leaf_block: `${NAMESPACE}:${species.id}_leaves`, weight: 1 }],
      },
    },
  };
}

export function treeFeatureRule(species) {
  return {
    format_version: "1.13.0",
    "minecraft:feature_rules": {
      description: {
        identifier: `${NAMESPACE}:${species.id}_tree_rule`,
        places_feature: `${NAMESPACE}:${species.id}_tree`,
      },
      conditions: {
        placement_pass: "surface_pass",
        "minecraft:biome_filter": {
          any_of: BIOME_POOL.map((biome) => ({
            test: "has_biome_tag",
            operator: "==",
            value: biome,
          })),
        },
      },
      distribution: {
        iterations: 1,
        scatter_chance: "10%",
        x: { distribution: "uniform", extent: [0, 16] },
        y: "minecraft:height_map",
        z: { distribution: "uniform", extent: [0, 16] },
      },
    },
  };
}
