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

const common = [
  {
    id: "bless", name: "Bless", group: "Spells & support", rulesets: ["2014", "2024"],
    summary: "Add 1d4 to attack rolls and saving throws while the spell applies.",
    entries: [{ contexts: ["attack", "save"], kind: "die", notation: "1d4", label: "Bless" }]
  },
  {
    id: "guidance", name: "Guidance", group: "Spells & support", rulesets: ["2014", "2024"],
    summary: "Add 1d4 to an eligible ability check.",
    entries: [{ contexts: ["skill"], kind: "die", notation: "1d4", label: "Guidance" }]
  },
  {
    id: "bardic-inspiration", name: "Bardic Inspiration", group: "Spells & support", rulesets: ["2014", "2024"], configurable: "die",
    summary: "Add the inspiration die to an eligible d20 test. Set the die when you activate it.",
    entries: [{ contexts: ["attack", "skill", "save"], kind: "die", notation: "1d8", label: "Bardic Inspiration" }]
  },
  {
    id: "hunters-mark", name: "Hunter’s Mark", group: "Damage riders", rulesets: ["2014", "2024"],
    summary: "Add 1d6 damage when you hit the marked target.",
    entries: [{ contexts: ["damage"], kind: "die", notation: "1d6", label: "Hunter’s Mark" }]
  },
  {
    id: "sneak-attack", name: "Sneak Attack", group: "Damage riders", rulesets: ["2014", "2024"], configurable: "dice",
    summary: "Add your current Sneak Attack dice when its triggering requirements are met.",
    entries: [{ contexts: ["damage"], kind: "die", notation: "3d6", label: "Sneak Attack" }]
  },
  {
    id: "hex", name: "Hex", group: "Damage riders", rulesets: ["2014", "2024"],
    summary: "Add 1d6 necrotic damage when an attack hits the cursed target.",
    entries: [{ contexts: ["damage"], kind: "die", notation: "1d6", label: "Hex" }]
  },
  {
    id: "divine-favor", name: "Divine Favor", group: "Damage riders", rulesets: ["2014", "2024"],
    summary: "Add 1d4 radiant damage to weapon damage rolls while active.",
    entries: [{ contexts: ["damage"], kind: "die", notation: "1d4", label: "Divine Favor" }]
  },
  {
    id: "magic-weapon", name: "Magic weapon bonus", group: "Equipment & styles", rulesets: ["2014", "2024"], configurable: "flat",
    summary: "Add the weapon’s magic bonus to its attack and damage rolls.",
    entries: [
      { contexts: ["attack"], kind: "flat", value: 1, label: "Magic weapon" },
      { contexts: ["damage"], kind: "flat", value: 1, label: "Magic weapon" }
    ]
  },
  {
    id: "archery", name: "Archery fighting style", group: "Equipment & styles", rulesets: ["2014", "2024"],
    summary: "Add +2 to ranged weapon attack rolls.",
    entries: [{ contexts: ["attack"], kind: "flat", value: 2, label: "Archery" }]
  },
  {
    id: "dueling", name: "Dueling fighting style", group: "Equipment & styles", rulesets: ["2014", "2024"],
    summary: "Add +2 to damage when the weapon and hand requirements are met.",
    entries: [{ contexts: ["damage"], kind: "flat", value: 2, label: "Dueling" }]
  },
  {
    id: "poisoned", name: "Poisoned", group: "Your conditions", rulesets: ["2014", "2024"],
    summary: "Disadvantage on attack rolls and ability checks.",
    entries: [{ contexts: ["attack", "skill"], kind: "mode", mode: "disadvantage", label: "Poisoned" }]
  },
  {
    id: "restrained-self", name: "Restrained", group: "Your conditions", rulesets: ["2014", "2024"],
    summary: "Your attack rolls have disadvantage.",
    entries: [{ contexts: ["attack"], kind: "mode", mode: "disadvantage", label: "Restrained" }]
  },
  {
    id: "frightened", name: "Frightened (source visible)", group: "Your conditions", rulesets: ["2014", "2024"],
    summary: "Disadvantage on ability checks and attacks while the source is within line of sight.",
    entries: [{ contexts: ["attack", "skill"], kind: "mode", mode: "disadvantage", label: "Frightened" }]
  },
  {
    id: "blinded-self", name: "Blinded", group: "Your conditions", rulesets: ["2014", "2024"],
    summary: "Your attack rolls have disadvantage.",
    entries: [{ contexts: ["attack"], kind: "mode", mode: "disadvantage", label: "Blinded" }]
  },
  {
    id: "prone-self", name: "Prone", group: "Your conditions", rulesets: ["2014", "2024"],
    summary: "Your attack rolls have disadvantage unless another rule changes the result.",
    entries: [{ contexts: ["attack"], kind: "mode", mode: "disadvantage", label: "Prone" }]
  },
  {
    id: "target-restrained", name: "Target restrained", group: "Target conditions", rulesets: ["2014", "2024"],
    summary: "Attack rolls against the restrained target have advantage.",
    entries: [{ contexts: ["attack"], kind: "mode", mode: "advantage", label: "Target restrained" }]
  },
  {
    id: "target-blinded", name: "Target blinded", group: "Target conditions", rulesets: ["2014", "2024"],
    summary: "Attack rolls against the blinded target have advantage.",
    entries: [{ contexts: ["attack"], kind: "mode", mode: "advantage", label: "Target blinded" }]
  },
  {
    id: "target-prone-near", name: "Target prone (within 5 ft.)", group: "Target conditions", rulesets: ["2014", "2024"],
    summary: "Attacks from within 5 feet have advantage.",
    entries: [{ contexts: ["attack"], kind: "mode", mode: "advantage", label: "Target prone nearby" }]
  },
  {
    id: "target-prone-far", name: "Target prone (farther than 5 ft.)", group: "Target conditions", rulesets: ["2014", "2024"],
    summary: "Attacks from farther than 5 feet have disadvantage.",
    entries: [{ contexts: ["attack"], kind: "mode", mode: "disadvantage", label: "Target prone at range" }]
  },
  {
    id: "half-cover", name: "Target has half cover", group: "Target defenses", rulesets: ["2014", "2024"],
    summary: "The target gains +2 AC against the attack. This changes the target number, not your roll.",
    entries: [{ contexts: ["attack"], kind: "targetAC", value: 2, label: "Half cover" }]
  },
  {
    id: "three-quarter-cover", name: "Target has three-quarters cover", group: "Target defenses", rulesets: ["2014", "2024"],
    summary: "The target gains +5 AC against the attack. This changes the target number, not your roll.",
    entries: [{ contexts: ["attack"], kind: "targetAC", value: 5, label: "Three-quarters cover" }]
  },
  {
    id: "target-vulnerable", name: "Target vulnerable", group: "Target defenses", rulesets: ["2014", "2024"],
    summary: "Double damage of the selected type after the damage roll.",
    entries: [{ contexts: ["damage"], kind: "multiplier", value: 2, label: "Vulnerability" }]
  },
  {
    id: "target-resistant", name: "Target resistant", group: "Target defenses", rulesets: ["2014", "2024"],
    summary: "Halve damage of the selected type after the damage roll, rounding down.",
    entries: [{ contexts: ["damage"], kind: "multiplier", value: 0.5, label: "Resistance" }]
  }
];

