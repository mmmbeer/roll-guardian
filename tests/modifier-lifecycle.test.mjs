import test from "node:test";
import assert from "node:assert/strict";
import { createDefaultState } from "../dist/js/state.js";
import { buildRollPlan, executeRoll, addPostRollModifier, effectCatalog, rerollOutcome } from "../dist/js/roll-engine.js";
import { bardLevel, usedLimitedEffects, removeEffects } from "../dist/js/modifier-lifecycle.js";
import { renderModifierPopover, renderRollSubrail, weaponForm, spellForm, effectForm } from "../dist/js/ui.js";

function setup(context = "attack", effects = [], ruleset = "2014") {
  const state = createDefaultState();
  state.ruleset = ruleset;
  state.roll.context = context;
  state.roll.selectedEffects = effects;
  return state;
}
function rolled(plan, values = [10, 3, 4, 2]) {
  return executeRoll(plan, plan.dice.map((die, i) => ({ ...die, value: values[i % values.length] })));
}

test("source bard class level scales Inspiration at every boundary in both profiles", () => {
  for (const ruleset of ["2014", "2024"]) {
    for (const [level, notation] of [[1,"1d6"],[4,"1d6"],[5,"1d8"],[9,"1d8"],[10,"1d10"],[14,"1d10"],[15,"1d12"],[20,"1d12"]]) {
      const state = setup("attack", ["bardic-inspiration"], ruleset);
      state.effectConfig["bardic-inspiration"] = { bardLevel: level };
      const plan = buildRollPlan(state);
      assert.equal(plan.postRollChoices[0].notation, notation);
      assert.equal(plan.dice.length, 1, "Do not roll Inspiration up front");
    }
  }
});

test("imported multiclass bard uses Bard level and honors source override and legacy dice", () => {
  const state = setup("attack", ["bardic-inspiration"]);
  state.character.imported = true;
  state.character.level = 17;
  state.character.classes = [{ name: "Bard", level: 4 }, { name: "Fighter", level: 13 }];
  assert.equal(bardLevel(state), 4);
  state.effectConfig["bardic-inspiration"] = { notation: "1d10" };
  assert.equal(bardLevel(state), 10);
  state.effectConfig["bardic-inspiration"] = { bardLevel: 15 };
  assert.equal(buildRollPlan(state).postRollChoices[0].notation, "1d12");
});

test("post-roll Inspiration preserves advantage dice and recalculates a miss as a hit once", () => {
  const state = setup("attack", ["bardic-inspiration", "help-attack", "bless"]);
  state.roll.targetAC = 20;
  const plan = buildRollPlan(state);
  const outcome = rolled(plan, [10, 12, 2]);
  assert.equal(outcome.total, 17);
  assert.equal(outcome.hit, false);
  const next = addPostRollModifier(plan, outcome, "bardic-inspiration", [4]);
  assert.equal(next.outcome.total, 21);
  assert.equal(next.outcome.hit, true);
  assert.equal(next.outcome.d20Value, 12);
  assert.deepEqual(next.outcome.results.slice(0, 3), outcome.results);
  assert.equal(addPostRollModifier(next.plan, next.outcome, "bardic-inspiration", [6]).outcome.total, 21);
});

test("an Inspiration bonus does not erase an attack's natural 1", () => {
  const state = setup("attack", ["bardic-inspiration"]);
  state.roll.targetAC = 5;
  const plan = buildRollPlan(state);
  const next = addPostRollModifier(plan, rolled(plan, [1]), "bardic-inspiration", [6]);
  assert.equal(next.outcome.naturalOne, true);
  assert.equal(next.outcome.hit, false);
});

test("remembered support disappears for damage and returns for saves and spell attacks", () => {
  const state = setup("damage", ["bardic-inspiration", "bless"]);
  assert.equal(buildRollPlan(state).effects.length, 0);
  state.roll.context = "save";
  assert.equal(buildRollPlan(state).effects.length, 2);
  state.roll.context = "spell";
  state.character.spells = [{ id: "bolt", name: "Fire Bolt", imported: true }];
  state.roll.selectedSpellId = "bolt";
  state.roll.spellPhase = "attack";
  assert.equal(buildRollPlan(state).postRollChoices.length, 1);
  state.roll.spellPhase = "damage";
  assert.equal(buildRollPlan(state).postRollChoices.length, 0);
});

test("cleanup includes only limited effects that were actually used", () => {
  const state = setup("attack", ["bardic-inspiration", "bless", "guiding-bolt-followup", "sneak-attack"]);
  const plan = buildRollPlan(state);
  const outcome = rolled(plan);
  assert.deepEqual(usedLimitedEffects(plan, outcome).map(effect => effect.id), ["guiding-bolt-followup"]);
  const next = addPostRollModifier(plan, outcome, "bardic-inspiration", [3]);
  assert.deepEqual(new Set(usedLimitedEffects(next.plan, next.outcome).map(effect => effect.id)), new Set(["guiding-bolt-followup", "bardic-inspiration"]));
});

