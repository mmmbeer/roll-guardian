import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { DICE_MATERIALS } from "../dist/js/dice-materials.js";

const root = new URL("../", import.meta.url);

test("distribution contains the bundled WebGL dice and GPU particle runtime", () => {
  const source = readFileSync(new URL("dist/vendor/dice-runtime.js", root), "utf8");
  assert.ok(source.length > 100_000);
  assert.doesNotMatch(source, /from\s+["'](?:three|three-nebula|@3d-dice)/);
  assert.match(source, /GPURenderer|MobileGPURenderer/);
});

test("particles render in the Dice Box scene without a cosmetic overlay canvas", () => {
  const html = readFileSync(new URL("dist/index.html", root), "utf8");
  const particles = readFileSync(new URL("dist/js/dice-particles.js", root), "utf8");
  assert.match(html, /<div id="diceCanvas"[^>]*role="img"/);
  assert.doesNotMatch(html, /diceEffectsCanvas|proton\.web/);
  assert.match(particles, /new GPURenderer\(this\.box\.scene/);
  assert.match(particles, /followedDie\?\.body\?\.position/);
});

test("every textured finish ships the real texture used by its preview", () => {
  DICE_MATERIALS.filter(material => material.previewAsset).forEach(material => {
    assert.ok(existsSync(new URL(`dist/assets/dice/textures/${material.previewAsset}`, root)), material.previewAsset);
  });
});

test("legacy frame-by-frame material painting is gone", () => {
  const materials = readFileSync(new URL("dist/js/dice-materials.js", root), "utf8");
  assert.doesNotMatch(materials, /paintFace|drawPattern|drawLightning|drawParticles/);
});
