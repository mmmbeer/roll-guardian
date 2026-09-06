// Usage is explicit: lasting effects must never be inferred as consumable dice.
const SINGLE_USE = new Set([
  "help-check", "help-attack", "inspiration-2014", "heroic-inspiration-2024",
  "bardic-inspiration", "guiding-bolt-followup", "true-strike-2014", "mind-sliver",
  "vicious-mockery", "vex-2024", "sap-2024", "boon-of-fate-bonus",
  "boon-of-fate-penalty", "boon-combat-prowess", "tactical-mind",
  "indomitable-2014", "indomitable-2024", "dark-ones-own-luck",
  "stroke-of-luck-check", "stroke-of-luck-attack", "divine-smite", "psychic-blades"
]);
const PER_TURN = new Set([
  "sneak-attack", "savage-attacker-2024", "great-weapon-master-2024",
  "colossus-slayer", "dread-ambusher", "giant-s-might", "gathered-swarm",
  "divine-strike", "brutal-strike"
]);
const AFTER_ROLL = new Set([
  "bardic-inspiration", "dark-ones-own-luck", "tactical-mind",
  "boon-of-fate-bonus", "boon-of-fate-penalty"
]);

export function modifierUsage(effect, ruleset) {
  if (effect.usage) return effect.usage;
  if (SINGLE_USE.has(effect.id)) return "single";
  if (PER_TURN.has(effect.id)) return "turn";
  if (ruleset === "2014" && ["guidance", "resistance-spell"].includes(effect.id)) return "single";
  return "persistent";
}

export function isAfterRoll(effect) { return AFTER_ROLL.has(effect.id); }

export function bardLevel(state) {
  const configured = state.effectConfig?.["bardic-inspiration"];
  if (Number(configured?.bardLevel) >= 1) return Math.min(20, Math.floor(Number(configured.bardLevel)));
  // Preserve the die size of older saved sessions until a source level is chosen.
  const legacy = { "1d6": 1, "1d8": 5, "1d10": 10, "1d12": 15 }[configured?.notation];
  if (legacy) return legacy;
  const imported = (state.character.classes || []).filter(entry => entry.name.toLowerCase() === "bard")
    .reduce((sum, entry) => sum + Number(entry.level || 0), 0);
  return Math.max(1, Math.min(20, imported || 1));
}

export function bardDie(level) {
  return level >= 15 ? "1d12" : level >= 10 ? "1d10" : level >= 5 ? "1d8" : "1d6";
}

export function usedLimitedEffects(plan, outcome) {
  return plan.effects.filter(effect => {
    if (effect.usage === "persistent") return false;
    return effect.entries.some(entry => {
      if (entry.afterRoll) return outcome.postRollUsed?.includes(effect.id);
      if (entry.kind === "rerollChoice") return outcome.rerollEffectsUsed?.includes(effect.id);
      if (entry.kind === "die") return outcome.usedResults.some(die => die.source === effect.id);
      if (entry.kind === "mode") return !plan.modeOverridden && plan.base.isD20;
      if (entry.kind === "missToHit") return outcome.hit && !outcome.naturalCritical &&
        (outcome.naturalOne || outcome.raw < plan.effectiveAC);
      if (entry.kind === "d20Floor") return outcome.d20Value < entry.value;
      return true;
    });
  });
}

export function removeEffects(state, ids) {
  state.activeEffects = state.activeEffects.filter(id => !ids.includes(id));
  state.roll.selectedEffects = state.roll.selectedEffects.filter(id => !ids.includes(id));
}
