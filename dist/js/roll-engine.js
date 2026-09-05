import { CHECKS, EFFECT_PRESETS } from "./rules-data.js?v=1.3.0";
import { characterFeatureEffects } from "./character-features.js?v=1.3.0";
import { selectedSpell, spellDamage } from "./spell-data.js?v=1.3.0";
import { abilityModifier } from "./state.js?v=1.3.0";

const DIE_RE = /([+-]?)(\d*)d(\d+)|([+-]?\d+)/gi;

export function parseNotation(notation) {
  const cleaned = String(notation || "").replace(/\s+/g, "");
  const dice = [];
  let flat = 0;
  let match;
  DIE_RE.lastIndex = 0;
  while ((match = DIE_RE.exec(cleaned))) {
    if (match[3]) {
      const sign = match[1] === "-" ? -1 : 1;
      const count = Math.min(50, Math.max(1, Number(match[2] || 1)));
      const sides = Math.min(1000, Math.max(2, Number(match[3])));
      for (let i = 0; i < count; i += 1) dice.push({ sides, sign });
    } else if (match[4]) flat += Number(match[4]);
  }
  return { dice, flat };
}

export function rollDie(sides) {
  const max = Math.floor(0x100000000 / sides) * sides;
  const buffer = new Uint32Array(1);
  let value;
  do {
    if (globalThis.crypto?.getRandomValues) crypto.getRandomValues(buffer);
    else buffer[0] = Math.floor(Math.random() * 0x100000000);
    value = buffer[0];
  } while (value >= max);
  return (value % sides) + 1;
}

export function buildRollPlan(state) {
  const context = state.roll.context;
  const base = baseForContext(state);
  const effectContexts = effectContextsForRoll(state, base);
  const effects = getApplicableEffects(state, effectContexts, base);
  const entries = effects.flatMap(effect => effect.entries.map(entry => ({ ...entry, effectId: effect.id })));
  const modes = entries.filter(entry => entry.kind === "mode");
  const hasAdvantage = modes.some(entry => entry.mode === "advantage");
  const hasDisadvantage = modes.some(entry => entry.mode === "disadvantage");
  const automaticMode = hasAdvantage === hasDisadvantage ? "normal" : hasAdvantage ? "advantage" : "disadvantage";
  const mode = state.roll.modeOverride || automaticMode;
  const flatEffects = entries.filter(entry => ["flat", "proficiency", "halfProficiency"].includes(entry.kind));
  const dieEffects = entries.filter(entry => entry.kind === "die");
  const targetACBonus = sum(entries.filter(entry => entry.kind === "targetAC").map(entry => entry.value));
  const baseParsed = parseNotation(base.notation);
  const baseDamageType = base.damageType || "Untyped";
  let dice = base.isD20
    ? Array.from({ length: mode === "normal" ? 1 : 2 }, () => ({ sides: 20, sign: 1, d20: true, source: "base" }))
    : baseParsed.dice.map(die => ({ ...die, source: "base", damageType: baseDamageType }));
  const effectDice = dieEffects.flatMap(entry => parseNotation(entry.notation).dice.map(die => ({
    ...die, label: entry.label, source: entry.effectId,
    damageType: resolveDamageType(entry.damageType, baseDamageType),
    criticalEligible: entry.criticalEligible !== false
  })));
  dice.push(...effectDice);
  if (base.damageRoll && (state.roll.critical || entries.some(entry => entry.kind === "criticalDamage"))) {
    dice.push(...dice.filter(die => die.criticalEligible !== false).map(die => ({ ...die, critical: true })));
  }
  if (entries.some(entry => entry.kind === "rollTwice" && entry.scope === "baseDamage")) {
    const primary = dice.filter(die => die.source === "base").map(die => ({ ...die, alternateSet: "A" }));
    const alternate = primary.map(die => ({ ...die, alternateSet: "B", alternate: true }));
    dice = [...primary, ...alternate, ...dice.filter(die => die.source !== "base")];
  }
  const baseFlat = base.isD20 ? Number(base.modifier || 0) : baseParsed.flat + Number(base.modifier || 0);
  const flatComponents = [];
  if (base.damageRoll && baseFlat) flatComponents.push({ value: baseFlat, label: "Base modifier", damageType: baseDamageType });
  flatEffects.forEach(entry => flatComponents.push({
    value: entryValue(entry, state.character), label: entry.label,
    damageType: base.damageRoll ? resolveDamageType(entry.damageType, baseDamageType) : null
  }));
  const flat = baseFlat + sum(flatEffects.map(entry => entryValue(entry, state.character)));
  const targetAC = Number(state.roll.targetAC || 0) || null;
  const effectiveAC = targetAC ? targetAC + targetACBonus : null;
  const multipliers = entries.filter(entry => entry.kind === "multiplier").map(entry => ({
    ...entry, damageType: resolveDamageType(entry.damageType, baseDamageType)
  }));
  const plan = {
    context, effectContexts, label: base.label, sublabel: base.sublabel, base, effects, entries, mode, automaticMode,
    dice, flat, flatComponents, dieEffects, flatEffects, multipliers, targetAC, effectiveAC,
    criticalThreshold: Math.max(2, Math.min(20, ...entries.filter(entry => entry.kind === "criticalRange").map(entry => Number(entry.value)).filter(Number.isFinite))),
    d20Floor: Math.min(20, Math.max(0, ...entries.filter(entry => entry.kind === "d20Floor").map(entry => Number(entry.value)).filter(Number.isFinite))),
    saveDC: Number(base.saveDC || 0) + sum(entries.filter(entry => entry.kind === "saveDC").map(entry => entry.value)),
    blocked: entries.some(entry => entry.kind === "blocked"),
    automaticFailure: entries.some(entry => entry.kind === "automaticFailure"),
    criticalOnHit: entries.some(entry => entry.kind === "criticalOnHit"),
    missToHit: entries.some(entry => entry.kind === "missToHit"),
    ignoreResistance: entries.filter(entry => entry.kind === "ignoreResistance").flatMap(entry => entry.damageTypes || []),
    damageThreshold: Math.max(0, ...entries.filter(entry => entry.kind === "damageThreshold").map(entry => Number(entry.value)).filter(Number.isFinite)),
    rerollChoices: entries.filter(entry => entry.kind === "rerollChoice")
  };
  plan.notation = formatPlanNotation(dice, flat, mode);
  plan.formula = buildFormula(plan);
  return plan;
}

