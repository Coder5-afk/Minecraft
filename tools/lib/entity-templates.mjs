const NAMESPACE = "africantrees";

export function boatServerEntity(species) {
  return {
    format_version: "1.21.0",
    "minecraft:entity": {
      description: {
        identifier: `${NAMESPACE}:${species.id}_boat`,
        is_spawnable: false,
        is_summonable: true,
      },
      component_groups: {},
      components: {
        "minecraft:boat": {},
        "minecraft:buoyant": {
          apply_gravity: true,
          base_buoyancy: 1.0,
          liquid_blocks: ["minecraft:water", "minecraft:flowing_water"],
        },
        "minecraft:physics": {},
        "minecraft:pushable": { is_pushable: true, is_pushable_by_piston: true },
        "minecraft:collision_box": { width: 1.4, height: 0.6 },
      },
    },
  };
}

export function boatClientEntity(species) {
  const textureKey = `${species.id}_boat`;
  return {
    format_version: "1.21.0",
    "minecraft:client_entity": {
      description: {
        identifier: `${NAMESPACE}:${species.id}_boat`,
        materials: { default: "boat" },
        geometry: { default: "geometry.africantrees_boat" },
        textures: { default: `textures/entity/${textureKey}` },
        render_controllers: ["controller.render.boat"],
      },
    },
  };
}
