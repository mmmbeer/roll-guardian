import { EFFECT_PRESETS, SKILLS } from "./rules-data.js?v=1.1.1";
import { abilityModifier } from "./state.js?v=1.1.1";

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
    } else if (match[4]) {
      flat += Number(match[4]);
    }
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
  const character = state.character;
  const base = baseForContext(state);
  const effects = getApplicableEffects(state, context);
  const modeEntries = effects.flatMap(e => e.entries).filter(e => e.kind === "mode");
  const hasAdvantage = modeEntries.some(e => e.mode === "advantage");
  const hasDisadvantage = modeEntries.some(e => e.mode === "disadvantage");
  const automaticMode = hasAdvantage === hasDisadvantage ? "normal" : hasAdvantage ? "advantage" : "disadvantage";
  const mode = state.roll.modeOverride || automaticMode;
  const flatEffects = effects.flatMap(e => e.entries).filter(e => ["flat", "proficiency"].includes(e.kind));
  const dieEffects = effects.flatMap(e => e.entries).filter(e => e.kind === "die");
  const targetACBonus = sum(effects.flatMap(e => e.entries).filter(e => e.kind === "targetAC").map(e => e.value));
  const multipliers = effects.flatMap(e => e.entries).filter(e => e.kind === "multiplier").map(e => Number(e.value));
  const flatEffectTotal = sum(flatEffects.map(e => e.kind === "proficiency" ? character.proficiencyBonus : e.value));
  const baseDice = parseNotation(base.notation);
  const effectDice = dieEffects.flatMap(e => parseNotation(resolveConfiguredNotation(state, e)).dice.map(d => ({ ...d, label: e.label })));
  const d20Dice = base.isD20 ? Array.from({ length: mode === "normal" ? 1 : 2 }, () => ({ sides: 20, sign: 1, d20: true })) : [];
  const normalDice = base.isD20 ? [...d20Dice, ...effectDice] : [...baseDice.dice, ...effectDice];
  const dice = context === "damage" && state.roll.critical
    ? [...normalDice, ...normalDice.map(die => ({ ...die, critical: true }))]
    : normalDice;
  const baseFlat = base.isD20 ? Number(base.modifier || 0) : baseDice.flat + Number(base.modifier || 0);
  const flat = baseFlat + flatEffectTotal;
  const targetAC = Number(state.roll.targetAC || 0) || null;
  const effectiveAC = targetAC ? targetAC + targetACBonus : null;
  return {
    context, label: base.label, sublabel: base.sublabel, base, effects, mode, automaticMode,
    dice, flat, dieEffects, flatEffects, multipliers, targetAC, effectiveAC,
    notation: formatPlanNotation(dice, flat, mode),
    formula: buildFormula(base, effects, mode, flat, effectiveAC, state.roll.critical)
  };
}

export function executeRoll(plan) {
  const results = plan.dice.map(die => ({ ...die, value: rollDie(die.sides) }));
  let usedResults = results;
  let d20Value = null;
  let discarded = null;
  if (plan.base.isD20) {
    const d20s = results.filter(r => r.d20);
    if (d20s.length > 1) {
      const picked = plan.mode === "advantage" ? Math.max(...d20s.map(d => d.value)) : Math.min(...d20s.map(d => d.value));
      const pickedIndex = d20s.findIndex(d => d.value === picked);
      let seen = -1;
      usedResults = results.filter(r => !r.d20 || (++seen === pickedIndex));
      discarded = d20s.find((_, i) => i !== pickedIndex)?.value ?? null;
      d20Value = picked;
    } else d20Value = d20s[0]?.value ?? null;
  }
  const raw = usedResults.reduce((total, die) => total + die.value * (die.sign || 1), 0) + plan.flat;
  const multiplier = plan.multipliers.reduce((value, next) => value * next, 1);
  const total = multiplier === 0.5 ? Math.floor(raw / 2) : Math.floor(raw * multiplier);
  const naturalCritical = plan.base.isD20 && d20Value === 20;
  const naturalOne = plan.base.isD20 && d20Value === 1;
  const hit = plan.context === "attack" && plan.effectiveAC
    ? (naturalCritical ? true : naturalOne ? false : total >= plan.effectiveAC)
    : null;
  return { results, usedResults, raw, total, multiplier, d20Value, discarded, naturalCritical, naturalOne, hit };
}

export function effectCatalog(state) {
  return [...EFFECT_PRESETS, ...(state.customEffects || [])];
}

export function getApplicableEffects(state, context) {
  const active = new Set([...(state.activeEffects || []), ...(state.roll.selectedEffects || [])]);
  return effectCatalog(state)
    .filter(effect => effect.rulesets?.includes?.(state.ruleset) || effect.rulesets?.includes?.("all"))
    .filter(effect => active.has(effect.id))
    .map(effect => ({
      ...effect,
      entries: (effect.entries || []).filter(entry => entry.contexts.includes(context)).map(entry => configuredEntry(state, effect, entry))
    }))
    .filter(effect => effect.entries.length);
}

