const NAMESPACE = "africantrees";

function materialInstance(texture) {
  return { texture, render_method: "opaque" };
}

function block(identifier, geometry, materials, extraComponents = {}) {
  return {
    format_version: "1.21.0",
    "minecraft:block": {
      description: {
        identifier,
        menu_category: { category: "construction" },
      },
      components: {
        "minecraft:geometry": geometry,
        "minecraft:material_instances": materials,
        "minecraft:destructible_by_mining": { seconds_to_destroy: 2 },
        "minecraft:flammable": { flame_odds: 5, burn_odds: 5 },
        ...extraComponents,
      },
    },
  };
}

export function stairsBlock(species) {
  return block(`${NAMESPACE}:${species.id}_stairs`, "geometry.africantrees_stairs", {
    "*": materialInstance(`${species.id}_planks`),
  });
}

export function slabBlock(species) {
  return block(`${NAMESPACE}:${species.id}_slab`, "geometry.africantrees_slab", {
    "*": materialInstance(`${species.id}_planks`),
  });
}

export function fenceBlock(species) {
  return block(`${NAMESPACE}:${species.id}_fence`, "geometry.africantrees_fence", {
    "*": materialInstance(`${species.id}_planks`),
  });
}

export function fenceGateBlock(species) {
  return block(
    `${NAMESPACE}:${species.id}_fence_gate`,
    "geometry.africantrees_fence_gate",
    { "*": materialInstance(`${species.id}_planks`) },
    { "minecraft:on_interact": { event: `${NAMESPACE}:toggle_open` } }
  );
}

export function doorBlock(species) {
  return block(
    `${NAMESPACE}:${species.id}_door`,
    "geometry.africantrees_door",
    { "*": materialInstance(`${species.id}_planks`) },
    { "minecraft:on_interact": { event: `${NAMESPACE}:toggle_open` } }
  );
}

export function trapdoorBlock(species) {
  return block(
    `${NAMESPACE}:${species.id}_trapdoor`,
    "geometry.africantrees_trapdoor",
    { "*": materialInstance(`${species.id}_planks`) },
    { "minecraft:on_interact": { event: `${NAMESPACE}:toggle_open` } }
  );
}

export function pressurePlateBlock(species) {
  return block(`${NAMESPACE}:${species.id}_pressure_plate`, "minecraft:geometry.full_block", {
    "*": materialInstance(`${species.id}_planks`),
  });
}

export function buttonBlock(species) {
  return block(`${NAMESPACE}:${species.id}_button`, "minecraft:geometry.full_block", {
    "*": materialInstance(`${species.id}_planks`),
  });
}
