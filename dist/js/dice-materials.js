const SOLIDS = [
  solid("amber", "Amber", "#d99a35", "#fff7e6", "Warm golden resin"),
  solid("crimson", "Crimson", "#b83246", "#fff4f4", "Deep red lacquer"),
  solid("sapphire", "Sapphire", "#2368b5", "#f4f9ff", "Clear royal blue"),
  solid("emerald", "Emerald", "#25835b", "#f2fff8", "Rich green enamel"),
  solid("amethyst", "Amethyst", "#7853a6", "#fff7ff", "Saturated violet"),
  solid("obsidian", "Obsidian", "#202733", "#ffffff", "Polished near-black"),
  solid("ivory", "Ivory", "#e4d8ba", "#261e15", "Aged pale ivory"),
  solid("rose", "Rose Quartz", "#c9788f", "#fff8fa", "Muted crystalline pink")
];

const TEXTURES = [
  texture("dragon-scale", "Dragon Scale", "#356f58", "#eaffd9", "scale", "shimmer", "Layered emerald scales"),
  texture("starfield", "Starfield", "#18255a", "#ffffff", "stars", "comet", "A night sky with bright stars"),
  texture("molten-core", "Molten Core", "#6e2117", "#fff0bf", "molten", "embers", "Black stone split by lava"),
  texture("frost-crystal", "Frost Crystal", "#8ec9d8", "#102a36", "frost", "snow", "Clouded ice and frozen veins"),
  texture("stormglass", "Stormglass", "#334a72", "#f4fbff", "storm", "lightning", "Blue glass holding a storm"),
  texture("ancient-bone", "Ancient Bone", "#c5ad7c", "#2d2418", "bone", null, "Weathered bone and dark pores"),
  texture("burled-wood", "Burled Wood", "#7c4d2b", "#fff0cf", "wood", null, "Warm wood grain and knots"),
  texture("moon-marble", "Moon Marble", "#a9adb4", "#171b22", "marble", null, "Pale stone with charcoal veins"),
  texture("verdigris", "Verdigris", "#3e8278", "#effffb", "verdigris", null, "Oxidized bronze patina"),
  texture("runestone", "Runestone", "#5d5966", "#fff4cf", "runes", "glyphs", "Dark stone scored with gold runes")
];

export const DICE_MATERIALS = Object.freeze([...SOLIDS, ...TEXTURES]);

export function materialById(id) {
  return DICE_MATERIALS.find(material => material.id === id) || SOLIDS[0];
}

export function paintFace(ctx, material, polygon, light, seed, now) {
  const bounds = polygonBounds(polygon);
  const gradient = ctx.createLinearGradient(bounds.left, bounds.top, bounds.right, bounds.bottom);
  gradient.addColorStop(0, shade(material.color, light * 1.18));
  gradient.addColorStop(1, shade(material.color, light * .76));
  ctx.fillStyle = gradient;
  ctx.fill();
  if (!material.pattern) return;
  ctx.save();
  ctx.clip();
  ctx.shadowColor = "transparent";
  drawPattern(ctx, material.pattern, bounds, seed, now);
  ctx.restore();
}

export function labelPalette(material) {
  const value = parseInt(material.ink.slice(1), 16);
  const luminance = (value >> 16) * .299 + (value >> 8 & 255) * .587 + (value & 255) * .114;
  return { fill: material.ink, stroke: luminance > 145 ? "rgba(7,12,18,.76)" : "rgba(255,255,255,.62)" };
}

export function createDiceAppearanceController({ getState, tray, save, openModal, toast }) {
  const sync = () => {
    const state = getState();
    state.diceAppearance ||= { material: "amber" };
    const material = materialById(state.diceAppearance.material);
    tray.setAppearance(material.id);
    const button = document.querySelector("#appearanceButton");
    if (button) button.title = `Dice appearance: ${material.name}`;
  };
  const show = () => openModal("Dice appearance", appearanceMarkup(getState().diceAppearance?.material), '<button class="modal-button primary" type="button" data-close-modal>Done</button>');
  document.addEventListener("click", event => {
    if (event.target.closest("#appearanceButton")) { show(); return; }
    const choice = event.target.closest("[data-dice-material]");
    if (!choice) return;
    const state = getState();
    state.diceAppearance = { material: materialById(choice.dataset.diceMaterial).id };
    sync();
    save();
    document.querySelector("#modalBody").innerHTML = appearanceMarkup(state.diceAppearance.material);
    toast(`${materialById(state.diceAppearance.material).name} dice selected`);
  });
  sync();
}

export function appearanceMarkup(selectedId = "amber") {
  return `<p class="field-note appearance-note">Choose one finish for every die. Animated effects play only while the dice are moving and respect reduced-motion settings.</p>
    ${materialSection("Solid colors", SOLIDS, selectedId)}
    ${materialSection("Textured dice", TEXTURES, selectedId)}`;
}

function materialSection(title, materials, selectedId) {
  return `<section class="material-section"><h3>${title}</h3><div class="material-grid">${materials.map(material => {
    const effect = material.effect ? `<small class="effect-label">Roll effect · ${effectName(material.effect)}</small>` : "";
    return `<button class="material-option ${material.id === selectedId ? "is-selected" : ""}" type="button" data-dice-material="${material.id}" aria-pressed="${material.id === selectedId}"><span class="material-swatch pattern-${material.pattern || "solid"}" style="--swatch:${material.color}" aria-hidden="true"></span><span><strong>${material.name}</strong><small>${material.description}</small>${effect}</span></button>`;
  }).join("")}</div></section>`;
}

