import assert from "node:assert/strict";
import test from "node:test";
import { importCharacterJson } from "../dist/js/importer.js";
import { characterFeatureEffects } from "../dist/js/character-features.js";
import { DICE_SHAPES, faceIndexForValue, labelForFace } from "../dist/js/dice-shapes.js";
import { buildRollPlan, executeRoll, parseNotation, rollDie } from "../dist/js/roll-engine.js";
import { EFFECT_PRESETS } from "../dist/js/rules-data.js";
import { availableSpells, spellDamage, spellsForRuleset } from "../dist/js/spell-data.js";
import { createDefaultState } from "../dist/js/state.js";

test("parses mixed dice and flat modifiers", () => {
  assert.deepEqual(parseNotation("2d6 + 1d4 - 3"), {
    dice: [{ sides: 6, sign: 1 }, { sides: 6, sign: 1 }, { sides: 4, sign: 1 }],
    flat: -3
  });
});

test("advantage and disadvantage sources cancel", () => {
  const state = createDefaultState();
  state.activeEffects = ["target-restrained", "poisoned"];
  const plan = buildRollPlan(state);
  assert.equal(plan.mode, "normal");
  assert.equal(plan.dice.filter(die => die.d20).length, 1);
});

test("2014 power attack changes both attack and damage", () => {
  const state = createDefaultState();
  state.ruleset = "2014";
  state.character.weapons[0].properties = "Heavy, Two-Handed";
  state.activeEffects = ["great-weapon-master-2014"];
  assert.equal(buildRollPlan(state).flat, -2);
  state.roll.context = "damage";
  assert.equal(buildRollPlan(state).flat, 10);
});

test("critical damage doubles weapon and rider dice", () => {
  const state = createDefaultState();
  state.roll.context = "damage";
  state.roll.critical = true;
  state.activeEffects = ["hunters-mark", "sneak-attack"];
  const plan = buildRollPlan(state);
  assert.deepEqual(plan.dice.map(die => die.sides), [8, 6, 6, 6, 6, 8, 6, 6, 6, 6]);
});

test("cover changes target AC without changing the roll modifier", () => {
  const state = createDefaultState();
  state.roll.targetAC = "15";
  state.activeEffects = ["half-cover"];
  const plan = buildRollPlan(state);
  assert.equal(plan.effectiveAC, 17);
  assert.equal(plan.flat, 3);
});

test("rolled faces always drive the final total", () => {
  const state = createDefaultState();
  state.activeEffects = ["bless"];
  const plan = buildRollPlan(state);
  const outcome = executeRoll(plan);
  const expected = outcome.usedResults.reduce((total, die) => total + die.value * die.sign, 0) + plan.flat;
  assert.equal(outcome.total, expected);
});

test("secure die results stay within bounds", () => {
  for (const sides of [4, 6, 8, 10, 12, 20, 100]) {
    for (let i = 0; i < 100; i += 1) {
      const value = rollDie(sides);
      assert.ok(value >= 1 && value <= sides);
    }
  }
});

test("uses the correct numbered polyhedron for each standard die", () => {
  for (const sides of [4, 6, 8, 10, 12, 20]) {
    const shape = DICE_SHAPES[sides];
    assert.equal(shape.faces.length, sides);
    assert.deepEqual([...shape.values].sort((a,b) => a-b), Array.from({ length: sides }, (_,index) => index+1));
    for (let value = 1; value <= sides; value += 1) {
      const faceIndex = faceIndexForValue(shape, sides, value);
      assert.equal(labelForFace(shape, sides, faceIndex, value, faceIndex), String(value));
    }
  }
});

test("imports common D&D Beyond JSON structures", () => {
  const imported = importCharacterJson({ data: {
    name: "Mira", classes: [{ level: 7, definition: { name: "Rogue" }, classFeatures: [{ definition: { name: "Sneak Attack" } }] }], stats: [
      { id: 1, value: 8 }, { id: 2, value: 18 }, { id: 3, value: 14 },
      { id: 4, value: 12 }, { id: 5, value: 13 }, { id: 6, value: 10 }
    ],
    inventory: [{ definition: { name: "Rapier", filterType: "Weapon", damage: { diceString: "1d8", damageType: "Piercing" }, properties: [{ name: "Finesse" }] } }],
    spells: [{ definition: { name: "Fire Bolt", requiresAttackRoll: true, damage: "2d10" } }]
  }});
  assert.equal(imported.character.name, "Mira");
  assert.equal(imported.character.level, 7);
  assert.equal(imported.character.abilities.dex, 18);
  assert.equal(imported.character.weapons[0].name, "Rapier");
  assert.equal(imported.character.spells[0].name, "Fire Bolt");
  assert.deepEqual(imported.character.classes, [{ name: "Rogue", level: 7 }]);
  assert.ok(imported.character.featureNames.includes("Sneak Attack"));
  assert.equal(imported.character.spells[0].imported, true);
});