export function executeRoll(plan, suppliedResults = null, options = {}) {
  const usedRerolls = new Set();
  const results = suppliedResults
    ? suppliedResults.map((result, index) => normalizeSuppliedResult(plan, { ...plan.dice[index], ...result }))
    : plan.dice.map(die => rollResult(plan, die, usedRerolls));
  return calculateOutcome(plan, results, options);
}

export function rerollOutcome(plan, outcome, resultIndex) {
  const target = outcome.results[resultIndex];
  const value = rollDie(target.sides);
  const floor = dieFloor(plan, target);
  const results = outcome.results.map((result, index) => index === resultIndex
    ? { ...result, originalValue: result.value, value, calculatedValue: floor ? Math.max(value, floor) : value, rerolledByChoice: true }
    : { ...result });
  const bonus = sum(plan.rerollChoices.map(entry => Number(entry.rerollBonus || 0)));
  return calculateOutcome(plan, results, { rerollsUsed: Number(outcome.rerollsUsed || 0) + 1, rerollBonus: bonus });
}

function calculateOutcome(plan, results, options = {}) {
  let usedResults = [...results];
  let d20Value = null;
  let d20Applied = null;
  let discarded = null;
  if (plan.base.isD20) {
    const d20s = results.filter(result => result.d20);
    if (d20s.length > 1) {
      const picked = plan.mode === "advantage" ? Math.max(...d20s.map(die => die.value)) : Math.min(...d20s.map(die => die.value));
      const pickedIndex = d20s.findIndex(die => die.value === picked);
      let seen = -1;
      usedResults = results.filter(result => !result.d20 || (++seen === pickedIndex));
      discarded = d20s.find((_, index) => index !== pickedIndex)?.value ?? null;
      d20Value = picked;
    } else d20Value = d20s[0]?.value ?? null;
    d20Applied = Math.max(Number(d20Value || 0), Number(plan.d20Floor || 0));
  }
  const alternate = chooseAlternateDamageSet(usedResults);
  usedResults = alternate.used;
  const rerollBonus = Number(options.rerollBonus || 0);
  const raw = plan.base.isD20
    ? sum(usedResults.map(result => result.d20 ? d20Applied : appliedValue(result) * (result.sign || 1))) + plan.flat + rerollBonus
    : sum(usedResults.map(result => appliedValue(result) * (result.sign || 1))) + plan.flat;
  const damage = plan.base.damageRoll ? calculateTypedDamage(plan, usedResults) : null;
  let total = damage ? damage.total : raw;
  if (damage && plan.damageThreshold && total < plan.damageThreshold) total = 0;
  const naturalCritical = plan.base.isD20 && d20Value >= plan.criticalThreshold;
  const naturalOne = plan.base.isD20 && d20Value === 1;
  let hit = plan.base.attackRoll && plan.effectiveAC
    ? (naturalCritical ? true : naturalOne ? false : raw >= plan.effectiveAC)
    : null;
  if (plan.blocked) hit = false;
  else if (plan.missToHit && hit === false) hit = true;
  const criticalHit = Boolean((hit || hit == null && plan.criticalOnHit && !naturalOne) && (naturalCritical || plan.criticalOnHit));
  return {
    results, usedResults, raw, total, multiplier: damage?.multiplier ?? 1, damageBreakdown: damage?.breakdown || [],
    d20Value, d20Applied, discarded, alternateDiscarded: alternate.discarded, naturalCritical, naturalOne,
    criticalHit, hit, blocked: plan.blocked, automaticFailure: plan.automaticFailure,
    rerollsUsed: Number(options.rerollsUsed || 0), rerollBonus
  };
}

