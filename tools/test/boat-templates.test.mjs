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