export function baseForContext(state) {
  const c = state.character;
  const context = state.roll.context;
  if (context === "attack" || context === "damage") {
    const weapon = c.weapons.find(w => w.id === state.roll.selectedWeaponId) || c.weapons[0];
    if (!weapon) return { label: "No weapon selected", sublabel: "Add a weapon", notation: context === "attack" ? "1d20" : "1d4", modifier: 0, isD20: context === "attack" };
    const ability = abilityModifier(c.abilities[weapon.ability] ?? 10);
    if (context === "attack") {
      const calculated = ability + (weapon.proficient ? Number(c.proficiencyBonus || 0) : 0) + Number(weapon.attackBonus || 0);
      return { label: weapon.name, sublabel: "Weapon attack", notation: "1d20", modifier: calculated, isD20: true, parts: [ability, weapon.proficient ? c.proficiencyBonus : 0, weapon.attackBonus || 0] };
    }
    const mod = (weapon.damageAbility === false ? 0 : ability) + Number(weapon.damageBonus || 0);
    return { label: weapon.name, sublabel: `${weapon.damageType || "Damage"} damage`, notation: weapon.damage || "1d4", modifier: mod, isD20: false };
  }
  if (context === "skill") {
    const skill = SKILLS.find(s => s.key === state.roll.selectedSkill) || SKILLS[0];
    const rank = Number(c.skills[skill.key] || 0);
    const modifier = abilityModifier(c.abilities[skill.ability]) + rank * Number(c.proficiencyBonus || 0);
    return { label: skill.label, sublabel: `${skill.ability.toUpperCase()} ability check`, notation: "1d20", modifier, isD20: true };
  }
  if (context === "save") {
    const ability = state.roll.selectedSave || "str";
    const rank = Number(c.saves[ability] || 0);
    const modifier = abilityModifier(c.abilities[ability]) + rank * Number(c.proficiencyBonus || 0);
    return { label: `${ability.toUpperCase()} saving throw`, sublabel: rank ? "Proficient" : "Not proficient", notation: "1d20", modifier, isD20: true };
  }
  if (context === "spell") {
    const spell = c.spells.find(s => s.id === state.roll.selectedSpellId) || c.spells[0];
    const ability = c.spellAbility || "wis";
    const calculated = c.spellAttackBonus ?? (abilityModifier(c.abilities[ability]) + Number(c.proficiencyBonus || 0));
    if (spell?.rollType === "damage") return { label: spell.name, sublabel: spell.damageType || "Spell damage", notation: spell.damage || "1d10", modifier: Number(spell.damageBonus || 0), isD20: false };
    const defaultSaveDC = 8 + abilityModifier(c.abilities[ability]) + Number(c.proficiencyBonus || 0);
    if (spell?.rollType === "save") return { label: spell.name, sublabel: `Target saves vs. DC ${spell.saveDC || c.spellSaveDC || defaultSaveDC}`, notation: spell.damage || "1d8", modifier: Number(spell.damageBonus || 0), isD20: false };
    return { label: spell?.name || "Spell attack", sublabel: "Spell attack roll", notation: "1d20", modifier: Number(spell?.attackBonus ?? calculated), isD20: true };
  }
  return { label: state.roll.customLabel || "Custom roll", sublabel: "Custom dice", notation: state.roll.customNotation || "1d20", modifier: 0, isD20: false };
}

function resolveConfiguredNotation(state, entry) {
  return entry.notation;
}

function configuredEntry(state, effect, entry) {
  const configured = state.effectConfig?.[effect.id]?.notation?.replace?.(/−/g, "-");
  if (!configured) return entry;
  if (entry.kind === "die") return { ...entry, notation: configured };
  if (entry.kind === "flat") {
    const value = Number(String(configured).replace(/[^0-9+-.]/g, ""));
    return Number.isFinite(value) ? { ...entry, value } : entry;
  }
  return entry;
}

function formatPlanNotation(dice, flat, mode) {
  const grouped = new Map();
  dice.forEach(die => {
    const key = `${die.sign || 1}:${die.sides}:${die.d20 ? "d20" : "die"}`;
    grouped.set(key, (grouped.get(key) || 0) + 1);
  });
  const chunks = [...grouped.entries()].map(([key, count]) => {
    const [sign, sides, tag] = key.split(":");
    if (tag === "d20" && count === 2) return `${mode === "advantage" ? "2d20 keep high" : "2d20 keep low"}`;
    return `${Number(sign) < 0 ? "−" : ""}${count}d${sides}`;
  });
  if (flat) chunks.push(`${flat > 0 ? "+ " : "− "}${Math.abs(flat)}`);
  return chunks.join(" ") || "0";
}

function buildFormula(base, effects, mode, flat, effectiveAC, critical) {
  const items = [];
  items.push(base.isD20 ? `${mode === "normal" ? "1d20" : "2d20"} ${signed(base.modifier)}` : `${critical ? "Critical: " : ""}${base.notation} ${signed(base.modifier)}`);
  effects.forEach(effect => effect.entries.forEach(entry => {
    if (entry.kind === "targetAC" || entry.kind === "multiplier" || entry.kind === "mode") return;
    const value = entry.kind === "die" ? entry.notation : entry.kind === "proficiency" ? "proficiency" : signed(entry.value);
    items.push(`${entry.label}: ${value}`);
  }));
  if (effectiveAC) items.push(`Target AC ${effectiveAC}`);
  const multiplier = effects.flatMap(e => e.entries).find(e => e.kind === "multiplier");
  if (multiplier) items.push(`${multiplier.label}: ×${multiplier.value}`);
  return items.join(" · ") + (flat === 0 ? "" : "");
}

function signed(value) {
  const n = Number(value || 0);
  return n >= 0 ? `+${n}` : `−${Math.abs(n)}`;
}

function sum(values) { return values.reduce((total, value) => total + Number(value || 0), 0); }