const rulesetSpecific = [
  {
    id: "exhaustion-2024", name: "Exhaustion (2024)", group: "Your conditions", rulesets: ["2024"], configurable: "flatNegative",
    summary: "Subtract 2 from d20 tests for each Exhaustion level.",
    entries: [{ contexts: ["attack", "skill", "save", "spell"], kind: "flat", value: -2, label: "Exhaustion" }]
  },
  {
    id: "great-weapon-master-2014", name: "Great Weapon Master power attack", group: "Feats", rulesets: ["2014"],
    summary: "When eligible, take −5 to the attack roll and add +10 to its damage.",
    entries: [
      { contexts: ["attack"], kind: "flat", value: -5, label: "Great Weapon Master" },
      { contexts: ["damage"], kind: "flat", value: 10, label: "Great Weapon Master" }
    ]
  },
  {
    id: "sharpshooter-2014", name: "Sharpshooter power attack", group: "Feats", rulesets: ["2014"],
    summary: "When eligible, take −5 to the attack roll and add +10 to its damage.",
    entries: [
      { contexts: ["attack"], kind: "flat", value: -5, label: "Sharpshooter" },
      { contexts: ["damage"], kind: "flat", value: 10, label: "Sharpshooter" }
    ]
  },
  {
    id: "great-weapon-master-2024", name: "Great Weapon Master damage", group: "Feats", rulesets: ["2024"],
    summary: "When eligible, add your Proficiency Bonus to damage once on each of your turns.",
    entries: [{ contexts: ["damage"], kind: "proficiency", label: "Great Weapon Master" }]
  },
  {
    id: "vex-2024", name: "Vex mastery follow-up", group: "Weapon mastery", rulesets: ["2024"],
    summary: "Apply advantage to the next eligible attack against the target.",
    entries: [{ contexts: ["attack"], kind: "mode", mode: "advantage", label: "Vex" }]
  }
];

export const EFFECT_PRESETS = [...common, ...rulesetSpecific];

export function effectsForRuleset(ruleset) {
  return EFFECT_PRESETS.filter(effect => effect.rulesets.includes(String(ruleset)));
}
