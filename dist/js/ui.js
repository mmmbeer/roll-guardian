import { bardDie, bardLevel } from "./modifier-lifecycle.js?v=1.6.0";
export { openModal, closeModal, modalButtons } from "./modal.js?v=1.6.0";
import { ABILITIES, CHECKS, DAMAGE_TYPES, SKILLS, WEAPON_LIBRARY } from "./rules-data.js?v=1.6.0";
import { classSummary } from "./character-features.js?v=1.6.0";
import { availableSpells, selectedSpell, spellDamage } from "./spell-data.js?v=1.6.0";
import { abilityModifier } from "./state.js?v=1.6.0";
import { effectCatalog, effectContextsForRoll, effectMatchesRollScope, entryMatchesRoll, getApplicableEffects } from "./roll-engine.js?v=1.6.0";

export const $ = selector => document.querySelector(selector);
export const $$ = selector => [...document.querySelectorAll(selector)];

export function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"]/g, char => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;" }[char]));
}

export function signed(value) {
  const number = Number(value || 0);
  return number >= 0 ? `+${number}` : `−${Math.abs(number)}`;
}

export function renderContextFields(state) {
  const context = state.roll.context;
  const c = state.character;
  if (context === "attack" || context === "damage") {
    const options = c.weapons.map(weapon => `<option value="${weapon.id}" ${weapon.id === state.roll.selectedWeaponId ? "selected" : ""}>${escapeHtml(weapon.name)} · ${escapeHtml(weapon.damage)}</option>`).join("");
    return `<div class="field-grid">
      <label class="field span-2"><span class="field-label">Weapon</span><select data-roll-field="selectedWeaponId">${options || '<option value="">Add a weapon first</option>'}</select></label>
      ${context === "attack" ? `
        <label class="field"><span class="field-label">Target</span><input data-roll-field="targetName" value="${escapeHtml(state.roll.targetName)}" placeholder="Optional name"></label>
        <label class="field"><span class="field-label">Armor Class</span><input data-roll-field="targetAC" value="${escapeHtml(state.roll.targetAC)}" inputmode="numeric" type="number" min="1" max="40" placeholder="Optional AC"></label>
      ` : `
        <label class="field"><span class="field-label">Damage type</span><select id="damageTypeDisplay" disabled><option>${escapeHtml(c.weapons.find(w => w.id === state.roll.selectedWeaponId)?.damageType || "Damage")}</option></select></label>
        <label class="check-chip"><input type="checkbox" data-roll-field="critical" ${state.roll.critical ? "checked" : ""}><span><strong>Critical hit</strong><small>Double the damage dice</small></span></label>
      `}
    </div>`;
  }
  if (context === "skill") {
    return `<div class="field-grid"><label class="field span-2"><span class="field-label">Skill or check</span><select data-roll-field="selectedSkill">${CHECKS.map(check => `<option value="${check.key}" ${check.key === state.roll.selectedSkill ? "selected" : ""}>${check.label} · ${check.ability.toUpperCase()} ${signed(checkModifier(state, check))}</option>`).join("")}</select></label></div>`;
  }
  if (context === "save") {
    return `<div class="field-grid"><label class="field span-2"><span class="field-label">Saving throw</span><select data-roll-field="selectedSave">${ABILITIES.map(ability => `<option value="${ability.key}" ${ability.key === state.roll.selectedSave ? "selected" : ""}>${ability.label} ${signed(saveModifier(state, ability.key))}</option>`).join("")}</select></label></div>`;
  }
  if (context === "spell") {
    const options = c.spells.map(spell => `<option value="${spell.id}" ${spell.id === state.roll.selectedSpellId ? "selected" : ""}>${escapeHtml(spell.name)} · ${labelRollType(spell.rollType)}</option>`).join("");
    return `<div class="field-grid">
      <label class="field span-2"><span class="field-label">Spell or spell attack</span><select data-roll-field="selectedSpellId">${options || '<option value="">Generic spell attack</option>'}</select></label>
      <div class="field span-2"><button class="mini-btn" type="button" data-action="add-spell">+ Add a spell preset</button></div>
    </div>`;
  }
  return `<div class="field-grid">
    <label class="field"><span class="field-label">Roll name</span><input data-roll-field="customLabel" value="${escapeHtml(state.roll.customLabel)}" placeholder="Initiative, healing…"></label>
    <label class="field"><span class="field-label">Dice notation</span><input data-roll-field="customNotation" value="${escapeHtml(state.roll.customNotation)}" placeholder="2d6 + 3" autocapitalize="off" spellcheck="false"></label>
  </div>`;
}

const MODIFIER_CATEGORIES = {
  target: { label: "Target modifiers", groups: ["Target conditions", "Target defenses"] },
  conditions: { label: "Conditions", groups: ["Your conditions", "Your defenses"] },
  support: { label: "Support & spells", groups: ["Spells & support", "Damage riders"] },
  combat: { label: "Combat modifiers", groups: ["Situational", "Equipment & styles", "Weapon mastery", "Magic items"] },
  features: { label: "Features", groups: ["Character features", "Class features", "Species traits", "Feats", "Custom"] }
};

export function rollFamily(context) {
  return ["attack", "damage"].includes(context) ? "weapon" : context;
}

export function renderAppliedModifiers(state) {
  const active = getApplicableEffects(state, effectContextsForRoll(state));
  if (!active.length) return '<span class="applied-empty">No modifiers applied to this roll</span>';
  return active.map(effect => `<button class="applied-chip" type="button" data-clear-effect="${effect.id}" title="Remove ${escapeHtml(effect.name)}">${escapeHtml(effect.name)} <span>${escapeHtml(entryValue(effect.entries, state, effect))} ×</span></button>`).join("");
}