function rollResult(plan, die, usedRerolls) {
  let value = rollDie(die.sides);
  let originalValue = null;
  const reroll = plan.entries.find(entry => entry.kind === "rerollValues" && scopeMatches(entry.scope, die) && entry.values?.includes(value) && (entry.perDie || !usedRerolls.has(entry.effectId)));
  if (reroll) {
    originalValue = value;
    usedRerolls.add(reroll.effectId);
    value = rollDie(die.sides);
  }
  const floor = dieFloor(plan, die);
  return { ...die, value, originalValue, calculatedValue: floor ? Math.max(value, floor) : value };
}

function normalizeSuppliedResult(plan, result) {
  const floor = dieFloor(plan, result);
  return { ...result, calculatedValue: floor ? Math.max(result.value, floor) : result.value };
}

function chooseAlternateDamageSet(results) {
  const a = results.filter(result => result.alternateSet === "A");
  const b = results.filter(result => result.alternateSet === "B");
  if (!a.length || !b.length) return { used: results, discarded: null };
  const totalA = sum(a.map(result => appliedValue(result) * (result.sign || 1)));
  const totalB = sum(b.map(result => appliedValue(result) * (result.sign || 1)));
  const keep = totalB > totalA ? "B" : "A";
  return { used: results.filter(result => !result.alternateSet || result.alternateSet === keep), discarded: keep === "A" ? totalB : totalA };
}

function calculateTypedDamage(plan, results) {
  const groups = new Map();
  results.forEach(result => addDamage(groups, result.damageType || plan.base.damageType || "Untyped", appliedValue(result) * (result.sign || 1)));
  plan.flatComponents.forEach(component => addDamage(groups, component.damageType || plan.base.damageType || "Untyped", component.value));
  const breakdown = [...groups].map(([damageType, rawValue]) => {
    const raw = Math.max(0, rawValue);
    const applicable = plan.multipliers.filter(entry => entry.damageType === damageType || entry.damageType === "*");
    const multiplier = applicable.reduce((current, entry) => {
      if (entry.value === 0.5 && (plan.ignoreResistance.includes("*") || plan.ignoreResistance.includes(damageType))) return current;
      const value = Number(entry.value);
      return current * (Number.isFinite(value) ? value : 1);
    }, 1);
    return { damageType, raw, multiplier, total: Math.floor(raw * multiplier) };
  });
  return { breakdown, total: sum(breakdown.map(item => item.total)), multiplier: breakdown.length === 1 ? breakdown[0].multiplier : 1 };
}

