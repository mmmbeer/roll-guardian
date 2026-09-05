import test from "node:test";
import assert from "node:assert/strict";
import { buildRollPlan } from "../dist/js/roll-engine.js";
import { createDefaultState } from "../dist/js/state.js";
import { renderDiceLoadout, renderModifierPopover, renderRollSubrail, rollFamily } from "../dist/js/ui.js";

test("weapon contexts share one bottom-rail family", () => {
  assert.equal(rollFamily("attack"), "weapon");
  assert.equal(rollFamily("damage"), "weapon");
  assert.equal(rollFamily("spell"), "spell");
});

test("weapon subrail includes mode and weapon choices", () => {
  const state = createDefaultState();
  state.roll.selectedWeaponId = state.character.weapons[0].id;
  const markup = renderRollSubrail(state);
  assert.match(markup, /data-context="attack"/);
  assert.match(markup, /data-context="damage"/);
  assert.match(markup, /Longsword/);
  assert.match(markup, /Armor|Target|AC/);
});

test("dice loadout exposes base and effect dice before rolling", () => {
  const state = createDefaultState();
  state.roll.selectedWeaponId = state.character.weapons[0].id;
  state.roll.selectedEffects = ["bless"];
  const markup = renderDiceLoadout(state, buildRollPlan(state));
  assert.match(markup, /d20/);
  assert.match(markup, /d4/);
  assert.match(markup, /Bless/);
  assert.match(markup, /Base modifier/);
});

test("global modifier search spans groups and marks wrong-context results", () => {
  const state = createDefaultState();
  state.roll.context = "attack";
  const markup = renderModifierPopover(state, "search", "hunter");
  assert.match(markup, /Hunter’s Mark/);
  assert.match(markup, /is-disabled/);
  assert.match(markup, /Applies to Damage/);
});
