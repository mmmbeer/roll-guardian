import test from "node:test";
import assert from "node:assert/strict";
import { createDefaultState, createBlankCharacter, replaceCharacter, loadState, saveState } from "../dist/js/state.js";
import { buildRollPlan, executeRoll } from "../dist/js/roll-engine.js";
import { renderModifierPopover, renderRollSubrail } from "../dist/js/ui.js";
import { CHECKS, ABILITIES } from "../dist/js/rules-data.js";
import { importCharacterJson } from "../dist/js/importer.js";

function blankState() {
  const state = createDefaultState();
  replaceCharacter(state);
  return state;
}

test("starting blank removes character data and remembered roll assumptions", () => {
  const state = createDefaultState();
  state.character.classes = [{ name: "Rogue", level: 9 }];
  state.character.featureNames = ["Sneak Attack"];
  state.character.items = ["Magic sword"];
  state.activeEffects = ["bless", "poisoned"];
  state.roll.selectedEffects = ["sneak-attack", "bardic-inspiration"];
  Object.assign(state.roll, { modeOverride: "advantage", critical: true, targetAC: 17, customNotation: "2d20+8" });
  state.effectConfig = { "bardic-inspiration": { bardLevel: 15 } };
  state.customEffects = [{ id: "personal-bonus", name: "Personal bonus" }];
  state.history = [{ id: "last-roll" }];
  state.diceAppearance = { material: "stormglass" };
  state.ruleset = "2014";
  replaceCharacter(state);
  assert.deepEqual(state.character, createBlankCharacter());
  assert.deepEqual(state.activeEffects, []);
  assert.deepEqual(state.roll.selectedEffects, []);
  assert.deepEqual(state.effectConfig, {});
  assert.equal(state.roll.modeOverride, null);
  assert.equal(state.roll.critical, false);
  assert.equal(state.roll.targetAC, "");
  assert.equal(state.roll.selectedWeaponId, null);
  assert.equal(state.roll.selectedSpellId, null);
  assert.equal(state.ruleset, "2014");
  assert.equal(state.history.length, 1);
  assert.equal(state.customEffects.length, 1);
  assert.equal(state.diceAppearance.material, "stormglass");
});

test("blank attack, every check and every save roll a normal unmodified d20", () => {
  const state = blankState();
  const verify = () => {
    const plan = buildRollPlan(state);
    assert.equal(plan.mode, "normal");
    assert.equal(plan.flat, 0);
    assert.deepEqual(plan.dice.map(die => die.sides), [20]);
    assert.deepEqual(plan.effects, []);
    assert.equal(plan.blocked, false);
  };
  verify();
  state.roll.context = "skill";
  for (const check of CHECKS) { state.roll.selectedSkill = check.key; verify(); }
  state.roll.context = "save";
  for (const ability of [...ABILITIES.map(a => a.key), "death"]) { state.roll.selectedSave = ability; verify(); }
  state.roll.context = "custom";
  verify();
  state.roll.customNotation = "2d6 + 4";
  assert.deepEqual(buildRollPlan(state).dice.map(die => die.sides), [6, 6]);
  assert.equal(buildRollPlan(state).flat, 4);
});

test("blank rolls accept explicit modifiers and retain their context", () => {
  const state = blankState();
  state.roll.selectedEffects = ["bless"];
  assert.deepEqual(buildRollPlan(state).dice.map(die => die.sides), [20, 4]);
  assert.match(renderModifierPopover(state, "current"), /data-roll-effect="bless"[^>]*checked/);
  state.roll.context = "damage";
  state.roll.damageNotation = "2d8";
  state.roll.damageType = "Fire";
  let plan = buildRollPlan(state);
  assert.deepEqual(plan.dice.map(die => die.sides), [8, 8]);
  assert.equal(plan.base.damageType, "Fire");
  assert.equal(plan.base.damageRoll, true);
  assert.doesNotMatch(renderModifierPopover(state, "current"), /data-roll-effect="bless"/);
  assert.match(renderRollSubrail(state), /aria-label="Damage dice"/);
  state.roll.critical = true;
  assert.equal(buildRollPlan(state).dice.length, 4);
  state.roll.context = "attack";
  state.roll.critical = false;
  plan = buildRollPlan(state);
  assert.equal(plan.base.attackRoll, true);
  assert.deepEqual(plan.dice.map(die => die.sides), [20, 4]);
  assert.equal(executeRoll(plan).usedResults.length, 2);
});

test("blank character survives persistence without default weapons or proficiencies", () => {
  const previous = globalThis.localStorage;
  let stored;
  globalThis.localStorage = { setItem: (_, value) => { stored = value; }, getItem: () => stored };
  try {
    const state = blankState();
    saveState(state);
    const restored = loadState();
    assert.deepEqual(restored.character, createBlankCharacter());
    assert.equal(buildRollPlan(restored).flat, 0);
    assert.equal(restored.roll.selectedWeaponId, null);
  } finally { globalThis.localStorage = previous; }
});

test("importing after a blank character restores explicit character math only", () => {
  const state = blankState();
  state.activeEffects = ["bless"];
  const imported = importCharacterJson({ name: "Test ranger", level: 5, proficiencyBonus: 3 });
  replaceCharacter(state, imported.character);
  assert.equal(state.character.name, "Test ranger");
  assert.equal(state.character.proficiencyBonus, 3);
  assert.deepEqual(state.activeEffects, []);
  assert.deepEqual(state.character.weapons, []);
});