export function renderRollSubrail(state) {
  const family = rollFamily(state.roll.context);
  const c = state.character;
  if (family === "weapon") {
    const selectedWeapon = c.weapons.find(weapon => weapon.id === state.roll.selectedWeaponId) || c.weapons[0];
    const weaponOptions = c.weapons.map(weapon => `<button class="option-chip ${weapon.id === state.roll.selectedWeaponId ? "is-active" : ""}" type="button" data-select-weapon="${weapon.id}">${escapeHtml(weapon.name)}</button>`).join("");
    const attackMode = /thrown/i.test(selectedWeapon?.properties || "") ? `<span class="subcontext-divider"></span><span class="subcontext-label">Use</span><button class="option-chip ${state.roll.attackMode !== "ranged" ? "is-active" : ""}" type="button" data-attack-mode="melee">Melee</button><button class="option-chip ${state.roll.attackMode === "ranged" ? "is-active" : ""}" type="button" data-attack-mode="ranged">Thrown</button>` : "";
    const contextual = state.roll.context === "attack"
      ? `<span class="subcontext-divider"></span>${targetButton(state)}`
      : `<span class="subcontext-divider"></span><label class="subcontext-field critical-chip"><input data-roll-field="critical" type="checkbox" ${state.roll.critical ? "checked" : ""}>Critical hit</label>${targetButton(state)}`;
    return `<span class="subcontext-label">Roll</span><button class="option-chip ${state.roll.context === "attack" ? "is-active" : ""}" type="button" data-context="attack">Attack</button><button class="option-chip ${state.roll.context === "damage" ? "is-active" : ""}" type="button" data-context="damage">Damage</button><span class="subcontext-divider"></span><span class="subcontext-label">Weapon</span>${weaponOptions || '<span class="applied-empty">No weapons</span>'}<button class="option-chip" type="button" data-action="add-weapon" aria-label="Add weapon" title="Add weapon">＋ Add</button>${attackMode}${contextual}`;
  }
  if (family === "spell") {
    const groups = availableSpells(state);
    const spell = selectedSpell(state);
    const phase = spell?.attack && state.roll.spellPhase !== "damage" ? "attack" : "damage";
    const damage = spellDamage(spell, c.level, state.roll.spellSlotLevel, state.roll.spellDamageIndex);
    return `<label class="subcontext-field spell-picker"><span>Spell</span><select data-roll-field="selectedSpellId" aria-label="Spell">${spellPickerGroups(groups, state)}</select></label>
      ${spell?.attack && spell.damages.length ? `<span class="subcontext-divider"></span><span class="subcontext-label">Roll</span><button class="option-chip ${phase === "attack" ? "is-active" : ""}" type="button" data-spell-phase="attack">Attack</button><button class="option-chip ${phase === "damage" ? "is-active" : ""}" type="button" data-spell-phase="damage">Damage</button>` : ""}
      ${phase === "damage" && spell?.level > 0 ? `<label class="subcontext-field"><span>Cast</span><select data-roll-field="spellSlotLevel" aria-label="Spell slot level">${slotOptions(spell.level, state.roll.spellSlotLevel, groups.maxLevel)}</select></label>` : ""}
      ${phase === "damage" && spell?.damages.length > 1 ? `<label class="subcontext-field"><span>Damage</span><select data-roll-field="spellDamageIndex" aria-label="Damage roll">${spell.damages.map((entry,index) => `<option value="${index}" ${index === Number(state.roll.spellDamageIndex) ? "selected" : ""}>${escapeHtml(entry.notation)} ${escapeHtml(entry.damageType)}</option>`).join("")}</select></label>` : ""}
      ${phase === "attack" ? `${targetButton(state)}` : ""}
      ${phase === "damage" && spell?.attack ? `<label class="subcontext-field critical-chip"><input data-roll-field="critical" type="checkbox" ${state.roll.critical ? "checked" : ""}>Critical</label>` : ""}
      ${phase === "damage" ? targetButton(state) : ""}${phase === "damage" ? `<span class="spell-damage-summary">${escapeHtml(damage.notation)} · ${escapeHtml(damage.damageType)}</span>` : ""}<button class="option-chip" type="button" data-action="add-spell" aria-label="Add spell preset" title="Add spell preset">＋ Add</button>`;
  }
  if (family === "skill") return `<span class="subcontext-label">Check</span>${CHECKS.map(check => `<button class="option-chip ${check.key === state.roll.selectedSkill ? "is-active" : ""}" type="button" data-select-skill="${check.key}">${escapeHtml(check.label)} ${signed(checkModifier(state, check))}</button>`).join("")}`;
  if (family === "save") return `<span class="subcontext-label">Saving throw</span>${ABILITIES.map(ability => `<button class="option-chip ${ability.key === state.roll.selectedSave ? "is-active" : ""}" type="button" data-select-save="${ability.key}">${ability.short} ${signed(saveModifier(state, ability.key))}</button>`).join("")}<button class="option-chip ${state.roll.selectedSave === "death" ? "is-active" : ""}" type="button" data-select-save="death">Death +0</button>`;
  return `<span class="subcontext-label">Custom</span><label class="subcontext-field wide">Name <input data-roll-field="customLabel" value="${escapeHtml(state.roll.customLabel)}" placeholder="Initiative"></label><label class="subcontext-field wide">Dice <input data-roll-field="customNotation" value="${escapeHtml(state.roll.customNotation)}" placeholder="2d6 + 3" autocapitalize="off" spellcheck="false"></label>`;
}

