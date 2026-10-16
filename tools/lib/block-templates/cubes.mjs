const NAMESPACE = "africantrees";

function materialInstance(texture) {
  return { texture, render_method: "opaque" };
}

function cubeBlock(identifier, materials) {
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
      },
    },
  };
}

export function logBlock(species) {
  return cubeBlock(`${NAMESPACE}:${species.id}_log`, {
    "*": materialInstance(`${species.id}_log`),
    up: materialInstance(`${species.id}_log_top`),
    down: materialInstance(`${species.id}_log_top`),
  });
}

export function strippedLogBlock(species) {
  return cubeBlock(`${NAMESPACE}:stripped_${species.id}_log`, {
    "*": materialInstance(`stripped_${species.id}_log`),
    up: materialInstance(`stripped_${species.id}_log_top`),
    down: materialInstance(`stripped_${species.id}_log_top`),
  });
}

export function woodBlock(species) {
  return cubeBlock(`${NAMESPACE}:${species.id}_wood`, {
    "*": materialInstance(`${species.id}_log`),
  });
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
