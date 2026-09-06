import { DiceBox } from "../vendor/dice-runtime.js";
import { diceBoxNotation } from "./dice-notation.js?v=1.6.0";
import { diceTheme, materialById } from "./dice-materials.js?v=1.6.0";
import { createDiceParticleSystem } from "./dice-particles.js?v=1.6.0";

export function createDiceTray(container) {
  let running = false;
  let destroyed = false;
  let appearance = materialById("amber");
  let particles = null;
  let themeWork = Promise.resolve();
  const assetPath = new URL("./assets/dice/", document.baseURI).href;
  const box = new DiceBox("#diceCanvas", {
    assetPath,
    framerate: 1 / 60,
    sounds: false,
    shadows: true,
    theme_surface: "green-felt",
    theme_customColorset: diceTheme(appearance),
    theme_colorset: "custom",
    theme_texture: appearance.texture,
    theme_material: appearance.surface,
    gravity_multiplier: 320,
    light_intensity: .86,
    baseScale: 60,
    strength: 1.9
  });
  box.resizeWorld = () => {};

  const ready = box.initialize().then(() => {
    if (destroyed) return;
    particles = createDiceParticleSystem(box);
    container.dataset.renderer = "webgl";
    resize();
  }).catch(error => {
    container.dataset.renderer = "unavailable";
    console.error("WebGL dice renderer could not initialize", error);
  });

  async function roll(results, options = {}) {
    if (running) return 0;
    running = true;
    await ready;
    await themeWork;
    const notation = diceBoxNotation(results);
    if (!notation || !box.initialized || destroyed) return finishFallback(options);
    try {
      const rollPromise = box.roll(notation);
      markUnusedDice(box.diceList, results, options.usedResults);
      particles?.begin(appearance.effect, results.length);
      await rollPromise;
      particles?.finish();
      running = false;
      options.onDone?.();
      return 0;
    } catch (error) {
      console.error("Dice roll animation failed", error);
      particles?.finish();
      return finishFallback(options);
    }
  }

  function resize() {
    if (!box.initialized || destroyed) return;
    const rect = container.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) box.setDimensions({ x: rect.width / 2, y: rect.height / 2 });
  }

  function setAppearance(materialId) {
    appearance = materialById(materialId);
    themeWork = themeWork.then(async () => {
      await ready;
      if (!box.initialized || destroyed) return;
      box.theme_customColorset = diceTheme(appearance);
      box.theme_texture = appearance.texture;
      box.theme_material = appearance.surface;
      box.DiceFactory.materials_cache = {};
      await box.loadTheme({ colorset: "custom", texture: appearance.texture, material: appearance.surface });
    }).catch(error => console.error("Dice material could not be loaded", error));
  }

  function destroy() {
    destroyed = true;
    running = false;
    resizeObserver.disconnect();
    particles?.destroy();
    if (box.initialized) {
      box.running = false;
      box.clearDice();
      box.renderer?.dispose();
      box.renderer?.domElement?.remove();
    }
  }

  function finishFallback(options) {
    running = false;
    requestAnimationFrame(() => options.onDone?.());
    return 0;
  }

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(container);
  return { roll, resize, destroy, setAppearance, get running() { return running; } };
}

function markUnusedDice(diceList, results, usedResults = results) {
  diceList.forEach((die, index) => {
    if (usedResults?.includes(results[index])) return;
    const materials = Array.isArray(die.material) ? die.material : [die.material];
    die.material = materials.map(material => {
      const faded = material.clone();
      faded.transparent = true;
      faded.opacity = .3;
      return faded;
    });
  });
}

export function playDiceSound(enabled = true) {
  if (!enabled || !globalThis.AudioContext && !globalThis.webkitAudioContext) return;
  const Audio = globalThis.AudioContext || globalThis.webkitAudioContext;
  const audio = new Audio();
  const now = audio.currentTime;
  [0, .08, .17, .29].forEach((delay, index) => {
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(115 + index * 42, now + delay);
    gain.gain.setValueAtTime(.0001, now + delay);
    gain.gain.exponentialRampToValueAtTime(.035, now + delay + .006);
    gain.gain.exponentialRampToValueAtTime(.0001, now + delay + .055);
    osc.connect(gain).connect(audio.destination);
    osc.start(now + delay);
    osc.stop(now + delay + .065);
  });
  setTimeout(() => audio.close(), 600);
}
