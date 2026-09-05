import { abilityModifier } from "./state.js?v=1.3.0";

export function characterFeatureEffects(character, ruleset) {
  if (!character?.imported) return [];
  const features = [];
  const names = new Set((character.featureNames || []).map(normalize));
  const hasNamed = name => [...names].some(value => value.includes(normalize(name)));
  const rogueLevel = classLevel(character, "rogue");
  const barbarianLevel = classLevel(character, "barbarian");
  const bardLevel = classLevel(character, "bard");
  const paladinLevel = classLevel(character, "paladin");

  if (rogueLevel || hasNamed("sneak attack")) {
    const dice = `${Math.max(1, Math.ceil((rogueLevel || character.level || 1) / 2))}d6`;
    features.push(damageFeature("sneak-attack", "Sneak Attack", dice,
      "Add Sneak Attack when the weapon and advantage or ally requirements are met."));
  }
  if (barbarianLevel || hasNamed("rage")) {
    const level = barbarianLevel || character.level || 1;
    const bonus = level >= 16 ? 4 : level >= 9 ? 3 : 2;
    features.push(flatDamageFeature("rage-damage", "Rage damage", bonus,
      "Add Rage damage to an eligible Strength-based melee weapon hit."));
  }
  if (bardLevel || hasNamed("bardic inspiration")) {
    const level = bardLevel || character.level || 1;
    const die = level >= 15 ? "1d12" : level >= 10 ? "1d10" : level >= 5 ? "1d8" : "1d6";
    features.push({
      id: "bardic-inspiration", name: "Bardic Inspiration", group: "Character features",
      summary: "Add the character’s current Bardic Inspiration die to an eligible d20 test.",
      rulesets: [String(ruleset)], characterSpecific: true,
      entries: [{ contexts: ["attack", "skill", "save"], kind: "die", notation: die, label: "Bardic Inspiration" }]
    });
  }
  if (String(ruleset) === "2014" && (paladinLevel || hasNamed("divine smite"))) {
    features.push(damageFeature("divine-smite", "Divine Smite", "2d8",
      "Base level-1 smite damage. Configure it when using a higher-level spell slot."), true);
  }
  if ((paladinLevel >= 11 && String(ruleset) === "2014") || hasNamed("improved divine smite")) {
    features.push(damageFeature("improved-divine-smite", "Improved Divine Smite", "1d8",
      "Add radiant damage to a hit with a melee weapon."));
  }
  if ((paladinLevel >= 11 && String(ruleset) === "2024") || hasNamed("radiant strikes")) {
    features.push(damageFeature("radiant-strikes", "Radiant Strikes", "1d8",
      "Add radiant damage to an eligible melee weapon hit."));
  }
  addNamedDamageFeatures(features, character, hasNamed);
  return dedupe(features);
}

export function classSummary(character) {
  return (character?.classes || []).map(entry => `${entry.name} ${entry.level}`).join(" / ");
}

function addNamedDamageFeatures(features, character, hasNamed) {
  const level = Number(character.level || 1);
  const options = [
    ["colossus slayer", "Colossus Slayer", "1d8", "Add once per turn when the target is below its Hit Point maximum."],
    ["dread ambusher", "Dread Ambusher", "1d8", "Add to the extra attack’s damage when the feature applies."],
    ["giant's might", "Giant’s Might", level >= 18 ? "1d10" : level >= 10 ? "1d8" : "1d6", "Add once per turn on an eligible weapon hit."],
    ["gathered swarm", "Gathered Swarm", level >= 11 ? "1d8" : "1d6", "Add piercing damage after an eligible attack hit."],
    ["psychic blades", "Psychic Blades", level >= 15 ? "8d6" : level >= 10 ? "5d6" : level >= 5 ? "3d6" : "2d6", "Add psychic damage after expending Bardic Inspiration."],
    ["divine strike", "Divine Strike", level >= 14 ? "2d8" : "1d8", "Add the domain’s extra damage once per turn on a weapon hit."],
    ["brutal strike", "Brutal Strike", level >= 17 ? "2d10" : "1d10", "Add damage when you forgo Reckless Attack advantage for Brutal Strike."]
  ];
  options.forEach(([key, name, dice, summary]) => {
    if (hasNamed(key)) features.push(damageFeature(slug(key), name, dice, summary));
  });
  if (hasNamed("agonizing blast")) {
    const bonus = abilityModifier(character.abilities?.cha ?? 10);
    features.push(flatDamageFeature("agonizing-blast", "Agonizing Blast", bonus,
      "Add the character’s Charisma modifier to an eligible Warlock cantrip damage roll.", "spell"));
  }
}

function damageFeature(id, name, notation, summary, configurable = false) {
  return {
    id, name, group: "Character features", summary, rulesets: ["2014", "2024"],
    configurable, characterSpecific: true, rollScope: "weapon",
    entries: [{ contexts: ["damage"], kind: "die", notation, label: name }]
  };
}

function flatDamageFeature(id, name, value, summary, rollScope = "weapon") {
  return {
    id, name, group: "Character features", summary, rulesets: ["2014", "2024"], characterSpecific: true, rollScope,
    entries: [{ contexts: ["damage"], kind: "flat", value, label: name }]
  };
}

function classLevel(character, target) {
  return (character.classes || []).filter(entry => normalize(entry.name) === target)
    .reduce((total, entry) => total + Number(entry.level || 0), 0);
}

function dedupe(features) {
  return [...new Map(features.map(feature => [feature.id, feature])).values()];
}

function normalize(value) { return String(value || "").toLowerCase().replace(/[’']/g, "'").trim(); }
function slug(value) { return normalize(value).replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""); }
