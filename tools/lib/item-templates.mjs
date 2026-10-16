const NAMESPACE = "africantrees";

export function boatItem(species) {
  return {
    format_version: "1.21.0",
    "minecraft:item": {
      description: {
        identifier: `${NAMESPACE}:${species.id}_boat`,
        category: "items",
      },
      components: {
        "minecraft:icon": { texture: `${species.id}_boat` },
        "minecraft:max_stack_size": 1,
        "minecraft:entity_placer": {
          entity: `${NAMESPACE}:${species.id}_boat`,
          dispense_on: ["minecraft:water"],
          use_on: ["minecraft:water"],
        },
      },
    },
  };
}
