import assert from "node:assert/strict";
import test from "node:test";
import { importCharacterJson } from "../dist/js/importer.js";
import { buildRollPlan, executeRoll, parseNotation, rollDie } from "../dist/js/roll-engine.js";
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

test("imports common D&D Beyond JSON structures", () => {
  const imported = importCharacterJson({ data: {
    name: "Mira", classes: [{ level: 7 }], stats: [
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
});
