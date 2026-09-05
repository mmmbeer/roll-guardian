import { ABILITIES, SKILLS } from "./rules-data.js?v=1.3.0";

const STORAGE_KEY = "whatDoIRoll.v1";

function defaultCharacter() {
  return {
    name: "My character",
    level: 5,
    imported: false,
    classes: [],
    featureNames: [],
    proficiencyBonus: 3,
    spellAbility: "wis",
    spellAttackBonus: null,
    spellSaveDC: null,
    maxSpellLevel: null,
    abilities: Object.fromEntries(ABILITIES.map(a => [a.key, 10])),
    saves: { str: 0, dex: 0, con: 0, int: 0, wis: 1, cha: 0 },
    skills: Object.fromEntries(SKILLS.map(s => [s.key, s.key === "perception" ? 1 : 0])),
    weapons: [
      { id: uid(), name: "Longsword", ability: "str", proficient: true, attackBonus: null, damage: "1d8", damageAbility: true, damageBonus: 0, damageType: "Slashing", properties: "Versatile (1d10)" },
      { id: uid(), name: "Shortbow", ability: "dex", proficient: true, attackBonus: null, damage: "1d6", damageAbility: true, damageBonus: 0, damageType: "Piercing", properties: "Ammunition, Two-Handed" }
    ],
    spells: [],
    items: []
  };
}

export function createDefaultState() {
  return {
    ruleset: "2024",
    view: "roll",
    character: defaultCharacter(),
    activeEffects: [],
    customEffects: [],
    effectConfig: {},
    sound: true,
    diceAppearance: { material: "amber" },
    roll: {
      context: "attack",
      modeOverride: null,
      selectedWeaponId: null,
      attackMode: "auto",
      selectedSpellId: null,
      spellPhase: "damage",
      spellSlotLevel: 1,
      spellDamageIndex: 0,
      selectedSkill: "perception",
      selectedSave: "wis",
      targetName: "",
      targetAC: "",
      critical: false,
      customNotation: "1d20",
      customLabel: "Custom roll",
      selectedEffects: []
    },
    history: []
  };
}

export function loadState() {
  const base = createDefaultState();
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    if (!saved || typeof saved !== "object") return seedSelections(base);
    const state = {
      ...base,
      ...saved,
      character: { ...base.character, ...(saved.character || {}) },
      roll: { ...base.roll, ...(saved.roll || {}) }
    };
    return seedSelections(state);
  } catch {
    return seedSelections(base);
  }
}

export function saveState(state) {
  const compact = { ...state, history: (state.history || []).slice(0, 60) };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(compact));
}

export function uid() {
  if (globalThis.crypto?.randomUUID) return crypto.randomUUID();
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

export function abilityModifier(score) {
  return Math.floor((Number(score || 10) - 10) / 2);
}

export function proficiencyForLevel(level) {
  return 2 + Math.floor((Math.max(1, Number(level || 1)) - 1) / 4);
}

function seedSelections(state) {
  if (!Array.isArray(state.character.classes)) state.character.classes = [];
  if (!Array.isArray(state.character.featureNames)) state.character.featureNames = [];
  if (!Array.isArray(state.character.spells)) state.character.spells = [];
  if (!state.roll.selectedWeaponId || !state.character.weapons.some(w => w.id === state.roll.selectedWeaponId)) {
    state.roll.selectedWeaponId = state.character.weapons[0]?.id || null;
  }
  if (!Array.isArray(state.roll.selectedEffects)) state.roll.selectedEffects = [];
  if (!Array.isArray(state.activeEffects)) state.activeEffects = [];
  if (!Array.isArray(state.customEffects)) state.customEffects = [];
  if (!Array.isArray(state.history)) state.history = [];
  if (!Number.isInteger(Number(state.roll.spellDamageIndex))) state.roll.spellDamageIndex = 0;
  return state;
}