export function effectCatalog(state) {
  const all = [...EFFECT_PRESETS, ...(state.customEffects || []), ...characterFeatureEffects(state.character, state.ruleset)];
  return [...new Map(all.map(effect => [effect.id, effect])).values()];
}

export function getApplicableEffects(state, contexts, suppliedBase = null) {
  const applicableContexts = Array.isArray(contexts) ? contexts : [contexts];
  const base = suppliedBase || baseForContext(state);
  const active = new Set([...(state.activeEffects || []), ...(state.roll.selectedEffects || [])]);
  return effectCatalog(state)
    .filter(effect => effect.rulesets?.includes?.(state.ruleset) || effect.rulesets?.includes?.("all"))
    .filter(effect => effectMatchesRollScope(state, effect, base))
    .filter(effect => active.has(effect.id))
    .map(effect => ({ ...effect, entries: (effect.entries || [])
      .filter(entry => entry.contexts.some(context => applicableContexts.includes(context)))
      .filter(entry => entryMatchesRoll(state, entry, base))
      .map(entry => configuredEntry(state, effect, entry)) }))
    .filter(effect => effect.entries.length);
}

export function effectMatchesRollScope(state, effect, base = null) {
  if (!effect.rollScope) return true;
  const scope = base?.rollScope || (state.roll.context === "spell" ? "spell" : "weapon");
  return effect.rollScope === scope;
}

export function entryMatchesRoll(state, entry, suppliedBase = null) {
  const base = suppliedBase || baseForContext(state);
  if (entry.rulesets && !entry.rulesets.includes(state.ruleset)) return false;
  if (entry.rollScope && entry.rollScope !== base.rollScope) return false;
  if (entry.attackTypes && !entry.attackTypes.includes(base.attackType)) return false;
  if (entry.weaponProperties && !entry.weaponProperties.some(property => base.weaponProperties?.includes(property))) return false;
  if (entry.checks && !entry.checks.includes(state.roll.selectedSkill)) return false;
  if (entry.requiresCritical && !state.roll.critical) return false;
  if (entry.requiresAttackRoll && !base.attackRoll) return false;
  if (entry.requiresSaveDC && !base.saveDC) return false;
  if (entry.requiresTrained && !(base.rank > 0)) return false;
  if (entry.requiresUntrained && base.rank > 0) return false;
  if (state.roll.context === "save" && (entry.abilities || entry.saveKinds)) {
    const matchesAbility = entry.abilities?.includes(base.ability);
    const matchesKind = entry.saveKinds?.includes(base.saveKind);
    if (!matchesAbility && !matchesKind) return false;
  } else if (entry.abilities && !entry.abilities.includes(base.ability)) return false;
  return true;
}

export function baseForContext(state) {
  const character = state.character;
  const context = state.roll.context;
  if (context === "attack" || context === "damage") return weaponBase(state, character, context);
  if (context === "skill") {
    const check = CHECKS.find(item => item.key === state.roll.selectedSkill) || CHECKS[1];
    const rank = check.special ? 0 : Number(character.skills[check.key] || 0);
    const modifier = abilityModifier(character.abilities[check.ability]) + rank * Number(character.proficiencyBonus || 0);
    return { label: check.label, sublabel: `${check.ability.toUpperCase()} ability check`, notation: "1d20", modifier, ability: check.ability, rank, isD20: true };
  }
  if (context === "save") {
    const ability = state.roll.selectedSave || "str";
    if (ability === "death") return { label: "Death saving throw", sublabel: "DC 10", notation: "1d20", modifier: 0, rank: 0, saveKind: "death", isD20: true };
    const rank = Number(character.saves[ability] || 0);
    const modifier = abilityModifier(character.abilities[ability]) + rank * Number(character.proficiencyBonus || 0);
    return { label: `${ability.toUpperCase()} saving throw`, sublabel: rank ? "Proficient" : "Not proficient", notation: "1d20", modifier, ability, rank, saveKind: "ability", isD20: true };
  }
  if (context === "spell") return spellBase(state, character);
  const parsed = parseNotation(state.roll.customNotation || "1d20");
  const isD20 = parsed.dice.length === 1 && parsed.dice[0].sides === 20 && parsed.dice[0].sign === 1;
  return { label: state.roll.customLabel || "Custom roll", sublabel: "Custom dice", notation: isD20 ? "1d20" : state.roll.customNotation || "1d20", modifier: isD20 ? parsed.flat : 0, isD20 };
}