test("builds level-aware roll features for an imported rogue", () => {
  const state = createDefaultState();
  state.character = { ...state.character, imported: true, level: 7, classes: [{ name: "Rogue", level: 7 }], featureNames: [] };
  const sneakAttack = characterFeatureEffects(state.character, "2024").find(feature => feature.id === "sneak-attack");
  assert.equal(sneakAttack.entries[0].notation, "4d6");
  state.roll.context = "damage";
  state.roll.selectedEffects = ["sneak-attack"];
  assert.deepEqual(buildRollPlan(state).dice.map(die => die.sides), [8, 6, 6, 6, 6]);
  state.roll.context = "spell";
  state.roll.selectedSpellId = "srd-2024-fireball";
  state.roll.spellPhase = "damage";
  assert.equal(buildRollPlan(state).effects.some(effect => effect.id === "sneak-attack"), false);
});

test("provides complete rollable SRD spell catalogs", () => {
  assert.ok(spellsForRuleset("2014").length >= 65);
  assert.ok(spellsForRuleset("2024").length >= 100);
  assert.ok(spellsForRuleset("2024").some(spell => spell.name === "Sorcerous Burst"));
  assert.ok(spellsForRuleset("2014").some(spell => spell.name === "Delayed Blast Fireball"));
});

test("sorts imported character spells before the SRD library", () => {
  const state = createDefaultState();
  state.character.spells = [{ id: "known-fireball", name: "Fireball", imported: true }];
  const spells = availableSpells(state);
  assert.equal(spells.known[0].name, "Fireball");
  assert.equal(spells.known[0].known, true);
  assert.equal(spells.library.some(spell => spell.name === "Fireball"), false);
});

test("scales SRD cantrips and common upcast damage", () => {
  const fireBolt = spellsForRuleset("2024").find(spell => spell.name === "Fire Bolt");
  const fireball = spellsForRuleset("2024").find(spell => spell.name === "Fireball");
  assert.equal(spellDamage(fireBolt, 11, 0).notation, "3d10");
  assert.equal(spellDamage(fireball, 8, 5).notation, "8d6 + 1d6 + 1d6");
});

test("switches an SRD spell between its attack and damage rolls", () => {
  const state = createDefaultState();
  const guidingBolt = spellsForRuleset("2024").find(spell => spell.name === "Guiding Bolt");
  state.roll.context = "spell";
  state.roll.selectedSpellId = guidingBolt.id;
  state.roll.spellPhase = "attack";
  assert.equal(buildRollPlan(state).base.attackRoll, true);
  state.roll.spellPhase = "damage";
  const damagePlan = buildRollPlan(state);
  assert.equal(damagePlan.base.damageRoll, true);
  assert.deepEqual(damagePlan.dice.map(die => die.sides), [6, 6, 6, 6]);
});

test("provides broad modifier coverage for both supported rulesets", () => {
  const requiredKinds = ["automaticFailure", "blocked", "criticalDamage", "criticalOnHit", "criticalRange", "d20Floor", "damageThreshold", "dieFloor", "halfProficiency", "ignoreResistance", "missToHit", "rerollChoice", "rerollValues", "rollTwice", "saveDC", "targetAC"];
  const allKinds = new Set(EFFECT_PRESETS.flatMap(effect => effect.entries.map(entry => entry.kind)));
  requiredKinds.forEach(kind => assert.ok(allKinds.has(kind), `catalog is missing ${kind}`));
  for (const ruleset of ["2014", "2024"]) {
    const effects = EFFECT_PRESETS.filter(effect => effect.rulesets.includes(ruleset));
    assert.ok(effects.length >= 120);
    const kinds = new Set(effects.flatMap(effect => effect.entries.filter(entry => !entry.rulesets || entry.rulesets.includes(ruleset)).map(entry => entry.kind)));
    ["mode", "die", "flat", "multiplier", "rerollChoice", "rerollValues", "criticalRange", "saveDC"].forEach(kind => assert.ok(kinds.has(kind), `${ruleset} is missing ${kind}`));
  }
});

