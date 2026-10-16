const NAMESPACE = "africantrees";

function materialInstance(texture) {
  return { texture, render_method: "opaque" };
}

export function signBlock(species) {
  return {
    format_version: "1.21.0",
    "minecraft:block": {
      description: {
        identifier: `${NAMESPACE}:${species.id}_sign`,
        menu_category: { category: "construction" },
      },
      components: {
        "minecraft:geometry": "geometry.africantrees_sign",
        "minecraft:material_instances": { "*": materialInstance(`${species.id}_planks`) },
        "minecraft:destructible_by_mining": { seconds_to_destroy: 1 },
        "minecraft:flammable": { flame_odds: 5, burn_odds: 5 },
      },
    },
  };
}

export function hangingSignBlock(species) {
  return {
    format_version: "1.21.0",
    "minecraft:block": {
      description: {
        identifier: `${NAMESPACE}:${species.id}_hanging_sign`,
        menu_category: { category: "construction" },
      },
      components: {
        "minecraft:geometry": "geometry.africantrees_hanging_sign",
        "minecraft:material_instances": {
          "*": materialInstance(`stripped_${species.id}_log`),
        },
        "minecraft:destructible_by_mining": { seconds_to_destroy: 1 },
        "minecraft:flammable": { flame_odds: 5, burn_odds: 5 },
      },
    },
  };
}

export function saplingBlock(species) {
  return {
    format_version: "1.21.0",
    "minecraft:block": {
      description: {
        identifier: `${NAMESPACE}:${species.id}_sapling`,
        menu_category: { category: "nature" },
        states: {
          "africantrees:growth_stage": [0, 1, 2, 3],
        },
      },
      components: {
        "minecraft:geometry": "minecraft:geometry.cross",
        "minecraft:material_instances": { "*": materialInstance(`${species.id}_sapling`) },
        "minecraft:destructible_by_mining": { seconds_to_destroy: 0 },
        "minecraft:on_random_tick": {
          event: `${NAMESPACE}:grow_${species.id}`,
          condition: "query.random_value(0, 6) == 0",
        },
      },
    },
  };
}
