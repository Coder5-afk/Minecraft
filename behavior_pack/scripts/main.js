import { world, system } from "@minecraft/server";

// Review finding C3 (final review of 2026-10-16-african-trees-addon):
// sapling growth/bonemeal and door/trapdoor/fence-gate interaction were
// originally wired through minecraft:on_random_tick and a block "events"
// map. That system (minecraft:random_ticking and friends) was removed
// from Bedrock's block format in 1.20.80; the current replacement is a
// Script API custom block component. This file is the minimal version of
// that replacement -- one shared component per behavior, applied to every
// species' block via "minecraft:custom_components" in its JSON, with the
// species id parsed back out of the block's own type id so one component
// definition covers all 10 species.
//
// This cannot be exercised in this sandbox (no Minecraft client); the
// companion test (tools/test/scripts-main.test.mjs) only proves the
// expected components and hooks are registered by name. Exact
// BlockCustomComponent registration shape reconstructed from Script API
// docs fragments -- verify against the in-game content log before
// shipping.

const GROWTH_STAGE = "africantrees:growth_stage";
const MAX_GROWTH_STAGE = 3;
const BONE_MEAL_ITEM = "minecraft:bone_meal";

function speciesIdFromBlockType(typeId, suffix) {
  const prefix = "africantrees:";
  if (!typeId.startsWith(prefix) || !typeId.endsWith(suffix)) return undefined;
  return typeId.slice(prefix.length, typeId.length - suffix.length);
}

function growOrAdvance(block, force) {
  const speciesId = speciesIdFromBlockType(block.typeId, "_sapling");
  if (!speciesId) return;

  const stage = block.permutation.getState(GROWTH_STAGE) ?? 0;
  if (force || stage >= MAX_GROWTH_STAGE) {
    const { x, y, z } = block.location;
    block.dimension.runCommand(`place feature africantrees:${speciesId}_tree ${x} ${y} ${z}`);
  } else {
    block.setPermutation(block.permutation.withState(GROWTH_STAGE, stage + 1));
  }
}

function heldItemId(player) {
  const inventory = player.getComponent("minecraft:inventory");
  const slot = inventory?.container?.getItem(player.selectedSlotIndex);
  return slot?.typeId;
}

world.beforeEvents.worldInitialize.subscribe((initEvent) => {
  initEvent.blockComponentRegistry.registerCustomComponent("africantrees:sapling_growth", {
    onRandomTick(event) {
      growOrAdvance(event.block, false);
    },
    onPlayerInteract(event) {
      if (event.player && heldItemId(event.player) === BONE_MEAL_ITEM) {
        growOrAdvance(event.block, true);
      }
    },
  });

  // Log/wood stripping (axe on a log/wood block swaps it for the stripped
  // variant), matching vanilla's own axe-stripping interaction -- data-
  // driven block events can no longer express this either.
  initEvent.blockComponentRegistry.registerCustomComponent("africantrees:strippable", {
    onPlayerInteract(event) {
      const { block, player } = event;
      if (!player) return;
      const item = heldItemId(player);
      if (!item || !item.endsWith("_axe")) return;

      const speciesIdLog = speciesIdFromBlockType(block.typeId, "_log");
      const speciesIdWood = speciesIdFromBlockType(block.typeId, "_wood");
      if (speciesIdLog) {
        system.run(() => block.setType(`africantrees:stripped_${speciesIdLog}_log`));
      } else if (speciesIdWood) {
        system.run(() => block.setType(`africantrees:stripped_${speciesIdWood}_wood`));
      }
    },
  });

  // Door/trapdoor/fence-gate open/close. This only flips the tracked
  // state -- it does not yet swap in an open-position geometry (no second
  // geometry variant exists per shape), so the block does not visually
  // swing open. Tracked as a deferred follow-up (see the implementation
  // ledger's Task-11-fix-pass ruling); this at minimum removes the
  // dangling "africantrees:toggle_open" event reference the blocks
  // previously pointed at, which resolved to nothing.
  initEvent.blockComponentRegistry.registerCustomComponent("africantrees:toggleable", {
    onPlayerInteract(event) {
      const { block } = event;
      const open = block.permutation.getState("africantrees:open") ?? false;
      block.setPermutation(block.permutation.withState("africantrees:open", !open));
    },
  });
});
