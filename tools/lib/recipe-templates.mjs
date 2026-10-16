const NAMESPACE = "africantrees";

function shaped(identifier, pattern, key, result, count = 1) {
  return {
    format_version: "1.21.0",
    "minecraft:recipe_shaped": {
      description: { identifier },
      tags: ["crafting_table"],
      pattern,
      key,
      result: { item: result, count },
    },
  };
}

function shapeless(identifier, ingredients, result, count = 1) {
  return {
    format_version: "1.21.0",
    "minecraft:recipe_shapeless": {
      description: { identifier },
      tags: ["crafting_table"],
      ingredients,
      result: { item: result, count },
    },
  };
}

export function planksRecipe(species) {
  const log = `${NAMESPACE}:${species.id}_log`;
  const planks = `${NAMESPACE}:${species.id}_planks`;
  return shapeless(`${NAMESPACE}:${species.id}_planks_from_log`, [{ item: log }], planks, 4);
}

export function stairsRecipe(species) {
  const planks = `${NAMESPACE}:${species.id}_planks`;
  const stairs = `${NAMESPACE}:${species.id}_stairs`;
  return shaped(
    `${NAMESPACE}:${species.id}_stairs`,
    ["P  ", "PP ", "PPP"],
    { P: { item: planks } },
    stairs,
    4
  );
}

export function slabRecipe(species) {
  const planks = `${NAMESPACE}:${species.id}_planks`;
  const slab = `${NAMESPACE}:${species.id}_slab`;
  return shaped(`${NAMESPACE}:${species.id}_slab`, ["PPP"], { P: { item: planks } }, slab, 6);
}

export function fenceRecipe(species) {
  const planks = `${NAMESPACE}:${species.id}_planks`;
  const fence = `${NAMESPACE}:${species.id}_fence`;
  return shaped(
    `${NAMESPACE}:${species.id}_fence`,
    ["PSP", "PSP"],
    { P: { item: planks }, S: { item: "minecraft:stick" } },
    fence,
    3
  );
}

export function fenceGateRecipe(species) {
  const planks = `${NAMESPACE}:${species.id}_planks`;
  const gate = `${NAMESPACE}:${species.id}_fence_gate`;
  return shaped(
    `${NAMESPACE}:${species.id}_fence_gate`,
    ["SPS", "SPS"],
    { P: { item: planks }, S: { item: "minecraft:stick" } },
    gate,
    1
  );
}

export function doorRecipe(species) {
  const planks = `${NAMESPACE}:${species.id}_planks`;
  const door = `${NAMESPACE}:${species.id}_door`;
  return shaped(
    `${NAMESPACE}:${species.id}_door`,
    ["PP", "PP", "PP"],
    { P: { item: planks } },
    door,
    1
  );
}

export function trapdoorRecipe(species) {
  const planks = `${NAMESPACE}:${species.id}_planks`;
  const trapdoor = `${NAMESPACE}:${species.id}_trapdoor`;
  return shaped(
    `${NAMESPACE}:${species.id}_trapdoor`,
    ["PPP", "PPP"],
    { P: { item: planks } },
    trapdoor,
    1
  );
}

export function pressurePlateRecipe(species) {
  const planks = `${NAMESPACE}:${species.id}_planks`;
  const plate = `${NAMESPACE}:${species.id}_pressure_plate`;
  return shaped(`${NAMESPACE}:${species.id}_pressure_plate`, ["PP"], { P: { item: planks } }, plate, 1);
}

export function buttonRecipe(species) {
  const planks = `${NAMESPACE}:${species.id}_planks`;
  const button = `${NAMESPACE}:${species.id}_button`;
  return shapeless(`${NAMESPACE}:${species.id}_button`, [{ item: planks }], button, 1);
}

export function signRecipe(species) {
  const planks = `${NAMESPACE}:${species.id}_planks`;
  const sign = `${NAMESPACE}:${species.id}_sign`;
  return shaped(
    `${NAMESPACE}:${species.id}_sign`,
    ["PPP", "PPP", " S "],
    { P: { item: planks }, S: { item: "minecraft:stick" } },
    sign,
    3
  );
}

export function hangingSignRecipe(species) {
  const strippedLog = `${NAMESPACE}:stripped_${species.id}_log`;
  const hangingSign = `${NAMESPACE}:${species.id}_hanging_sign`;
  return shaped(
    `${NAMESPACE}:${species.id}_hanging_sign`,
    ["C C", "LLL", "LLL"],
    { C: { item: "minecraft:chain" }, L: { item: strippedLog } },
    hangingSign,
    6
  );
}

export function boatRecipe(species) {
  const planks = `${NAMESPACE}:${species.id}_planks`;
  const boat = `${NAMESPACE}:${species.id}_boat`;
  return shaped(
    `${NAMESPACE}:${species.id}_boat`,
    ["P P", "PPP"],
    { P: { item: planks } },
    boat,
    1
  );
}
