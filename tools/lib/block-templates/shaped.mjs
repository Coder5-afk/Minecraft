const NAMESPACE = "africantrees";

function materialInstance(texture) {
  return { texture, render_method: "opaque" };
}

function block(identifier, geometry, materials, { states = {}, components = {} } = {}) {
  return {
    format_version: "1.21.0",
    "minecraft:block": {
      description: {
        identifier,
        menu_category: { category: "construction" },
        ...(Object.keys(states).length > 0 ? { states } : {}),
      },
      components: {
        "minecraft:geometry": geometry,
        "minecraft:material_instances": materials,
        "minecraft:destructible_by_mining": { seconds_to_destroy: 2 },
        "minecraft:flammable": { flame_odds: 5, burn_odds: 5 },
        ...components,
      },
    },
  };
}

// Review finding I4 (final review of 2026-10-16-african-trees-addon):
// door/trapdoor/fence_gate referenced "africantrees:toggle_open" via
// minecraft:on_interact, an event defined nowhere -- and that component
// doesn't exist in Bedrock's current block format regardless (see the
// Script API pivot in special.mjs/behavior_pack/scripts/main.js). All
// three now share the africantrees:toggleable custom component and an
// africantrees:open state. This flips the state on interact but does not
// yet swap in an open-position geometry (no second geometry variant
// exists per shape) -- ledgered as a deferred follow-up, not silently
// dropped.
function toggleableExtras() {
  return {
    states: { "africantrees:open": [false, true] },
    components: { "minecraft:custom_components": ["africantrees:toggleable"] },
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
    toggleableExtras()
  );
}

export function doorBlock(species) {
  return block(
    `${NAMESPACE}:${species.id}_door`,
    "geometry.africantrees_door",
    { "*": materialInstance(`${species.id}_planks`) },
    toggleableExtras()
  );
}

export function trapdoorBlock(species) {
  return block(
    `${NAMESPACE}:${species.id}_trapdoor`,
    "geometry.africantrees_trapdoor",
    { "*": materialInstance(`${species.id}_planks`) },
    toggleableExtras()
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