function weaponBase(state, character, context) {
  const weapon = character.weapons.find(item => item.id === state.roll.selectedWeaponId) || character.weapons[0];
  if (!weapon) return { label: "No weapon selected", sublabel: "Add a weapon", notation: context === "attack" ? "1d20" : "1d4", modifier: 0, isD20: context === "attack", rollScope: "weapon" };
  const ability = abilityModifier(character.abilities[weapon.ability] ?? 10);
  const properties = String(weapon.properties || "").toLowerCase();
  const attackType = state.roll.attackMode === "ranged" && /thrown/.test(properties) || /ammunition|ranged/.test(properties) ? "ranged" : "melee";
  const common = { label: weapon.name, ability: weapon.ability, attackType, rollScope: "weapon", weaponProperties: properties.split(/[,()]/).map(value => value.trim()) };
  if (context === "attack") {
    const modifier = ability + (weapon.proficient ? Number(character.proficiencyBonus || 0) : 0) + Number(weapon.attackBonus || 0);
    return { ...common, sublabel: "Weapon attack", notation: "1d20", modifier, isD20: true, attackRoll: true };
  }
  const modifier = (weapon.damageAbility === false ? 0 : ability) + Number(weapon.damageBonus || 0);
  return { ...common, sublabel: `${weapon.damageType || "Damage"} damage`, notation: weapon.damage || "1d4", modifier, damageType: weapon.damageType || "Untyped", isD20: false, damageRoll: true };
}

function spellBase(state, character) {
  const spell = selectedSpell(state);
  const ability = character.spellAbility || "wis";
  const attackBonus = character.spellAttackBonus ?? (abilityModifier(character.abilities[ability]) + Number(character.proficiencyBonus || 0));
  const defaultSaveDC = 8 + abilityModifier(character.abilities[ability]) + Number(character.proficiencyBonus || 0);
  const useAttack = spell?.attack && state.roll.spellPhase !== "damage";
  if (useAttack || !spell?.damages?.length) return {
    label: spell?.name || "Spell attack", sublabel: "Spell attack roll", notation: "1d20",
    modifier: Number(spell?.attackBonus ?? attackBonus), ability, attackType: "spell", rollScope: "spell", isD20: true, attackRoll: true
  };
  const damage = spellDamage(spell, character.level, state.roll.spellSlotLevel, state.roll.spellDamageIndex);
  const saveDC = spell?.saveDC || character.spellSaveDC || defaultSaveDC;
  const saveText = spell?.saveAbility ? ` · ${spell.saveAbility.toUpperCase()} save DC ${saveDC}` : "";
  const modifier = Number(spell?.damageBonus || 0) + (damage.addAbility ? abilityModifier(character.abilities[ability]) : 0);
  return {
    label: spell?.name || "Spell damage", sublabel: `${damage.damageType || "Spell"} damage${saveText}`,
    notation: damage.notation || "1d8", modifier, damageType: damage.damageType || "Untyped", saveDC,
    ability, rollScope: "spell", isD20: false, damageRoll: true
  };
}

export function effectContextsForRoll(state, base = baseForContext(state)) {
  if (state.roll.context !== "spell") return [state.roll.context];
  return ["spell", base.attackRoll ? "attack" : "damage"];
}

function configuredEntry(state, effect, entry) {
  const config = state.effectConfig?.[effect.id] || {};
  const configured = config.notation?.replace?.(/−/g, "-");
  if (entry.kind === "die" && configured) return { ...entry, notation: configured };
  if (["flat", "saveDC", "damageThreshold", "criticalRange"].includes(entry.kind) && configured) {
    const value = Number(String(configured).replace(/[^0-9+-.]/g, ""));
    if (Number.isFinite(value)) return { ...entry, value };
  }
  if (entry.kind === "rerollChoice" && configured) return { ...entry, rerollBonus: Number(configured) || 0 };
  if (entry.kind === "multiplier" && config.damageType) return { ...entry, damageType: config.damageType };
  if (entry.kind === "ignoreResistance" && config.damageType) return { ...entry, damageTypes: [config.damageType] };
  return entry;
}

