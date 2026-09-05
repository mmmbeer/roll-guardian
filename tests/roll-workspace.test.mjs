import test from "node:test";
import assert from "node:assert/strict";
import { buildRollPlan } from "../dist/js/roll-engine.js";
import { createDefaultState } from "../dist/js/state.js";
import { appearanceMarkup, DICE_MATERIALS, materialById } from "../dist/js/dice-materials.js";
import { PARTICLE_PROFILES, particleProfile } from "../dist/js/dice-particles.js";
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

test("spell picker prioritizes and marks an imported character spell", () => {
  const state = createDefaultState();
  state.roll.context = "spell";
  state.character.name = "Mira";
  state.character.spells = [{ id: "known-guiding-bolt", name: "Guiding Bolt", imported: true }];
  state.roll.selectedSpellId = "known-guiding-bolt";
  const markup = renderRollSubrail(state);

  assert.match(markup, /★ Mira’s spells/);
  assert.match(markup, /★ Guiding Bolt/);
  assert.ok(markup.indexOf("★ Guiding Bolt") < markup.indexOf("Acid Arrow"));
  assert.match(markup, /data-spell-phase="attack"/);
  assert.match(markup, /data-spell-phase="damage"/);
});

test("features picker exposes a scaled Sneak Attack for an imported rogue", () => {
  const state = createDefaultState();
  state.roll.context = "damage";
  state.character.imported = true;
  state.character.level = 7;
  state.character.classes = [{ name: "Rogue", level: 7 }];
  const markup = renderModifierPopover(state, "features");

  assert.match(markup, /Character features/);
  assert.match(markup, /Sneak Attack/);
  assert.match(markup, /4d6/);
  assert.match(markup, /data-roll-effect="sneak-attack"[^>]*>/);
  assert.doesNotMatch(markup, /data-roll-effect="sneak-attack"[^>]*disabled/);
});

test("modifier picker disables a scoped preset outside its trigger", () => {
  const state = createDefaultState();
  state.roll.context = "skill";
  state.roll.selectedSkill = "athletics";
  const markup = renderModifierPopover(state, "search", "Pass without Trace");
  assert.match(markup, /Pass without Trace/);
  assert.match(markup, /is-disabled/);
});

test("roll rails include initiative, straight checks, and death saves", () => {
  const state = createDefaultState();
  state.roll.context = "skill";
  assert.match(renderRollSubrail(state), /Initiative/);
  assert.match(renderRollSubrail(state), /Strength check/);
  state.roll.context = "save";
  assert.match(renderRollSubrail(state), /Death \+0/);
});

test("dice appearance catalog includes eight solids and ten textures", () => {
  assert.equal(DICE_MATERIALS.filter(material => material.kind === "solid").length, 8);
  assert.equal(DICE_MATERIALS.filter(material => material.kind === "texture").length, 10);
  assert.ok(DICE_MATERIALS.filter(material => material.effect).length >= 5);
  assert.equal(materialById("missing").id, "amber");
});

test("dice appearance picker identifies selections and roll effects", () => {
  const markup = appearanceMarkup("stormglass");
  assert.equal(markup.match(/data-dice-material=/g).length, 18);
  assert.match(markup, /data-dice-material="stormglass"[^>]*aria-pressed="true"/);
  assert.match(markup, /Roll effect · lightning arcs/);
  assert.match(markup, /reduced-motion/);
});

test("each animated material uses a configured Proton emitter profile", () => {
  const effects = DICE_MATERIALS.map(material => material.effect).filter(Boolean);
  assert.deepEqual(effects.sort(), Object.keys(PARTICLE_PROFILES).sort());
  effects.forEach(effect => {
    const profile = particleProfile(effect);
    assert.ok(profile.life[0] > 0);
    assert.ok(profile.rate[1] <= 4);
    assert.ok(profile.stopAt < .9);
  });
});
