import test from "node:test";
import assert from "node:assert/strict";
import { diceBoxNotation } from "../dist/js/dice-notation.js";

test("Dice Box notation preserves die order and predetermined results", () => {
  assert.equal(diceBoxNotation([
    { sides: 20, value: 17 },
    { sides: 6, value: 4 },
    { sides: 6, value: 2 }
  ]), "1d20+1d6+1d6@17,4,2");
});

test("unsupported polyhedra fall back without invalid notation", () => {
  assert.equal(diceBoxNotation([{ sides: 3, value: 2 }]), null);
  assert.equal(diceBoxNotation([]), null);
});
