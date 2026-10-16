import { test } from "node:test";
import assert from "node:assert/strict";
import { boatItem } from "../lib/item-templates.mjs";
import { boatServerEntity, boatClientEntity } from "../lib/entity-templates.mjs";

const species = { id: "baobab", displayName: "Baobab", barkColorHex: "#8B5A2B", plankColorHex: "#C9A66B", leafColorHex: "#4C7A3B" };

test("boat item and entity are correctly identified and linked to shared geometry", () => {
  assert.equal(boatItem(species)["minecraft:item"].description.identifier, "africantrees:baobab_boat");
  assert.equal(boatServerEntity(species)["minecraft:entity"].description.identifier, "africantrees:baobab_boat");

  const client = boatClientEntity(species)["minecraft:client_entity"];
  assert.equal(client.description.identifier, "africantrees:baobab_boat");
  assert.equal(client.description.geometry.default, "geometry.africantrees_boat");
  assert.equal(client.description.textures.default, "textures/entity/baobab_boat");
});

// Review finding I6 (final review): the server entity used fabricated
// components ("minecraft:boat": {}, a hand-rolled "minecraft:buoyant" and
// "minecraft:physics") that aren't how Bedrock actually gives an entity
// boat behavior, and had no minecraft:rideable, so a player couldn't
// board it at all. runtime_identifier: "minecraft:boat" makes this entity
// inherit vanilla's real boat movement/buoyancy; minecraft:rideable is
// what actually lets a player sit in it.
test("boat entity inherits vanilla boat behavior and is rideable", () => {
  const entity = boatServerEntity(species)["minecraft:entity"];
  assert.equal(entity.description.runtime_identifier, "minecraft:boat");
  assert.ok(entity.components["minecraft:rideable"]);
  assert.equal(entity.components["minecraft:boat"], undefined);
  assert.equal(entity.components["minecraft:buoyant"], undefined);
  assert.equal(entity.components["minecraft:physics"], undefined);
});
