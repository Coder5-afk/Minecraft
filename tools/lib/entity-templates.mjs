const NAMESPACE = "africantrees";

// Review finding I6 (final review of 2026-10-16-african-trees-addon):
// "minecraft:boat": {} is not a documented component, and a hand-rolled
// buoyancy/physics pair is a poor substitute for vanilla's own boat
// movement. runtime_identifier: "minecraft:boat" makes this entity reuse
// vanilla's real boat behavior (buoyancy, paddling, capsizing) under a
// new identifier/texture, the same mechanism vanilla itself uses for its
// own wood-type boat variants, rather than reimplementing boat physics
// from scratch. minecraft:rideable is what actually lets a player board
// it -- its exact seat/interact text values are a reasonable default, not
// verified in-game.
export function boatServerEntity(species) {
  return {
    format_version: "1.21.0",
    "minecraft:entity": {
      description: {
        identifier: `${NAMESPACE}:${species.id}_boat`,
        runtime_identifier: "minecraft:boat",
        is_spawnable: false,
        is_summonable: true,
      },
      component_groups: {},
      components: {
        "minecraft:rideable": {
          seat_count: 2,
          crouching_skip_interact: true,
          interact_text: "action.interact.ride.boat",
          seats: [
            { position: [0.0, 0.1, 0.2], lock_rider_rotation: 0 },
            { position: [0.0, 0.1, -0.3], lock_rider_rotation: 0 },
          ],
        },
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