function entryValue(entry, character) {
  if (entry.kind === "proficiency") return Number(character.proficiencyBonus || 0);
  if (entry.kind === "halfProficiency") return Math.floor(Number(character.proficiencyBonus || 0) / 2);
  return Number(entry.value || 0);
}

function buildFormula(plan) {
  const items = [plan.base.isD20
    ? `${plan.mode === "normal" ? "1d20" : "2d20"} ${signed(plan.base.modifier)}`
    : `${plan.base.damageRoll && plan.entries.some(entry => entry.kind === "rollTwice") ? "Roll damage twice: " : ""}${plan.base.notation} ${signed(plan.base.modifier)}`];
  plan.effects.forEach(effect => effect.entries.forEach(entry => {
    if (["targetAC", "multiplier", "mode"].includes(entry.kind)) return;
    items.push(`${entry.label}: ${describeEntry(entry)}`);
  }));
  if (plan.effectiveAC) items.push(`Target AC ${plan.effectiveAC}`);
  if (plan.saveDC) items.push(`Save DC ${plan.saveDC}`);
  plan.multipliers.forEach(entry => items.push(`${entry.label} (${entry.damageType}): x${entry.value}`));
  return items.join(" · ");
}

function describeEntry(entry) {
  if (entry.kind === "die") return entry.notation;
  if (entry.kind === "proficiency") return "proficiency";
  if (entry.kind === "halfProficiency") return "half proficiency";
  if (entry.kind === "criticalOnHit") return "critical on hit";
  if (entry.kind === "criticalDamage") return "double damage dice";
  if (entry.kind === "rerollValues") return `reroll ${entry.values.join("/")}`;
  if (entry.kind === "rerollChoice") return "reroll available";
  if (entry.kind === "dieFloor") return `minimum die ${entry.value}`;
  if (entry.kind === "d20Floor") return `minimum d20 ${entry.value}`;
  if (entry.kind === "rollTwice") return "keep higher damage";
  if (entry.kind === "blocked") return "cannot target";
  if (entry.kind === "automaticFailure") return "automatic failure";
  if (entry.kind === "missToHit") return "miss becomes hit";
  if (entry.kind === "ignoreResistance") return "ignore resistance";
  if (entry.kind === "damageThreshold") return `threshold ${entry.value}`;
  if (entry.kind === "saveDC") return `DC ${signed(entry.value)}`;
  return signed(entry.value || 0);
}

function formatPlanNotation(dice, flat, mode) {
  const grouped = new Map();
  dice.forEach(die => {
    const key = `${die.sign || 1}:${die.sides}:${die.d20 ? "d20" : "die"}`;
    grouped.set(key, (grouped.get(key) || 0) + 1);
  });
  const chunks = [...grouped.entries()].map(([key, count]) => {
    const [sign, sides, tag] = key.split(":");
    if (tag === "d20" && count === 2) return `2d20 keep ${mode === "advantage" ? "high" : "low"}`;
    return `${Number(sign) < 0 ? "-" : ""}${count}d${sides}`;
  });
  if (flat) chunks.push(`${flat > 0 ? "+ " : "- "}${Math.abs(flat)}`);
  return chunks.join(" ") || "0";
}

function scopeMatches(scope, die) {
  if (!scope) return true;
  if (scope === "d20") return Boolean(die.d20);
  if (scope === "baseDamage") return die.source === "base" && !die.d20;
  return true;
}

function dieFloor(plan, die) { return Math.max(0, ...plan.entries.filter(entry => entry.kind === "dieFloor" && scopeMatches(entry.scope, die)).map(entry => Number(entry.value))); }
function resolveDamageType(value, fallback) { return !value || value === "same" ? fallback : value; }
function appliedValue(result) { return Number(result.calculatedValue ?? result.value); }
function addDamage(groups, type, value) { groups.set(type, (groups.get(type) || 0) + Number(value || 0)); }
function signed(value) { const number = Number(value || 0); return number >= 0 ? `+${number}` : `-${Math.abs(number)}`; }
function sum(values) { return values.reduce((total, value) => total + (Number.isFinite(Number(value)) ? Number(value) : 0), 0); }