export function renderDiceLoadout(state, plan) {
  const shownDice = plan.dice.slice(0, 16).map(die => {
    const source = die.critical ? `${die.label || "Base"} · critical` : die.label || (die.d20 ? "D20" : "Base dice");
    const dieClass = [4, 8].includes(Number(die.sides)) ? `is-d${die.sides}` : `is-d${die.sides}`;
    return `<div class="die-token ${dieClass}"><strong>d${die.sides}</strong><span class="die-source">${escapeHtml(source)}</span></div>`;
  });
  if (plan.dice.length > 16) shownDice.push(`<div class="flat-token"><strong>+${plan.dice.length - 16}</strong><small>more dice</small></div>`);
  if (Number(plan.base.modifier)) shownDice.push(flatToken(signed(plan.base.modifier), "Base modifier"));
  plan.effects.forEach(effect => effect.entries.forEach(entry => {
    if (entry.afterRoll) shownDice.push(flatToken(`${entry.notation} ready`, `${entry.label} · after roll`));
    if (entry.kind === "flat") shownDice.push(flatToken(signed(entry.value), entry.label));
    if (entry.kind === "proficiency") shownDice.push(flatToken(signed(state.character.proficiencyBonus), entry.label));
    if (entry.kind === "halfProficiency") shownDice.push(flatToken(signed(Math.floor(state.character.proficiencyBonus / 2)), entry.label));
    if (entry.kind === "multiplier") shownDice.push(flatToken(`×${entry.value}`, entry.label));
    if (entry.kind === "targetAC") shownDice.push(flatToken(`AC ${signed(entry.value)}`, entry.label));
    if (entry.kind === "saveDC") shownDice.push(flatToken(`DC ${signed(entry.value)}`, entry.label));
    if (entry.kind === "d20Floor") shownDice.push(flatToken(`d20 ≥ ${entry.value}`, entry.label));
    if (entry.kind === "dieFloor") shownDice.push(flatToken(`die ≥ ${entry.value}`, entry.label));
    if (entry.kind === "rerollValues") shownDice.push(flatToken(`reroll ${entry.values.join("/")}`, entry.label));
    if (entry.kind === "rerollChoice") shownDice.push(flatToken("reroll ready", entry.label));
    if (entry.kind === "rollTwice") shownDice.push(flatToken("keep higher", entry.label));
    if (entry.kind === "criticalOnHit") shownDice.push(flatToken("critical", entry.label));
    if (entry.kind === "criticalDamage") shownDice.push(flatToken("double dice", entry.label));
    if (entry.kind === "blocked") shownDice.push(flatToken("blocked", entry.label));
    if (entry.kind === "automaticFailure") shownDice.push(flatToken("auto fail", entry.label));
    if (entry.kind === "missToHit") shownDice.push(flatToken("miss → hit", entry.label));
    if (entry.kind === "ignoreResistance") shownDice.push(flatToken("ignore resist", entry.label));
    if (entry.kind === "damageThreshold") shownDice.push(flatToken(`threshold ${entry.value}`, entry.label));
  }));
  return shownDice.join("") || '<span class="applied-empty">Enter valid dice notation</span>';
}

export function renderModifierPopover(state, category, query = "") {
  if (category === "mode") {
    const mode = state.roll.modeOverride || "normal";
    return `<div class="mode-options">${["disadvantage", "normal", "advantage"].map(value => `<button class="${value === mode ? "is-active" : ""}" type="button" data-mode="${value}">${title(value)}</button>`).join("")}</div><p class="field-note">This manual choice overrides advantage or disadvantage supplied by active modifiers.</p>`;
  }
  const needle = query.trim().toLowerCase();
  const definition = MODIFIER_CATEGORIES[category];
  const rollContexts = effectContextsForRoll(state);
  let catalog = effectCatalog(state).filter(effect => effect.rulesets?.includes(state.ruleset) || effect.rulesets?.includes("all"));
  if (definition) catalog = catalog.filter(effect => definition.groups.includes(effect.group || "Custom"));
  if (needle) catalog = catalog.filter(effect => [effect.name, effect.group, effect.summary].some(value => String(value || "").toLowerCase().includes(needle)));
  if (category === "target") catalog = catalog.filter(effect => effectMatchesRollScope(state, effect) && effect.entries.some(entry => entry.contexts.some(context => rollContexts.includes(context)) && entryMatchesRoll(state, entry)));
  if (!catalog.length) return '<div class="empty-inline">No matching modifiers.</div>';
  const active = new Set([...(state.activeEffects || []), ...(state.roll.selectedEffects || [])]);
  const grouped = groupBy(catalog);
  const targetFields = category === "target" ? `<div class="field-grid"><label class="field"><span class="field-label">Target name</span><input data-roll-field="targetName" value="${escapeHtml(state.roll.targetName)}" placeholder="Optional"></label>${rollContexts.includes("attack") ? `<label class="field"><span class="field-label">Armor Class</span><input data-roll-field="targetAC" value="${escapeHtml(state.roll.targetAC)}" type="number" min="1" max="40" placeholder="Optional AC"></label>` : ""}</div><p class="field-note">Only choices for this roll are shown. Selections stay remembered across roll types.</p>` : "";
  return targetFields + Object.entries(grouped).map(([group, effects]) => `<section><h3 class="modifier-group-title">${escapeHtml(group)}</h3>${effects.map(effect => {
    const entries = effect.entries?.filter(entry => entry.contexts.some(context => rollContexts.includes(context)) && entryMatchesRoll(state, entry)) || [];
    const contexts = [...new Set(effect.entries.flatMap(entry => entry.contexts))].map(title).join(", ");
    const applicable = entries.length > 0 && effectMatchesRollScope(state, effect);
    return `<div class="modifier-choice"><label class="modifier-option ${applicable ? "" : "is-disabled"}"><input type="checkbox" data-roll-effect="${effect.id}" ${active.has(effect.id) ? "checked" : ""} ${applicable ? "" : "disabled"}><span><strong>${escapeHtml(effect.name)}</strong><small>${escapeHtml(applicable ? effect.summary : `Applies to ${contexts}`)}</small></span><span class="modifier-value">${applicable ? escapeHtml(entryValue(entries, state, effect)) : "—"}</span></label>${effect.configurable || effect.custom ? `<button class="text-btn configure-modifier" type="button" data-config-effect="${effect.id}" aria-label="Configure ${escapeHtml(effect.name)}">${effect.id === "bardic-inspiration" ? `Bard level ${bardLevel(state)} · Configure` : "Configure"}</button>` : ""}<small class="usage-note">${effect.usage === "single" ? "One use · asks to remove after use" : effect.usage === "turn" ? "Limited use · asks to remove after use" : "Remembered until removed"}</small></div>`;
  }).join("")}</section>`).join("");
}

