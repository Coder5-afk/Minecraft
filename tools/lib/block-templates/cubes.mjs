const NAMESPACE = "africantrees";

function materialInstance(texture) {
  return { texture, render_method: "opaque" };
}

function cubeBlock(identifier, materials, extraComponents = {}) {
  return {
    format_version: "1.21.0",
    "minecraft:block": {
      description: {
        identifier,
        menu_category: { category: "construction" },
      },
      components: {
        "minecraft:geometry": "minecraft:geometry.full_block",
        "minecraft:material_instances": materials,
        "minecraft:destructible_by_mining": { seconds_to_destroy: 2 },
        "minecraft:flammable": { flame_odds: 5, burn_odds: 5 },
        "minecraft:map_color": "#8B5A2B",
        ...extraComponents,
      },
    },
  };
}

export function logBlock(species) {
  return cubeBlock(
    `${NAMESPACE}:${species.id}_log`,
    {
      "*": materialInstance(`${species.id}_log`),
      up: materialInstance(`${species.id}_log_top`),
      down: materialInstance(`${species.id}_log_top`),
    },
    // Review finding C3 (final review): without minecraft:loot,
    // logLootTable is generated but never fires -- no block referenced
    // it. Review finding I5: minecraft:custom_components makes the log
    // strippable via the shared africantrees:strippable Script API
    // component (behavior_pack/scripts/main.js) -- no data-driven
    // equivalent exists in Bedrock's current block format.
    {
      "minecraft:loot": `loot_tables/blocks/${species.id}_log.json`,
      "minecraft:custom_components": ["africantrees:strippable"],
    }
  );
}

export function strippedLogBlock(species) {
  return cubeBlock(`${NAMESPACE}:stripped_${species.id}_log`, {
    "*": materialInstance(`stripped_${species.id}_log`),
    up: materialInstance(`stripped_${species.id}_log_top`),
    down: materialInstance(`stripped_${species.id}_log_top`),
  });
}

export function woodBlock(species) {
  return cubeBlock(
    `${NAMESPACE}:${species.id}_wood`,
    { "*": materialInstance(`${species.id}_log`) },
    { "minecraft:custom_components": ["africantrees:strippable"] }
  );
}

export function strippedWoodBlock(species) {
  return cubeBlock(`${NAMESPACE}:stripped_${species.id}_wood`, {
    "*": materialInstance(`stripped_${species.id}_log`),
  });
}

export function planksBlock(species) {
  return cubeBlock(`${NAMESPACE}:${species.id}_planks`, {
    "*": materialInstance(`${species.id}_planks`),
  });
}

export function leavesBlock(species) {
  return {
    format_version: "1.21.0",
    "minecraft:block": {
      description: {
        identifier: `${NAMESPACE}:${species.id}_leaves`,
        menu_category: { category: "nature" },
      },
      components: {
        "minecraft:geometry": "minecraft:geometry.full_block",
        "minecraft:material_instances": {
          "*": { texture: `${species.id}_leaves`, render_method: "alpha_test" },
        },
        "minecraft:destructible_by_mining": { seconds_to_destroy: 0.2 },
        "minecraft:flammable": { flame_odds: 30, burn_odds: 60 },
      },
    },
  };
}