function drawPattern(ctx, pattern, bounds, seed, now) {
  const random = seeded(seed);
  if (pattern === "scale") return scales(ctx, bounds);
  if (pattern === "stars") return dots(ctx, bounds, random, 16, "rgba(255,255,255,.8)", 1.7);
  if (pattern === "molten") return cracks(ctx, bounds, random, "rgba(255,142,42,.82)");
  if (pattern === "frost") return cracks(ctx, bounds, random, "rgba(239,255,255,.66)");
  if (pattern === "storm") return cracks(ctx, bounds, random, `rgba(197,228,255,${.38 + Math.sin(now / 120) * .16})`);
  if (pattern === "bone") return dots(ctx, bounds, random, 11, "rgba(54,40,25,.28)", 2.6);
  if (pattern === "wood") return rings(ctx, bounds);
  if (pattern === "marble") return veins(ctx, bounds, random);
  if (pattern === "verdigris") return dots(ctx, bounds, random, 13, "rgba(190,128,55,.35)", 5);
  if (pattern === "runes") return runes(ctx, bounds, random);
}

function scales(ctx, bounds) {
  ctx.strokeStyle = "rgba(225,255,221,.25)"; ctx.lineWidth = 1.3;
  for (let y = bounds.top - 8; y < bounds.bottom + 12; y += 10) for (let x = bounds.left - 8; x < bounds.right + 12; x += 12) {
    ctx.beginPath(); ctx.arc(x + ((y / 10) % 2) * 6, y, 7, 0, Math.PI); ctx.stroke();
  }
}

function dots(ctx, bounds, random, count, color, radius) {
  ctx.fillStyle = color;
  for (let index = 0; index < count; index += 1) { ctx.beginPath(); ctx.arc(mix(bounds.left, bounds.right, random()), mix(bounds.top, bounds.bottom, random()), radius * (.35 + random()), 0, Math.PI * 2); ctx.fill(); }
}

function cracks(ctx, bounds, random, color) {
  ctx.strokeStyle = color; ctx.lineWidth = 1.25;
  for (let line = 0; line < 4; line += 1) { ctx.beginPath(); ctx.moveTo(mix(bounds.left, bounds.right, random()), bounds.top); for (let step = 1; step <= 4; step += 1) ctx.lineTo(mix(bounds.left, bounds.right, random()), mix(bounds.top, bounds.bottom, step / 4)); ctx.stroke(); }
}

function rings(ctx, bounds) {
  ctx.strokeStyle = "rgba(255,218,163,.2)"; ctx.lineWidth = 1.4;
  for (let radius = 7; radius < bounds.width * .8; radius += 8) { ctx.beginPath(); ctx.ellipse(bounds.left + bounds.width * .56, bounds.top + bounds.height * .47, radius, radius * .52, -.25, 0, Math.PI * 2); ctx.stroke(); }
}

function veins(ctx, bounds, random) {
  ctx.strokeStyle = "rgba(42,47,57,.38)"; ctx.lineWidth = 1.2;
  for (let line = 0; line < 3; line += 1) { ctx.beginPath(); ctx.moveTo(bounds.left, mix(bounds.top, bounds.bottom, random())); for (let step = 1; step <= 5; step += 1) ctx.lineTo(mix(bounds.left, bounds.right, step / 5), mix(bounds.top, bounds.bottom, random())); ctx.stroke(); }
}

function runes(ctx, bounds, random) {
  ctx.strokeStyle = "rgba(255,218,127,.48)"; ctx.lineWidth = 1.2;
  for (let index = 0; index < 5; index += 1) { const x = mix(bounds.left, bounds.right, random()), y = mix(bounds.top, bounds.bottom, random()); ctx.beginPath(); ctx.moveTo(x - 3, y + 4); ctx.lineTo(x, y - 5); ctx.lineTo(x + 3, y + 4); ctx.moveTo(x - 2, y); ctx.lineTo(x + 2, y); ctx.stroke(); }
}

function solid(id, name, color, ink, description) { return Object.freeze({ id, name, color, ink, description, kind: "solid", pattern: null, effect: null }); }
function texture(id, name, color, ink, pattern, effect, description) { return Object.freeze({ id, name, color, ink, description, kind: "texture", pattern, effect }); }
function effectName(effect) { return ({ shimmer: "scale shimmer", comet: "star trail", embers: "flying embers", snow: "ice motes", lightning: "lightning arcs", glyphs: "orbiting glyphs" })[effect] || effect; }
function polygonBounds(points) { const xs = points.map(point => point[0]), ys = points.map(point => point[1]); const left = Math.min(...xs), right = Math.max(...xs), top = Math.min(...ys), bottom = Math.max(...ys); return { left, right, top, bottom, width: right - left, height: bottom - top }; }
function shade(hex, amount) { const value = parseInt(hex.slice(1), 16); const channels = [value >> 16, value >> 8 & 255, value & 255].map(channel => Math.round(clamp(channel * amount, 0, 255))); return `rgb(${channels.join(",")})`; }
function seeded(seed) { let value = Math.abs(Math.floor(seed * 9973)) || 1; return () => { value = value * 16807 % 2147483647; return (value - 1) / 2147483646; }; }
function mix(a, b, amount) { return a + (b - a) * amount; }
function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