export function modifierCategoryLabel(category, query = "") {
  if (category === "mode") return "Roll mode";
  if (category === "search") return query ? `Results for “${query}”` : "All modifiers";
  return MODIFIER_CATEGORIES[category]?.label || "Modifiers";
}

function flatToken(value, label) {
  return `<div class="flat-token"><strong>${escapeHtml(value)}</strong><small>${escapeHtml(label)}</small></div>`;
}

export function renderRollModifiers(state) {
  const catalog = effectCatalog(state).filter(effect => (effect.rulesets || []).includes(state.ruleset) || (effect.rulesets || []).includes("all"));
  const relevant = catalog.filter(effect => effect.entries?.some(entry => entry.contexts.includes(state.roll.context) && entryMatchesRoll(state, entry)));
  if (!relevant.length) return `<div class="empty-inline">No saved modifiers apply to this roll.</div>`;
  const active = new Set([...(state.activeEffects || []), ...(state.roll.selectedEffects || [])]);
  return relevant.map(effect => {
    const entries = effect.entries.filter(entry => entry.contexts.includes(state.roll.context) && entryMatchesRoll(state, entry));
    return `<label class="modifier-row">
      <input type="checkbox" data-roll-effect="${effect.id}" ${active.has(effect.id) ? "checked" : ""}>
      <span><strong>${escapeHtml(effect.name)}</strong><small>${escapeHtml(effect.group || "Custom")}${state.activeEffects.includes(effect.id) ? " · stays active" : ""}</small></span>
      <span class="modifier-value">${escapeHtml(entryValue(entries, state, effect))}</span>
    </label>`;
  }).join("");
}

