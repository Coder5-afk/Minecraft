const NAMESPACE = "africantrees";
const SAPLING_DROP_CHANCE = 0.05;

export function logLootTable(species) {
  return {
    pools: [
      {
        rolls: 1,
        entries: [{ type: "item", name: `${NAMESPACE}:${species.id}_log`, weight: 1 }],
      },
      {
        rolls: 1,
        entries: [
          {
            type: "item",
            name: `${NAMESPACE}:${species.id}_sapling`,
            weight: 1,
            functions: [{ function: "minecraft:random_chance", chance: SAPLING_DROP_CHANCE }],
          },
        ],
      },
    ],
  };
}
