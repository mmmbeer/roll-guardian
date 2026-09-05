import { ABILITIES, DAMAGE_TYPES, EFFECT_PRESETS, SKILLS, WEAPON_LIBRARY, effectsForRuleset } from "./rules-data.js";
import { abilityModifier } from "./state.js";
import { baseForContext, effectCatalog, getApplicableEffects } from "./roll-engine.js";

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
    return `<div class="field-grid"><label class="field span-2"><span class="field-label">Skill or check</span><select data-roll-field="selectedSkill">${SKILLS.map(skill => `<option value="${skill.key}" ${skill.key === state.roll.selectedSkill ? "selected" : ""}>${skill.label} · ${skill.ability.toUpperCase()} ${signed(skillModifier(state, skill))}</option>`).join("")}</select></label></div>`;
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

export function renderRollModifiers(state) {
  const catalog = effectCatalog(state).filter(effect => (effect.rulesets || []).includes(state.ruleset) || (effect.rulesets || []).includes("all"));
  const relevant = catalog.filter(effect => effect.entries?.some(entry => entry.contexts.includes(state.roll.context)));
  if (!relevant.length) return `<div class="empty-inline">No saved modifiers apply to this roll.</div>`;
  const active = new Set([...(state.activeEffects || []), ...(state.roll.selectedEffects || [])]);
  return relevant.map(effect => {
    const entries = effect.entries.filter(entry => entry.contexts.includes(state.roll.context));
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
      <div class="field-grid">
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
      <div class="data-list">${SKILLS.map(skill => `<div class="data-row"><div><strong>${skill.label}</strong><small>${skill.ability.toUpperCase()}</small></div><span>${signed(skillModifier(state, skill))}</span><button class="mini-btn" type="button" data-skill-rank="${skill.key}">${rankLabel(c.skills[skill.key])}</button></div>`).join("")}</div>
      <div class="section-title-row spaced-title"><h2>Saving throws</h2></div>
      <div class="data-list">${ABILITIES.map(a => `<div class="data-row"><div><strong>${a.label}</strong><small>Saving throw</small></div><span>${signed(saveModifier(state, a.key))}</span><button class="mini-btn" type="button" data-save-rank="${a.key}">${rankLabel(c.saves[a.key])}</button></div>`).join("")}</div>
    </section>
    <section class="panel">
      <div class="panel-head"><h2>Weapons</h2><button class="text-btn" type="button" data-action="add-weapon">+ Add weapon</button></div>
      <div class="data-list">${c.weapons.length ? c.weapons.map(weapon => `<div class="data-row"><div><strong>${escapeHtml(weapon.name)}</strong><small>${escapeHtml(weapon.damage)} ${escapeHtml(weapon.damageType)} · ${weapon.ability.toUpperCase()}</small></div><span class="row-meta">Attack ${signed(weaponAttack(state, weapon))}</span><div class="row-actions"><button class="mini-btn" type="button" data-edit-weapon="${weapon.id}" aria-label="Edit ${escapeHtml(weapon.name)}">Edit</button><button class="mini-btn danger" type="button" data-delete-weapon="${weapon.id}" aria-label="Delete ${escapeHtml(weapon.name)}">×</button></div></div>`).join("") : '<div class="empty-inline">No weapons yet.</div>'}</div>
    </section>
    <section class="panel">
      <div class="panel-head"><h2>Spells</h2><button class="text-btn" type="button" data-action="add-spell">+ Add spell</button></div>
      <div class="data-list">${c.spells.length ? c.spells.map(spell => `<div class="data-row"><div><strong>${escapeHtml(spell.name)}</strong><small>${labelRollType(spell.rollType)}${spell.damage ? ` · ${escapeHtml(spell.damage)}` : ""}</small></div><span class="row-meta">${spell.rollType === "attack" ? `Attack ${signed(spell.attackBonus ?? spellAttack(state))}` : spell.rollType === "save" ? `Save DC ${spell.saveDC || spellSaveDC(state)}` : escapeHtml(spell.damageType || "")}</span><div class="row-actions"><button class="mini-btn" type="button" data-edit-spell="${spell.id}">Edit</button><button class="mini-btn danger" type="button" data-delete-spell="${spell.id}">×</button></div></div>`).join("") : '<div class="empty-inline">No spell presets yet.</div>'}</div>
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
  const groups = Object.groupBy ? Object.groupBy([...effectsForRuleset(state.ruleset), ...(state.customEffects || [])], effect => effect.group || "Custom") : groupBy([...effectsForRuleset(state.ruleset), ...(state.customEffects || [])]);
  return Object.entries(groups).map(([group, effects]) => `<section class="effect-section"><div class="section-title-row"><h2>${escapeHtml(group)}</h2><span class="field-note">${effects.length} options</span></div><div class="effect-grid">${effects.map(effect => `<article class="effect-card ${state.activeEffects.includes(effect.id) ? "is-active" : ""}"><div><strong>${escapeHtml(effect.name)}</strong><p>${escapeHtml(effect.summary)}</p>${effect.configurable || effect.custom ? `<button class="text-btn" type="button" data-config-effect="${effect.id}">Configure</button>` : ""}</div><label class="switch"><input type="checkbox" data-active-effect="${effect.id}" ${state.activeEffects.includes(effect.id) ? "checked" : ""} aria-label="Toggle ${escapeHtml(effect.name)}"><span></span></label></article>`).join("")}</div></section>`).join("");
}

export function renderHistory(state) {
  if (!state.history.length) return `<div class="empty-state"><strong>No rolls yet</strong>Your attack, damage, spell, skill, and save rolls will appear here.</div>`;
  return `<div class="history-list">${state.history.map(entry => `<article class="history-row"><div class="history-total">${entry.total}</div><div><strong>${escapeHtml(entry.label)}</strong><small>${escapeHtml(entry.notation)}${entry.detail ? ` · ${escapeHtml(entry.detail)}` : ""}</small></div><time class="history-time">${formatTime(entry.at)}</time></article>`).join("")}</div>`;
}

export function weaponForm(weapon = {}) {
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
  const entry = effect.entries?.[0] || {};
  return `<form class="form-stack" id="effectForm">
    <label class="field"><span class="field-label">Name</span><input name="name" required value="${escapeHtml(effect.name || "")}" placeholder="Potion bonus, favored enemy…"></label>
    <label class="field"><span class="field-label">Description</span><textarea name="summary" placeholder="When this modifier applies">${escapeHtml(effect.summary || "")}</textarea></label>
    <div class="field"><span class="field-label">Applies to</span><div class="check-grid">${["attack","damage","spell","skill","save","custom"].map(context => `<label class="check-chip"><input type="checkbox" name="contexts" value="${context}" ${entry.contexts?.includes(context) ? "checked" : ""}>${title(context)}</label>`).join("")}</div></div>
    <label class="field"><span class="field-label">Modifier type</span><select name="kind"><option value="die" ${entry.kind === "die" ? "selected" : ""}>Extra dice</option><option value="flat" ${entry.kind === "flat" ? "selected" : ""}>Flat number</option><option value="advantage" ${entry.mode === "advantage" ? "selected" : ""}>Advantage</option><option value="disadvantage" ${entry.mode === "disadvantage" ? "selected" : ""}>Disadvantage</option><option value="targetAC" ${entry.kind === "targetAC" ? "selected" : ""}>Target AC change</option><option value="multiplier" ${entry.kind === "multiplier" ? "selected" : ""}>Damage multiplier</option></select></label>
    <label class="field"><span class="field-label">Dice or value</span><input name="value" value="${escapeHtml(entry.notation || entry.value || "1d4")}" placeholder="1d4 or 2"></label>
  </form>`;
}

export function importModal() {
  return `<div class="form-stack"><label class="import-drop"><input id="characterFile" type="file" accept="application/pdf,application/json,.pdf,.json"><span><strong>Choose a D&D Beyond character file</strong><small>PDF character sheet or JSON export · nothing is uploaded</small></span></label><div id="importStatus" class="field-note">PDF import reads structured fields when the export exposes them. JSON gives the most complete result.</div></div>`;
}

export function helpContent(state) {
  return `<div class="help-section"><h3>Build a roll</h3><p>Choose the context, select the weapon, spell, skill, or save, then switch on only the modifiers that apply. Persistent conditions and features can be kept active from the Effects page. Advantage and disadvantage cancel one another regardless of how many sources apply.</p></div>
    <div class="help-section"><h3>What the app calculates</h3><ul><li>Attack and spell attack modifiers</li><li>Damage dice, critical dice, damage riders, resistance, and vulnerability</li><li>Skill and saving throw proficiency or expertise</li><li>Cover as adjusted target AC</li><li>2014 and 2024 rule-specific presets</li></ul></div>
    <div class="help-section"><h3>Import privacy</h3><p>Character files are read in your browser. Character data and roll history stay in this browser’s local storage.</p></div>
    <div class="help-section"><h3>Rules boundary</h3><p>This is a calculation aid, not a substitute for your character sheet or the rulebook. A preset says what arithmetic to apply. You still decide whether its triggering requirements are satisfied.</p></div>
    <div class="help-section license-copy"><h3>Open rules attribution</h3><p>This work includes material taken from the System Reference Document 5.1 (“SRD 5.1”) by Wizards of the Coast LLC and available at <a href="https://www.dndbeyond.com/srd" target="_blank" rel="noreferrer">dndbeyond.com/srd</a>. The SRD 5.1 is licensed under the <a href="https://creativecommons.org/licenses/by/4.0/legalcode" target="_blank" rel="noreferrer">Creative Commons Attribution 4.0 International License</a>.</p><p>This work includes material from the System Reference Document 5.2.1 (“SRD 5.2.1”) by Wizards of the Coast LLC, available at <a href="https://www.dndbeyond.com/srd" target="_blank" rel="noreferrer">dndbeyond.com/srd</a>. The SRD 5.2.1 is licensed under the Creative Commons Attribution 4.0 International License.</p><p>Current preset view: ${escapeHtml(state.ruleset)} rules.</p></div>`;
}

export function openModal(title, body, footer = "") {
  $("#modalTitle").textContent = title;
  $("#modalBody").innerHTML = body;
  $("#modalFooter").innerHTML = footer;
  $("#modalBackdrop").hidden = false;
  document.body.style.overflow = "hidden";
  requestAnimationFrame(() => $("#modalBody input, #modalBody select, #modalBody button")?.focus());
}

export function closeModal() {
  $("#modalBackdrop").hidden = true;
  document.body.style.overflow = "";
}

export function toast(message) {
  const element = document.createElement("div");
  element.className = "toast";
  element.textContent = message;
  $("#toastRegion").append(element);
  setTimeout(() => element.remove(), 3200);
}

export function modalButtons(primary = "Save", includeDelete = false) {
  return `${includeDelete ? '<button class="modal-button danger" type="button" data-modal-delete>Delete</button>' : ""}<button class="modal-button" type="button" data-close-modal>Cancel</button><button class="modal-button primary" type="button" data-modal-save>${primary}</button>`;
}

export function entryValue(entries, state, effect) {
  return entries.map(entry => {
    if (entry.kind === "die") return state.effectConfig?.[effect.id]?.notation || entry.notation;
    if (entry.kind === "mode") return title(entry.mode);
    if (entry.kind === "proficiency") return `+${state.character.proficiencyBonus}`;
    if (entry.kind === "multiplier") return `×${entry.value}`;
    if (entry.kind === "targetAC") return `AC ${signed(entry.value)}`;
    if (entry.kind === "flat" && state.effectConfig?.[effect.id]?.notation) return state.effectConfig[effect.id].notation;
    return signed(entry.value);
  }).join(" / ");
}

function skillModifier(state, skill) { return abilityModifier(state.character.abilities[skill.ability]) + Number(state.character.skills[skill.key] || 0) * Number(state.character.proficiencyBonus || 0); }
function saveModifier(state, ability) { return abilityModifier(state.character.abilities[ability]) + Number(state.character.saves[ability] || 0) * Number(state.character.proficiencyBonus || 0); }
function weaponAttack(state, weapon) { return abilityModifier(state.character.abilities[weapon.ability]) + (weapon.proficient ? Number(state.character.proficiencyBonus || 0) : 0) + Number(weapon.attackBonus || 0); }
function spellAttack(state) { return state.character.spellAttackBonus ?? abilityModifier(state.character.abilities[state.character.spellAbility]) + Number(state.character.proficiencyBonus || 0); }
function spellSaveDC(state) { return state.character.spellSaveDC ?? 8 + abilityModifier(state.character.abilities[state.character.spellAbility]) + Number(state.character.proficiencyBonus || 0); }
function rankLabel(rank) { return Number(rank) === 2 ? "Expert" : Number(rank) === 1 ? "Proficient" : "None"; }
function labelRollType(type) { return type === "damage" ? "Damage" : type === "save" ? "Save + damage" : "Attack"; }
function title(value) { return String(value).replace(/(^|-)\w/g, text => text.replace("-", " ").toUpperCase()); }
function formatTime(value) { return new Intl.DateTimeFormat([], { hour: "numeric", minute: "2-digit" }).format(new Date(value)); }
function groupBy(items) { return items.reduce((groups,item) => { (groups[item.group || "Custom"] ||= []).push(item); return groups; }, {}); }
