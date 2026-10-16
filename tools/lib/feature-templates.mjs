import { BIOME_POOL } from "./constants.mjs";

const NAMESPACE = "africantrees";

export function treeFeature(species) {
  const identifier = `${NAMESPACE}:${species.id}_tree`;
  return {
    format_version: "1.13.0",
    "minecraft:tree_feature": {
      description: { identifier },
      base_block: "minecraft:dirt",
      may_grow_on: ["minecraft:dirt", "minecraft:grass"],
      may_replace: ["minecraft:air", `${NAMESPACE}:${species.id}_sapling`],
      trunk: {
        trunk_block: { name: `${NAMESPACE}:${species.id}_log` },
        trunk_height: { base: 5, variance: 3 },
      },
      canopy: {
        canopy_block: { name: `minecraft:leaves` },
        canopy_offset: { base: 0, variance: 2 },
        canopy_radius: 2,
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
        x: { distribution: "uniform", extent: [0, 16] },
        y: { distribution: "uniform", extent: [0, 1] },
        z: { distribution: "uniform", extent: [0, 16] },
      },
    },
  };
}