export function renderCharacter(state) {
  const c = state.character;
  return `<div class="panel-stack">
    <section class="panel">
      <div class="panel-head"><h2>Basics</h2><span class="field-note">Saved only on this device</span></div>
      ${c.imported && classSummary(c) ? `<div class="imported-character-note"><span>Imported character</span><strong>${escapeHtml(classSummary(c))}</strong></div>` : ""}<div class="field-grid">
        <label class="field span-2"><span class="field-label">Character name</span><input data-character="name" value="${escapeHtml(c.name)}"></label>
        <label class="field"><span class="field-label">Level</span><input data-character="level" type="number" min="1" max="20" value="${c.level}"></label>
        <label class="field"><span class="field-label">Proficiency bonus</span><input data-character="proficiencyBonus" type="number" min="2" max="9" value="${c.proficiencyBonus}"></label>
        <label class="field"><span class="field-label">Spellcasting ability</span><select data-character="spellAbility">${ABILITIES.map(a => `<option value="${a.key}" ${a.key === c.spellAbility ? "selected" : ""}>${a.label}</option>`).join("")}</select></label>
        <label class="field"><span class="field-label">Spell attack override</span><input data-character="spellAttackBonus" type="number" value="${c.spellAttackBonus ?? ""}" placeholder="Calculated"></label>
      </div>
    </section>
    <section class="panel">
      <div class="panel-head"><h2>Ability scores</h2><span class="field-note">Modifier shown below</span></div>
      <div class="ability-grid">${ABILITIES.map(a => `<div class="ability"><label for="ability-${a.key}">${a.short}</label><input id="ability-${a.key}" data-ability="${a.key}" type="number" min="1" max="30" value="${c.abilities[a.key]}"><output>${signed(abilityModifier(c.abilities[a.key]))}</output></div>`).join("")}</div>
    </section>
    <section class="panel">
      <div class="panel-head"><h2>Skills & saves</h2><span class="field-note">Tap rank to cycle none → proficient → expertise</span></div>
      <div class="data-list">${SKILLS.map(skill => `<div class="data-row"><div><strong>${skill.label}</strong><small>${skill.ability.toUpperCase()}</small></div><span>${signed(checkModifier(state, skill))}</span><button class="mini-btn" type="button" data-skill-rank="${skill.key}">${rankLabel(c.skills[skill.key])}</button></div>`).join("")}</div>
      <div class="section-title-row spaced-title"><h2>Saving throws</h2></div>
      <div class="data-list">${ABILITIES.map(a => `<div class="data-row"><div><strong>${a.label}</strong><small>Saving throw</small></div><span>${signed(saveModifier(state, a.key))}</span><button class="mini-btn" type="button" data-save-rank="${a.key}">${rankLabel(c.saves[a.key])}</button></div>`).join("")}</div>
    </section>
    <section class="panel">
      <div class="panel-head"><h2>Weapons</h2><button class="text-btn" type="button" data-action="add-weapon">+ Add weapon</button></div>
      <div class="data-list">${c.weapons.length ? c.weapons.map(weapon => `<div class="data-row"><div><strong>${escapeHtml(weapon.name)}</strong><small>${escapeHtml(weapon.damage)} ${escapeHtml(weapon.damageType)} · ${weapon.ability.toUpperCase()}</small></div><span class="row-meta">Attack ${signed(weaponAttack(state, weapon))}</span><div class="row-actions"><button class="mini-btn" type="button" data-edit-weapon="${weapon.id}" aria-label="Edit ${escapeHtml(weapon.name)}">Edit</button><button class="mini-btn danger" type="button" data-delete-weapon="${weapon.id}" aria-label="Delete ${escapeHtml(weapon.name)}">×</button></div></div>`).join("") : '<div class="empty-inline">No weapons yet.</div>'}</div>
    </section>
    <section class="panel">
      <div class="panel-head"><h2>Spells</h2><button class="text-btn" type="button" data-action="add-spell">+ Add spell</button></div>
      <div class="data-list">${c.spells.length ? c.spells.map(spell => `<div class="data-row"><div><strong>${spell.imported ? '<span class="known-mark">★</span> ' : ""}${escapeHtml(spell.name)}</strong><small>${spell.imported ? "Imported spell" : labelRollType(spell.rollType)}${spell.damage ? ` · ${escapeHtml(spell.damage)}` : ""}</small></div><span class="row-meta">${spell.rollType === "attack" ? `Attack ${signed(spell.attackBonus ?? spellAttack(state))}` : spell.rollType === "save" ? `Save DC ${spell.saveDC || spellSaveDC(state)}` : escapeHtml(spell.damageType || "")}</span><div class="row-actions"><button class="mini-btn" type="button" data-edit-spell="${spell.id}">Edit</button><button class="mini-btn danger" type="button" data-delete-spell="${spell.id}">×</button></div></div>`).join("") : '<div class="empty-inline">No character spells or custom presets yet. The full SRD catalog is available on the Spellcasting rail.</div>'}</div>
    </section>
    <section class="panel">
      <div class="panel-head"><h2>Equipment</h2><button class="text-btn" type="button" data-action="add-item">+ Add item</button></div>
      <div class="data-list">${(c.items || []).length ? c.items.map((item, index) => `<div class="data-row"><div><strong>${escapeHtml(typeof item === "string" ? item : item.name)}</strong><small>Carried item</small></div><span></span><button class="mini-btn danger" type="button" data-delete-item="${index}">×</button></div>`).join("") : '<div class="empty-inline">Imported and manually added items appear here.</div>'}</div>
    </section>
    <section class="panel">
      <div class="panel-head"><h2>Backup</h2></div>
      <div class="row-actions"><button class="mini-btn" type="button" data-action="export-backup">Export data</button><button class="mini-btn" type="button" data-action="import-backup">Import data</button><input id="backupInput" type="file" accept="application/json,.json" hidden></div>
    </section>
  </div>`;
}

export function renderEffects(state) {
  const catalog = effectCatalog(state).filter(effect => effect.rulesets.includes(state.ruleset) || effect.rulesets.includes("all"));
  const groups = Object.groupBy ? Object.groupBy(catalog, effect => effect.group || "Custom") : groupBy(catalog);
  return Object.entries(groups).map(([group, effects]) => `<section class="effect-section"><div class="section-title-row"><h2>${escapeHtml(group)}</h2><span class="field-note">${effects.length} options</span></div><div class="effect-grid">${effects.map(effect => `<article class="effect-card ${state.activeEffects.includes(effect.id) ? "is-active" : ""}"><div><strong>${escapeHtml(effect.name)}</strong><p>${escapeHtml(effect.summary)}</p>${effect.configurable || effect.custom ? `<button class="text-btn" type="button" data-config-effect="${effect.id}">Configure</button>` : ""}</div><label class="switch"><input type="checkbox" data-active-effect="${effect.id}" ${state.activeEffects.includes(effect.id) ? "checked" : ""} aria-label="Toggle ${escapeHtml(effect.name)}"><span></span></label></article>`).join("")}</div></section>`).join("");
}

export function renderHistory(state) {
  if (!state.history.length) return `<div class="empty-state"><strong>No rolls yet</strong>Your attack, damage, spell, skill, and save rolls will appear here.</div>`;
  return `<div class="history-list">${state.history.map(entry => `<article class="history-row"><div class="history-total">${entry.total}</div><div><strong>${escapeHtml(entry.label)}</strong><small>${escapeHtml(entry.notation)}${entry.detail ? ` · ${escapeHtml(entry.detail)}` : ""}</small></div><time class="history-time">${formatTime(entry.at)}</time></article>`).join("")}</div>`;
}

