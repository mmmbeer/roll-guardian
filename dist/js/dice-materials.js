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
  texture("dragon-scale", "Dragon Scale", "#356f58", "#eaffd9", "dragon", "dragon.webp", "none", "shimmer", "Layered emerald scales"),
  texture("starfield", "Starfield", "#18255a", "#ffffff", "astral", "astral.webp", "none", "comet", "A night sky with bright stars"),
  texture("molten-core", "Molten Core", "#6e2117", "#fff0bf", "fire", "fire.webp", "metal", "embers", "Black stone split by lava"),
  texture("frost-crystal", "Frost Crystal", "#8ec9d8", "#102a36", "ice", "ice.webp", "glass", "snow", "Clouded ice and frozen veins"),
  texture("stormglass", "Stormglass", "#334a72", "#f4fbff", "cloudy_2", "cloudy.alt.webp", "glass", "lightning", "Blue glass holding a storm"),
  texture("ancient-bone", "Ancient Bone", "#c5ad7c", "#2d2418", "paper", "paper.webp", "wood", null, "Weathered bone and dark pores"),
  texture("burled-wood", "Burled Wood", "#7c4d2b", "#fff0cf", "wood", "wood.webp", "wood", null, "Warm wood grain and knots"),
  texture("moon-marble", "Moon Marble", "#a9adb4", "#171b22", "marble", "marble.webp", "glass", null, "Pale stone with charcoal veins"),
  texture("verdigris", "Verdigris", "#3e8278", "#effffb", "metal", "metal.webp", "metal", null, "Oxidized bronze patina"),
  texture("runestone", "Runestone", "#5d5966", "#fff4cf", "speckles", "speckles.webp", "none", "glyphs", "Dark stone scored with gold runes")
];

export const DICE_MATERIALS = Object.freeze([...SOLIDS, ...TEXTURES]);

export function materialById(id) {
  return DICE_MATERIALS.find(material => material.id === id) || SOLIDS[0];
}

export function diceTheme(materialOrId) {
  const material = typeof materialOrId === "string" ? materialById(materialOrId) : materialOrId;
  return {
    name: `Roll Guardian ${material.name}`,
    foreground: material.ink,
    background: material.color,
    outline: contrastOutline(material.ink),
    texture: material.texture,
    material: material.surface
  };
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
  let selectedId = null;
  const show = () => {
    selectedId = materialById(getState().diceAppearance?.material).id;
    openModal("Dice appearance", appearanceMarkup(selectedId), '<button class="modal-button primary" type="button" data-close-modal data-modal-confirm>Done</button>', {
      onClose: reason => {
        if (reason === "confirm") {
          getState().diceAppearance = { material: selectedId };
          sync();
          save();
          toast(`${materialById(selectedId).name} dice selected`);
        }
        selectedId = null;
      }
    });
  };
  document.addEventListener("click", event => {
    if (event.target.closest("#appearanceButton")) { show(); return; }
    const choice = event.target.closest("[data-dice-material]");
    if (!choice || selectedId === null) return;
    selectedId = materialById(choice.dataset.diceMaterial).id;
    document.querySelectorAll("#modalBody [data-dice-material]").forEach(button => {
      const selected = button.dataset.diceMaterial === selectedId;
      button.classList.toggle("is-selected", selected);
      button.setAttribute("aria-pressed", String(selected));
    });
  });
  sync();
}

export function appearanceMarkup(selectedId = "amber") {
  return `<p class="field-note appearance-note">Choose one finish for every die, then select Done to save. Cancel keeps your current finish. Effects are rendered in the 3D scene only while dice are moving and respect reduced-motion settings.</p>
    ${materialSection("Solid colors", SOLIDS, selectedId)}
    ${materialSection("Textured dice", TEXTURES, selectedId)}`;
}

function materialSection(title, materials, selectedId) {
  return `<section class="material-section"><h3>${title}</h3><div class="material-grid">${materials.map(material => {
    const effect = material.effect ? `<small class="effect-label">Roll effect · ${effectName(material.effect)}</small>` : "";
    return `<button class="material-option ${material.id === selectedId ? "is-selected" : ""}" type="button" data-dice-material="${material.id}" aria-pressed="${material.id === selectedId}"><span class="material-swatch material-${material.id} effect-${material.effect || "none"}" aria-hidden="true"><i>20</i></span><span><strong>${material.name}</strong><small>${material.description}</small>${effect}</span></button>`;
  }).join("")}</div></section>`;
}

function solid(id, name, color, ink, description) {
  return Object.freeze({ id, name, color, ink, description, kind: "solid", texture: "none", previewAsset: null, surface: "plastic", effect: null });
}

function texture(id, name, color, ink, textureName, previewAsset, surface, effect, description) {
  return Object.freeze({ id, name, color, ink, description, kind: "texture", texture: textureName, previewAsset, surface, effect });
}

function contrastOutline(ink) {
  const value = parseInt(ink.slice(1), 16);
  const luminance = (value >> 16) * .299 + (value >> 8 & 255) * .587 + (value & 255) * .114;
  return luminance > 145 ? "#101722" : "#f5f8fb";
}

function effectName(effect) {
  return ({ shimmer: "scale shimmer", comet: "star trail", embers: "flying embers", snow: "ice motes", lightning: "lightning arcs", glyphs: "orbiting glyphs" })[effect] || effect;
}
