import { mkdirSync, writeFileSync } from "node:fs";
import { loadTreeData } from "./lib/trees-data.mjs";
import {
  logBlock,
  strippedLogBlock,
  woodBlock,
  strippedWoodBlock,
  planksBlock,
} from "./lib/block-templates/cubes.mjs";
import {
  stairsBlock,
  slabBlock,
  fenceBlock,
  fenceGateBlock,
  doorBlock,
  trapdoorBlock,
  pressurePlateBlock,
  buttonBlock,
} from "./lib/block-templates/shaped.mjs";
import { signBlock, hangingSignBlock, saplingBlock } from "./lib/block-templates/special.mjs";
import { treeFeature, treeFeatureRule } from "./lib/feature-templates.mjs";
import { boatItem } from "./lib/item-templates.mjs";
import { boatServerEntity, boatClientEntity } from "./lib/entity-templates.mjs";
import * as recipes from "./lib/recipe-templates.mjs";
import { logLootTable } from "./lib/loot-table-templates.mjs";
import { pngFromSolidColor, pngFromTwoTone } from "./lib/texture-gen.mjs";

const BLOCK_TEMPLATES = [
  ["log", logBlock],
  ["stripped_log", strippedLogBlock],
  ["wood", woodBlock],
  ["stripped_wood", strippedWoodBlock],
  ["planks", planksBlock],
  ["stairs", stairsBlock],
  ["slab", slabBlock],
  ["fence", fenceBlock],
  ["fence_gate", fenceGateBlock],
  ["door", doorBlock],
  ["trapdoor", trapdoorBlock],
  ["pressure_plate", pressurePlateBlock],
  ["button", buttonBlock],
  ["sign", signBlock],
  ["hanging_sign", hangingSignBlock],
  ["sapling", saplingBlock],
];

const RECIPE_TEMPLATES = [
  ["planks", recipes.planksRecipe],
  ["stairs", recipes.stairsRecipe],
  ["slab", recipes.slabRecipe],
  ["fence", recipes.fenceRecipe],
  ["fence_gate", recipes.fenceGateRecipe],
  ["door", recipes.doorRecipe],
  ["trapdoor", recipes.trapdoorRecipe],
  ["pressure_plate", recipes.pressurePlateRecipe],
  ["button", recipes.buttonRecipe],
  ["sign", recipes.signRecipe],
  ["hanging_sign", recipes.hangingSignRecipe],
  ["boat", recipes.boatRecipe],
];

function writeJson(path, obj) {
  writeFileSync(path, JSON.stringify(obj, null, 2) + "\n");
}

function ensureDirs() {
  const dirs = [
    "behavior_pack/blocks",
    "behavior_pack/items",
    "behavior_pack/entities",
    "behavior_pack/recipes",
    "behavior_pack/loot_tables/blocks",
    "behavior_pack/features",
    "behavior_pack/feature_rules",
    "resource_pack/entity",
    "resource_pack/textures/blocks",
    "resource_pack/textures/entity",
    "resource_pack/texts",
  ];
  for (const dir of dirs) mkdirSync(dir, { recursive: true });
}

function generate() {
  ensureDirs();
  const species = loadTreeData();

  const terrainTextureData = {};
  const langLines = [];

  for (const sp of species) {
    const id = sp.id;

    for (const [suffix, fn] of BLOCK_TEMPLATES) {
      writeJson(`behavior_pack/blocks/${id}_${suffix}.json`, fn(sp));
      langLines.push(`tile.africantrees:${id}_${suffix}.name=${sp.displayName} ${titleCase(suffix)}`);
    }

    writeJson(`behavior_pack/items/${id}_boat.json`, boatItem(sp));
    writeJson(`behavior_pack/entities/${id}_boat.json`, boatServerEntity(sp));
    writeJson(`resource_pack/entity/${id}_boat.json`, boatClientEntity(sp));
    langLines.push(`item.africantrees:${id}_boat.name=${sp.displayName} Boat`);

    for (const [suffix, fn] of RECIPE_TEMPLATES) {
      writeJson(`behavior_pack/recipes/${id}_${suffix}.json`, fn(sp));
    }

    writeJson(`behavior_pack/loot_tables/blocks/${id}_log.json`, logLootTable(sp));

    writeJson(`behavior_pack/features/${id}_tree.json`, treeFeature(sp));
    writeJson(`behavior_pack/feature_rules/${id}_tree_rule.json`, treeFeatureRule(sp));

    // Textures: reuse the 4 per-species placeholder textures for every
    // texture short name the block templates reference (stripped variants
    // and the sapling fall back to the bark/leaves textures rather than
    // getting dedicated art, since this is placeholder-scope per the spec).
    const barkPng = pngFromSolidColor(sp.barkColorHex);
    const barkTopPng = pngFromTwoTone(sp.barkColorHex, sp.plankColorHex);
    const planksPng = pngFromSolidColor(sp.plankColorHex);
    const leavesPng = pngFromSolidColor(sp.leafColorHex);
    const boatPng = pngFromTwoTone(sp.barkColorHex, sp.plankColorHex);

    writeFileSync(`resource_pack/textures/blocks/${id}_bark.png`, barkPng);
    writeFileSync(`resource_pack/textures/blocks/${id}_bark_top.png`, barkTopPng);
    writeFileSync(`resource_pack/textures/blocks/${id}_planks.png`, planksPng);
    writeFileSync(`resource_pack/textures/blocks/${id}_leaves.png`, leavesPng);
    writeFileSync(`resource_pack/textures/entity/${id}_boat.png`, boatPng);

    const textureKeyToFile = {
      [`${id}_log`]: `textures/blocks/${id}_bark`,
      [`${id}_log_top`]: `textures/blocks/${id}_bark_top`,
      [`stripped_${id}_log`]: `textures/blocks/${id}_bark`,
      [`stripped_${id}_log_top`]: `textures/blocks/${id}_bark_top`,
      [`${id}_planks`]: `textures/blocks/${id}_planks`,
      [`${id}_sapling`]: `textures/blocks/${id}_leaves`,
      [`${id}_boat`]: `textures/entity/${id}_boat`,
    };
    for (const [key, texturePath] of Object.entries(textureKeyToFile)) {
      terrainTextureData[key] = { textures: texturePath };
    }
  }

  writeJson("resource_pack/terrain_texture.json", {
    resource_pack_name: "african_trees",
    texture_name: "atlas.terrain",
    padding: 8,
    num_mip_levels: 4,
    texture_data: terrainTextureData,
  });

  writeFileSync("resource_pack/texts/en_US.lang", langLines.join("\n") + "\n");
}

function titleCase(suffix) {
  return suffix
    .split("_")
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(" ");
}

generate();