export function weaponForm(weapon = {}) {
  weapon ||= {};
  return `<form class="form-stack" id="weaponForm">
    <label class="field"><span class="field-label">Start from a standard weapon</span><select id="weaponLibrary"><option value="">Custom weapon</option>${WEAPON_LIBRARY.map((w,i) => `<option value="${i}">${w.name} · ${w.damage}</option>`).join("")}</select></label>
    <label class="field"><span class="field-label">Name</span><input name="name" required value="${escapeHtml(weapon.name || "")}"></label>
    <div class="field-grid">
      <label class="field"><span class="field-label">Attack ability</span><select name="ability">${ABILITIES.map(a => `<option value="${a.key}" ${a.key === (weapon.ability || "str") ? "selected" : ""}>${a.label}</option>`).join("")}</select></label>
      <label class="check-chip"><input name="proficient" type="checkbox" ${weapon.proficient !== false ? "checked" : ""}><span>Proficient</span></label>
      <label class="field"><span class="field-label">Damage dice</span><input name="damage" required value="${escapeHtml(weapon.damage || "1d8")}" placeholder="1d8"></label>
      <label class="field"><span class="field-label">Damage type</span><select name="damageType">${DAMAGE_TYPES.map(type => `<option ${type === weapon.damageType ? "selected" : ""}>${type}</option>`).join("")}</select></label>
      <label class="field"><span class="field-label">Extra attack bonus</span><input name="attackBonus" type="number" value="${weapon.attackBonus ?? ""}" placeholder="0"></label>
      <label class="field"><span class="field-label">Extra damage bonus</span><input name="damageBonus" type="number" value="${weapon.damageBonus ?? 0}"></label>
    </div>
    <label class="check-chip"><input name="damageAbility" type="checkbox" ${weapon.damageAbility !== false ? "checked" : ""}><span>Add ability modifier to damage</span></label>
    <label class="field"><span class="field-label">Properties / notes</span><input name="properties" value="${escapeHtml(weapon.properties || "")}"></label>
  </form>`;
}

export function spellForm(spell = {}) {
  spell ||= {};
  return `<form class="form-stack" id="spellForm">
    <label class="field"><span class="field-label">Name</span><input name="name" required value="${escapeHtml(spell.name || "")}"></label>
    <label class="field"><span class="field-label">What do you roll?</span><select name="rollType"><option value="attack" ${spell.rollType === "attack" ? "selected" : ""}>Spell attack</option><option value="damage" ${spell.rollType === "damage" ? "selected" : ""}>Damage / healing dice</option><option value="save" ${spell.rollType === "save" ? "selected" : ""}>Target saving throw, then damage</option></select></label>
    <div class="field-grid">
      <label class="field"><span class="field-label">Damage dice</span><input name="damage" value="${escapeHtml(spell.damage || "1d8")}"></label>
      <label class="field"><span class="field-label">Damage type</span><select name="damageType">${DAMAGE_TYPES.map(type => `<option ${type === spell.damageType ? "selected" : ""}>${type}</option>`).join("")}</select></label>
      <label class="field"><span class="field-label">Attack override</span><input name="attackBonus" type="number" value="${spell.attackBonus ?? ""}" placeholder="Character default"></label>
      <label class="field"><span class="field-label">Save DC override</span><input name="saveDC" type="number" value="${spell.saveDC ?? ""}" placeholder="Character default"></label>
    </div>
  </form>`;
}

export function effectForm(effect = {}) {
  effect ||= {};
  const entry = effect.entries?.[0] || {};
  return `<form class="form-stack" id="effectForm">
    <label class="field"><span class="field-label">Name</span><input name="name" required value="${escapeHtml(effect.name || "")}" placeholder="Potion bonus, favored enemy…"></label>
    <label class="field"><span class="field-label">Usage</span><select name="usage"><option value="persistent" ${!effect.usage || effect.usage === "persistent" ? "selected" : ""}>Lasting effect</option><option value="single" ${effect.usage === "single" ? "selected" : ""}>One use — ask to remove after use</option><option value="turn" ${effect.usage === "turn" ? "selected" : ""}>Once per turn — ask to remove after use</option></select></label>
    <label class="field"><span class="field-label">Description</span><textarea name="summary" placeholder="When this modifier applies">${escapeHtml(effect.summary || "")}</textarea></label>
    <div class="field"><span class="field-label">Applies to</span><div class="check-grid">${["attack","damage","spell","skill","save","custom"].map(context => `<label class="check-chip"><input type="checkbox" name="contexts" value="${context}" ${entry.contexts?.includes(context) ? "checked" : ""}>${title(context)}</label>`).join("")}</div></div>
    <label class="field"><span class="field-label">Modifier type</span><select name="kind"><option value="die" ${entry.kind === "die" ? "selected" : ""}>Bonus or penalty dice</option><option value="flat" ${entry.kind === "flat" ? "selected" : ""}>Flat number</option><option value="proficiency" ${entry.kind === "proficiency" ? "selected" : ""}>Proficiency Bonus</option><option value="halfProficiency" ${entry.kind === "halfProficiency" ? "selected" : ""}>Half Proficiency Bonus</option><option value="advantage" ${entry.mode === "advantage" ? "selected" : ""}>Advantage</option><option value="disadvantage" ${entry.mode === "disadvantage" ? "selected" : ""}>Disadvantage</option><option value="targetAC" ${entry.kind === "targetAC" ? "selected" : ""}>Target AC change</option><option value="multiplier" ${entry.kind === "multiplier" ? "selected" : ""}>Damage multiplier</option><option value="ignoreResistance" ${entry.kind === "ignoreResistance" ? "selected" : ""}>Ignore damage resistance</option><option value="d20Floor" ${entry.kind === "d20Floor" ? "selected" : ""}>Minimum d20 result</option><option value="criticalRange" ${entry.kind === "criticalRange" ? "selected" : ""}>Critical threshold</option><option value="rerollValues" ${entry.kind === "rerollValues" ? "selected" : ""}>Reroll specific results</option><option value="rerollChoice" ${entry.kind === "rerollChoice" ? "selected" : ""}>Reroll one die after rolling</option><option value="dieFloor" ${entry.kind === "dieFloor" ? "selected" : ""}>Minimum die face</option><option value="rollTwice" ${entry.kind === "rollTwice" ? "selected" : ""}>Roll damage twice</option><option value="criticalOnHit" ${entry.kind === "criticalOnHit" ? "selected" : ""}>Automatic critical on hit</option><option value="criticalDamage" ${entry.kind === "criticalDamage" ? "selected" : ""}>Double damage dice</option><option value="missToHit" ${entry.kind === "missToHit" ? "selected" : ""}>Turn a miss into a hit</option><option value="saveDC" ${entry.kind === "saveDC" ? "selected" : ""}>Spell save DC change</option><option value="damageThreshold" ${entry.kind === "damageThreshold" ? "selected" : ""}>Damage threshold</option><option value="automaticFailure" ${entry.kind === "automaticFailure" ? "selected" : ""}>Automatic failure</option><option value="blocked" ${entry.kind === "blocked" ? "selected" : ""}>Roll blocked</option></select></label>
    <label class="field"><span class="field-label">Dice, value, or reroll faces</span><input name="value" value="${escapeHtml(entry.notation || entry.values?.join(",") || entry.value || "1d4")}" placeholder="1d4, -1d4, 2, or 1,2"><span class="field-note">For rerolls, enter die faces separated by commas. Types without a number ignore this field.</span></label>
    <label class="field"><span class="field-label">Damage type</span><select name="damageType"><option value="same">Same as the base damage</option>${DAMAGE_TYPES.map(type => `<option value="${type}" ${entry.damageType === type ? "selected" : ""}>${type}</option>`).join("")}</select></label>
  </form>`;
}