test("Guidance is single use in 2014 and remembered for one chosen skill in 2024", () => {
  const state = setup("skill", ["guidance"]);
  let plan = buildRollPlan(state);
  assert.equal(usedLimitedEffects(plan, rolled(plan))[0].id, "guidance");
  state.ruleset = "2024";
  state.effectConfig.guidance = { skill: "stealth" };
  assert.equal(buildRollPlan(state).effects.length, 0);
  state.roll.selectedSkill = "stealth";
  plan = buildRollPlan(state);
  assert.equal(plan.dice.length, 2);
  assert.equal(usedLimitedEffects(plan, rolled(plan)).length, 0);
  state.roll.selectedSkill = "initiative";
  assert.equal(buildRollPlan(state).effects.length, 0);
});

test("2024 Resistance reduces only its configured damage type, without critical doubling", () => {
  const state = setup("damage", ["resistance-spell-2024", "flame-tongue"], "2024");
  state.effectConfig["resistance-spell-2024"] = { damageType: "Fire" };
  state.roll.critical = true;
  const plan = buildRollPlan(state);
  assert.equal(plan.dice.filter(die => die.source === "resistance-spell-2024").length, 1);
  const outcome = rolled(plan, [4]);
  assert.equal(outcome.damageBreakdown.find(part => part.damageType === "Fire").total, 12);
  assert.equal(outcome.damageBreakdown.find(part => part.damageType === "Slashing").total, 8);
  state.roll.context = "save";
  assert.equal(buildRollPlan(state).effects.length, 0);
});

test("reroll cleanup spends only the selected resource and preserves post-roll additions", () => {
  const state = setup("save", ["heroic-inspiration-2024", "indomitable-2024", "bardic-inspiration"], "2024");
  const plan = buildRollPlan(state);
  let next = addPostRollModifier(plan, rolled(plan), "bardic-inspiration", [3]);
  next.outcome = rerollOutcome(next.plan, next.outcome, 0, "heroic-inspiration-2024");
  assert.deepEqual(next.outcome.rerollEffectsUsed, ["heroic-inspiration-2024"]);
  assert.deepEqual(next.outcome.postRollUsed, ["bardic-inspiration"]);
  assert.equal(next.outcome.rerollBonus, 0);
  assert.equal(next.outcome.total, next.outcome.d20Value + 3 + plan.flat);
  assert.ok(!usedLimitedEffects(next.plan, next.outcome).some(effect => effect.id === "indomitable-2024"));
});

test("target drawer shows only applicable choices for attack and damage", () => {
  const state = setup("attack");
  const attack = renderModifierPopover(state, "target");
  assert.match(attack, /half cover/);
  assert.doesNotMatch(attack, /Target vulnerable/);
  state.roll.context = "damage";
  const damage = renderModifierPopover(state, "target");
  assert.match(damage, /Target vulnerable/);
  assert.doesNotMatch(damage, /half cover/);
  assert.match(damage, /data-config-effect="target-vulnerable"/);
  assert.match(renderRollSubrail(state), /data-modifier-category="target"/);
});

test("new-item forms accept the null passed by add buttons", () => {
  assert.match(weaponForm(null), /weaponForm/);
  assert.match(spellForm(null), /spellForm/);
  assert.match(effectForm(null), /effectForm/);
});

test("custom one-use modifiers are removed from both remembered selections", () => {
  const state = setup("attack", ["one", "bless"]);
  state.activeEffects = ["one", "bane"];
  state.customEffects = [{ id: "one", name: "One use", rulesets: ["all"], usage: "single", entries: [{ contexts: ["attack"], kind: "die", notation: "1d4" }] }];
  const plan = buildRollPlan(state);
  assert.equal(usedLimitedEffects(plan, rolled(plan))[0].id, "one");
  removeEffects(state, ["one"]);
  assert.deepEqual(state.activeEffects, ["bane"]);
  assert.deepEqual(state.roll.selectedEffects, ["bless"]);
});

test("every catalog and imported feature has a usage classification", () => {
  for (const ruleset of ["2014", "2024"]) {
    const state = setup("damage", [], ruleset);
    state.character.imported = true;
    state.character.classes = [{ name: "Paladin", level: 11 }, { name: "Rogue", level: 3 }];
    state.character.featureNames = ["Psychic Blades", "Giant's Might", "Colossus Slayer"];
    for (const effect of effectCatalog(state)) assert.ok(["single", "turn", "persistent"].includes(effect.usage), effect.id);
    if (ruleset === "2014") assert.equal(effectCatalog(state).find(effect => effect.id === "divine-smite").usage, "single");
  }
});
