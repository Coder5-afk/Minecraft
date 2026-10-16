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
  const growEvent = `${NAMESPACE}:grow_${species.id}`;
  const forceGrowEvent = `${NAMESPACE}:force_grow_${species.id}`;
  const treeFeatureId = `${NAMESPACE}:${species.id}_tree`;
  const matureCondition = "q.block_state('africantrees:growth_stage') >= 3";

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
          event: growEvent,
          condition: "query.random_value(0, 6) == 0",
        },
        // Bone meal used on the sapling jumps straight to force-growing it,
        // instead of waiting for the next random tick.
        "minecraft:on_interact": {
          event: forceGrowEvent,
          condition: "query.is_item_name_any('slot.weapon.mainhand', 0, 'minecraft:bone_meal')",
        },
      },
      events: {
        [growEvent]: {
          sequence: [
            {
              condition: matureCondition,
              place_feature: treeFeatureId,
            },
            {
              condition: `!(${matureCondition})`,
              set_block_state: {
                "africantrees:growth_stage": "q.block_state('africantrees:growth_stage') + 1",
              },
            },
          ],
        },
        [forceGrowEvent]: {
          place_feature: treeFeatureId,
        },
      },
    },
  };
}
