export const ABILITIES = [
  { key: "str", label: "Strength", short: "STR" },
  { key: "dex", label: "Dexterity", short: "DEX" },
  { key: "con", label: "Constitution", short: "CON" },
  { key: "int", label: "Intelligence", short: "INT" },
  { key: "wis", label: "Wisdom", short: "WIS" },
  { key: "cha", label: "Charisma", short: "CHA" }
];

export const SKILLS = [
  ["acrobatics", "Acrobatics", "dex"], ["animal-handling", "Animal Handling", "wis"],
  ["arcana", "Arcana", "int"], ["athletics", "Athletics", "str"],
  ["deception", "Deception", "cha"], ["history", "History", "int"],
  ["insight", "Insight", "wis"], ["intimidation", "Intimidation", "cha"],
  ["investigation", "Investigation", "int"], ["medicine", "Medicine", "wis"],
  ["nature", "Nature", "int"], ["perception", "Perception", "wis"],
  ["performance", "Performance", "cha"], ["persuasion", "Persuasion", "cha"],
  ["religion", "Religion", "int"], ["sleight-of-hand", "Sleight of Hand", "dex"],
  ["stealth", "Stealth", "dex"], ["survival", "Survival", "wis"]
].map(([key, label, ability]) => ({ key, label, ability }));

export const CHECKS = [
  { key: "initiative", label: "Initiative", ability: "dex", special: true },
  ...SKILLS,
  ...ABILITIES.map(ability => ({ key: `ability-${ability.key}`, label: `${ability.label} check`, ability: ability.key, special: true }))
];

export const DAMAGE_TYPES = [
  "Acid", "Bludgeoning", "Cold", "Fire", "Force", "Lightning", "Necrotic",
  "Piercing", "Poison", "Psychic", "Radiant", "Slashing", "Thunder"
];

export const WEAPON_LIBRARY = [
  ["Club", "str", "1d4", "Bludgeoning", "Light"],
  ["Dagger", "dex", "1d4", "Piercing", "Finesse, Light, Thrown"],
  ["Greatclub", "str", "1d8", "Bludgeoning", "Two-Handed"],
  ["Handaxe", "str", "1d6", "Slashing", "Light, Thrown"],
  ["Javelin", "str", "1d6", "Piercing", "Thrown"],
  ["Light Hammer", "str", "1d4", "Bludgeoning", "Light, Thrown"],
  ["Mace", "str", "1d6", "Bludgeoning", "—"],
  ["Quarterstaff", "str", "1d6", "Bludgeoning", "Versatile (1d8)"],
  ["Spear", "str", "1d6", "Piercing", "Thrown, Versatile (1d8)"],
  ["Light Crossbow", "dex", "1d8", "Piercing", "Ammunition, Loading, Two-Handed"],
  ["Shortbow", "dex", "1d6", "Piercing", "Ammunition, Two-Handed"],
  ["Battleaxe", "str", "1d8", "Slashing", "Versatile (1d10)"],
  ["Glaive", "str", "1d10", "Slashing", "Heavy, Reach, Two-Handed"],
  ["Greatsword", "str", "2d6", "Slashing", "Heavy, Two-Handed"],
  ["Longbow", "dex", "1d8", "Piercing", "Ammunition, Heavy, Two-Handed"],
  ["Longsword", "str", "1d8", "Slashing", "Versatile (1d10)"],
  ["Rapier", "dex", "1d8", "Piercing", "Finesse"],
  ["Scimitar", "dex", "1d6", "Slashing", "Finesse, Light"],
  ["Shortsword", "dex", "1d6", "Piercing", "Finesse, Light"],
  ["Warhammer", "str", "1d8", "Bludgeoning", "Versatile (1d10)"],
  ["Heavy Crossbow", "dex", "1d10", "Piercing", "Ammunition, Heavy, Loading, Two-Handed"]
].map(([name, ability, damage, damageType, properties]) => ({ name, ability, damage, damageType, properties }));

import { CORE_EFFECTS } from "./modifier-data-core.js?v=1.3.0";
import { COMBAT_EFFECTS, FEATURE_EFFECTS, SUPPORT_EFFECTS } from "./modifier-data-options.js?v=1.3.0";

export const EFFECT_PRESETS = [...CORE_EFFECTS, ...SUPPORT_EFFECTS, ...COMBAT_EFFECTS, ...FEATURE_EFFECTS];

export function effectsForRuleset(ruleset) {
  return EFFECT_PRESETS.filter(effect => effect.rulesets.includes(String(ruleset)));
}