export function importModal() {
  return `<div class="form-stack"><label class="import-drop"><input id="characterFile" type="file" accept="application/pdf,application/json,.pdf,.json"><span><strong>Choose a D&D Beyond character file</strong><small>PDF character sheet or JSON export · nothing is uploaded</small></span></label><div id="importStatus" class="field-note">PDF import reads structured fields when the export exposes them. JSON gives the most complete result.</div></div>`;
}

export function helpContent(state) {
  return `<button class="modal-button primary" type="button" data-action="start-tutorial">Replay introduction tutorial</button><div class="help-section"><h3>Build a roll</h3><p>Choose a roll family on the bottom rail, then use the thin rail above it to select the weapon, spell, skill, save, or damage roll. Add situational modifiers from the grouped controls along the top, or search the full modifier list. The center platform always shows the dice and numeric modifiers that will be rolled.</p></div>
    <div class="help-section"><h3>Advantage and disadvantage</h3><p>Use the mode control at the right of the applied-modifier rail for a manual choice. Active conditions can also set the mode automatically. Advantage and disadvantage cancel one another regardless of how many sources apply.</p></div>
    <div class="help-section"><h3>What the app calculates</h3><ul><li>Attack and spell attack modifiers</li><li>Damage dice, critical dice, damage riders, resistance, and vulnerability</li><li>Skill and saving throw proficiency or expertise</li><li>Cover as adjusted target AC</li><li>2014 and 2024 rule-specific presets</li></ul></div>
    <div class="help-section"><h3>Import privacy</h3><p>Character files are read in your browser. Character data and roll history stay in this browser’s local storage.</p></div>
    <div class="help-section"><h3>Rules boundary</h3><p>This is a calculation aid, not a substitute for your character sheet or the rulebook. A preset says what arithmetic to apply. You still decide whether its triggering requirements are satisfied.</p></div>
    <div class="help-section license-copy"><h3>Open rules attribution</h3><p>This work includes material taken from the System Reference Document 5.1 (“SRD 5.1”) by Wizards of the Coast LLC and available at <a href="https://www.dndbeyond.com/srd" target="_blank" rel="noreferrer">dndbeyond.com/srd</a>. The SRD 5.1 is licensed under the <a href="https://creativecommons.org/licenses/by/4.0/legalcode" target="_blank" rel="noreferrer">Creative Commons Attribution 4.0 International License</a>.</p><p>This work includes material from the System Reference Document 5.2.1 (“SRD 5.2.1”) by Wizards of the Coast LLC, available at <a href="https://www.dndbeyond.com/srd" target="_blank" rel="noreferrer">dndbeyond.com/srd</a>. The SRD 5.2.1 is licensed under the Creative Commons Attribution 4.0 International License.</p><p>Current preset view: ${escapeHtml(state.ruleset)} rules.</p></div>`;
}

export function toast(message) {
  const element = document.createElement("div");
  element.className = "toast";
  element.textContent = message;
  $("#toastRegion").append(element);
  setTimeout(() => element.remove(), 3200);
}

