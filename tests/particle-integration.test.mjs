import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const root = new URL("../", import.meta.url);

test("vendored Proton browser bundle exposes the required particle API", () => {
  const source = readFileSync(new URL("dist/vendor/proton.web.min.js", root), "utf8");
  const context = vm.createContext({});
  vm.runInContext(source, context);
  assert.equal(typeof context.Proton, "function");
  ["Emitter", "Rate", "Span", "Life", "Velocity", "Color", "Alpha", "Scale", "RandomDrift", "Gravity", "Cyclone", "Rotate", "CustomRenderer"].forEach(name => {
    assert.equal(typeof context.Proton[name], "function", `missing Proton.${name}`);
  });
});

test("particle layer and local engine load before the dice application", () => {
  const html = readFileSync(new URL("dist/index.html", root), "utf8");
  assert.match(html, /id="diceEffectsCanvas"[^>]*aria-hidden="true"/);
  assert.ok(html.indexOf("proton.web.min.js") < html.indexOf('type="module" src=".\/js\/app.js'));
});

test("legacy frame-by-frame effect drawing is no longer part of the material renderer", () => {
  const materials = readFileSync(new URL("dist/js/dice-materials.js", root), "utf8");
  assert.doesNotMatch(materials, /drawRollEffect|drawParticles|drawLightning|drawShimmer|drawGlyphs/);
});