test("scopes ability, check, and attack-type modifiers", () => {
  const state = createDefaultState();
  state.roll.context = "skill";
  state.roll.selectedSkill = "stealth";
  state.activeEffects = ["pass-without-trace", "alert-2024"];
  assert.equal(buildRollPlan(state).flat, 10);
  state.roll.selectedSkill = "initiative";
  assert.equal(buildRollPlan(state).flat, state.character.proficiencyBonus);
  state.roll.context = "attack";
  state.roll.selectedWeaponId = state.character.weapons[0].id;
  state.activeEffects = ["archery"];
  assert.equal(buildRollPlan(state).effects.length, 0);
  state.roll.selectedWeaponId = state.character.weapons[1].id;
  assert.equal(buildRollPlan(state).effects[0].id, "archery");
});

test("lets a thrown weapon switch between melee and ranged modifiers", () => {
  const state = createDefaultState();
  state.character.weapons[0].properties = "Finesse, Light, Thrown";
  state.activeEffects = ["long-range"];
  assert.equal(buildRollPlan(state).effects.length, 0);
  state.roll.attackMode = "ranged";
  assert.equal(buildRollPlan(state).mode, "disadvantage");
});

test("supports straight ability checks and death saving throws", () => {
  const state = createDefaultState();
  state.roll.context = "skill";
  state.roll.selectedSkill = "ability-str";
  assert.equal(buildRollPlan(state).base.label, "Strength check");
  state.roll.context = "save";
  state.roll.selectedSave = "death";
  state.activeEffects = ["beacon-of-hope"];
  const plan = buildRollPlan(state);
  assert.equal(plan.base.saveKind, "death");
  assert.equal(plan.mode, "advantage");
});

test("applies reliable talent only to trained checks", () => {
  const state = createDefaultState();
  state.roll.context = "skill";
  state.roll.selectedSkill = "perception";
  state.activeEffects = ["reliable-talent"];
  let plan = buildRollPlan(state);
  let outcome = executeRoll(plan, [{ ...plan.dice[0], value: 3 }]);
  assert.equal(outcome.d20Applied, 10);
  assert.equal(outcome.total, 13);
  state.roll.selectedSkill = "athletics";
  plan = buildRollPlan(state);
  assert.equal(plan.d20Floor, 0);
});

test("applies resistance to only the configured damage type", () => {
  const state = createDefaultState();
  state.roll.context = "damage";
  state.activeEffects = ["hex", "target-resistant"];
  state.effectConfig["target-resistant"] = { damageType: "Necrotic" };
  const plan = buildRollPlan(state);
  const outcome = executeRoll(plan, plan.dice.map((die, index) => ({ ...die, value: index ? 6 : 8 })));
  assert.deepEqual(outcome.damageBreakdown, [
    { damageType: "Slashing", raw: 8, multiplier: 1, total: 8 },
    { damageType: "Necrotic", raw: 6, multiplier: 0.5, total: 3 }
  ]);
  assert.equal(outcome.total, 11);
});

test("rolls Savage Attacker weapon dice twice and keeps the higher set", () => {
  const state = createDefaultState();
  state.roll.context = "damage";
  state.activeEffects = ["savage-attacker-2024"];
  const plan = buildRollPlan(state);
  assert.equal(plan.dice.length, 2);
  const outcome = executeRoll(plan, [{ ...plan.dice[0], value: 2 }, { ...plan.dice[1], value: 7 }]);
  assert.equal(outcome.total, 7);
  assert.equal(outcome.alternateDiscarded, 2);
});

test("applies the 2024 Great Weapon Fighting die minimum", () => {
  const state = createDefaultState();
  state.roll.context = "damage";
  state.activeEffects = ["great-weapon-fighting-2024"];
  const plan = buildRollPlan(state);
  const outcome = executeRoll(plan, [{ ...plan.dice[0], value: 1 }]);
  assert.equal(outcome.usedResults[0].calculatedValue, 3);
  assert.equal(outcome.total, 3);
});

test("does not add d20-only support dice to spell damage", () => {
  const state = createDefaultState();
  state.roll.context = "spell";
  state.roll.selectedSpellId = "srd-2024-fireball";
  state.roll.spellPhase = "damage";
  state.activeEffects = ["bless", "rod-pact-keeper"];
  const plan = buildRollPlan(state);
  assert.equal(plan.effects.some(effect => effect.id === "bless"), false);
  assert.equal(plan.flat, 0);
  assert.equal(plan.saveDC, 12);
});