export function entryValue(entries, state, effect) {
  return entries.map(entry => {
    if (entry.kind === "die") { const notation = effect.id === "bardic-inspiration" ? bardDie(bardLevel(state)) : state.effectConfig?.[effect.id]?.notation || entry.notation; return `${notation}${entry.afterRoll ? " after roll" : ""}`; }
    if (entry.kind === "mode") return title(entry.mode);
    if (entry.kind === "proficiency") return `+${state.character.proficiencyBonus}`;
    if (entry.kind === "halfProficiency") return `+${Math.floor(state.character.proficiencyBonus / 2)}`;
    if (entry.kind === "multiplier") return `×${entry.value}`;
    if (entry.kind === "targetAC") return `AC ${signed(entry.value)}`;
    if (entry.kind === "saveDC") return `DC ${signed(entry.value)}`;
    if (entry.kind === "d20Floor") return `d20 ≥ ${entry.value}`;
    if (entry.kind === "criticalRange") return `critical ${entry.value}+`;
    if (entry.kind === "rerollValues") return `reroll ${entry.values.join("/")}`;
    if (entry.kind === "rerollChoice") return "reroll ready";
    if (entry.kind === "dieFloor") return `die ≥ ${entry.value}`;
    if (entry.kind === "rollTwice") return "keep higher";
    if (entry.kind === "criticalOnHit") return "critical on hit";
    if (entry.kind === "criticalDamage") return "double dice";
    if (entry.kind === "automaticFailure") return "auto fail";
    if (entry.kind === "blocked") return "blocked";
    if (entry.kind === "damageThreshold") return `threshold ${entry.value}`;
    if (entry.kind === "missToHit") return "miss becomes hit";
    if (entry.kind === "ignoreResistance") return "ignore resistance";
    if (entry.kind === "flat" && state.effectConfig?.[effect.id]?.notation) return state.effectConfig[effect.id].notation;
    return signed(entry.value);
  }).join(" / ");
}

function checkModifier(state, check) { return abilityModifier(state.character.abilities[check.ability]) + (check.special ? 0 : Number(state.character.skills[check.key] || 0) * Number(state.character.proficiencyBonus || 0)); }
function saveModifier(state, ability) { return abilityModifier(state.character.abilities[ability]) + Number(state.character.saves[ability] || 0) * Number(state.character.proficiencyBonus || 0); }
function weaponAttack(state, weapon) { return abilityModifier(state.character.abilities[weapon.ability]) + (weapon.proficient ? Number(state.character.proficiencyBonus || 0) : 0) + Number(weapon.attackBonus || 0); }
function spellAttack(state) { return state.character.spellAttackBonus ?? abilityModifier(state.character.abilities[state.character.spellAbility]) + Number(state.character.proficiencyBonus || 0); }
function spellSaveDC(state) { return state.character.spellSaveDC ?? 8 + abilityModifier(state.character.abilities[state.character.spellAbility]) + Number(state.character.proficiencyBonus || 0); }
function rankLabel(rank) { return Number(rank) === 2 ? "Expert" : Number(rank) === 1 ? "Proficient" : "None"; }
function labelRollType(type) { return type === "damage" ? "Damage" : type === "save" ? "Save + damage" : "Attack"; }
function spellOptions(spells, selectedId, known) {
  return spells.map(spell => `<option value="${spell.id}" ${spell.id === selectedId ? "selected" : ""}>${known ? "★ " : ""}${escapeHtml(spell.name)} · ${spell.level ? `L${spell.level}` : "Cantrip"}</option>`).join("");
}
function spellPickerGroups(groups, state) {
  const name = escapeHtml(state.character.name);
  const prepared = groups.known.filter(spell => spell.prepared === true);
  const other = groups.known.filter(spell => spell.prepared !== true);
  const characterGroups = [
    prepared.length ? `<optgroup label="★ ${name}’s prepared spells">${spellOptions(prepared, state.roll.selectedSpellId, true)}</optgroup>` : "",
    other.length ? `<optgroup label="★ ${name}’s ${prepared.length ? "other spells" : "spells"}">${spellOptions(other, state.roll.selectedSpellId, true)}</optgroup>` : ""
  ].join("");
  const access = groups.maxLevel == null ? "" : groups.maxLevel < 0 ? " · no class spell slots" : groups.maxLevel === 0 ? " · cantrips" : ` · through L${groups.maxLevel}`;
  const library = groups.library.length
    ? `<optgroup label="Available SRD ${state.ruleset === "2014" ? "5.1" : "5.2.1"}${access}">${spellOptions(groups.library, state.roll.selectedSpellId, false)}</optgroup>`
    : "";
  return characterGroups + library || '<option value="">No rollable spells available</option>';
}
function slotOptions(minimum, selected, maximum = null) {
  const limit = maximum == null ? 9 : Math.max(minimum, Math.min(9, maximum));
  const current = Math.min(limit, Math.max(minimum, Number(selected || minimum)));
  return Array.from({ length: limit - minimum + 1 }, (_, index) => index + minimum)
    .map(level => `<option value="${level}" ${level === current ? "selected" : ""}>Level ${level}</option>`).join("");
}
function title(value) { return String(value).replace(/(^|-)\w/g, text => text.replace("-", " ").toUpperCase()); }
function formatTime(value) { return new Intl.DateTimeFormat([], { hour: "numeric", minute: "2-digit" }).format(new Date(value)); }
function groupBy(items) { return items.reduce((groups,item) => { (groups[item.group || "Custom"] ||= []).push(item); return groups; }, {}); }

function targetButton(state) {
  const effects = getApplicableEffects(state, effectContextsForRoll(state)).filter(effect => effect.group.startsWith("Target"));
  return `<button class="option-chip target-trigger" type="button" data-modifier-category="target" aria-haspopup="dialog" aria-controls="modifierPopover">Target${state.roll.targetName ? `: ${escapeHtml(state.roll.targetName)}` : ""}${effects.length ? ` · ${effects.length}` : ""} ▴</button>`;
}

export function validateForm(form) {
  const invalid = [...form.elements].find(field => field.willValidate && !field.validity.valid);
  if (!invalid) return true;
  toast(invalid.validationMessage || "Complete the required fields.");
  invalid.setAttribute("aria-invalid", "true");
  invalid.focus();
  return false;
}
