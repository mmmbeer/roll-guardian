import { createDiceTray, playDiceSound } from "./dice-3d.js?v=1.3.2";
import { importCharacterFile } from "./importer.js?v=1.3.0";
import { buildRollPlan, effectCatalog, executeRoll, rerollOutcome } from "./roll-engine.js?v=1.3.0";
import { DAMAGE_TYPES } from "./rules-data.js?v=1.3.0";
import { createDefaultState, loadState, proficiencyForLevel, saveState, uid } from "./state.js?v=1.3.0";
import { selectedSpell } from "./spell-data.js?v=1.3.0";
import {
  $, $$, closeModal, effectForm, escapeHtml, helpContent, importModal, modalButtons,
  modifierCategoryLabel, openModal, renderAppliedModifiers, renderCharacter,
  renderDiceLoadout, renderEffects, renderHistory, renderModifierPopover,
  renderRollSubrail, rollFamily, signed, spellForm, toast, weaponForm
} from "./ui.js?v=1.3.0";
let state = loadState();
let modalAction = null;
let pendingImport = null;
let modifierPicker = null;
let lastRoll = null;
let lastRollHistoryId = null;
const tray = createDiceTray($("#diceCanvas"));
renderAll();
bindEvents();

function renderAll() {
  $("#rulesetSelect").value = state.ruleset;
  renderNavigation();
  renderRoll();
  $("#characterEditor").innerHTML = renderCharacter(state);
  $("#effectsEditor").innerHTML = renderEffects(state);
  $("#historyList").innerHTML = renderHistory(state);
  $("#rulesetNotice").textContent = `${state.ruleset} presets are shown. Rules that change eligibility rather than arithmetic are left for you to confirm.`;
  $("#characterSummary").textContent = `${state.character.name} · Level ${state.character.level}`;
  refreshModifierPicker();
  saveState(state);
}
function renderNavigation() {
  document.body.dataset.view = state.view;
  $$("[data-view]").forEach(view => view.classList.toggle("is-active", view.dataset.view === state.view));
  $$("[data-view-link]").forEach(button => button.classList.toggle("is-active", button.dataset.viewLink === state.view));
}

function renderRoll() {
  $("#appliedModifiers").innerHTML = renderAppliedModifiers(state);
  $("#subcontextRail").innerHTML = renderRollSubrail(state);
  const family = rollFamily(state.roll.context);
  $$("#contextTabs [data-roll-family]").forEach(button => button.classList.toggle("is-active", button.dataset.rollFamily === family));
  updateRollSummary();
}

function updateRollSummary() {
  const plan = buildRollPlan(state);
  $("#rollFormula").textContent = plan.formula;
  $("#rollHeading").textContent = plan.label;
  $("#rollSublabel").textContent = plan.sublabel;
  $("#rollButtonHint").textContent = plan.label;
  $("#modeButton").textContent = title(plan.mode);
  $("#modeButton").hidden = !plan.base.isD20;
  $("#rollButton").disabled = plan.blocked || plan.automaticFailure;
  $("#dicePreview").innerHTML = renderDiceLoadout(state, plan);
  $("#soundToggle").setAttribute("aria-pressed", String(state.sound));
}

function bindEvents() {
  document.addEventListener("click", handleClick);
  document.addEventListener("change", handleChange);
  document.addEventListener("input", handleInput);
  document.addEventListener("keydown", event => {
    if (event.code === "Space" && !isFormControl(event.target) && $("#modalBackdrop").hidden && state.view === "roll") {
      event.preventDefault();
      runRoll();
    }
    if (event.key === "Escape" && !$("#modalBackdrop").hidden) closeModal();
    else if (event.key === "Escape" && modifierPicker) closeModifierPicker();
  });
  document.addEventListener("submit", event => {
    if (event.target.closest(".modal")) {
      event.preventDefault();
      modalAction?.();
    }
  });
  $("#modalBackdrop").addEventListener("click", event => {
    if (event.target === $("#modalBackdrop")) closeModal();
  });
}

function handleClick(event) {
  if (modifierPicker && !event.target.closest("#modifierPopover") && !event.target.closest("[data-modifier-category]") && !event.target.closest("#modifierSearch")) closeModifierPicker();
  const view = event.target.closest("[data-view-link]");
  if (view) { state.view = view.dataset.viewLink; closeModifierPicker(); renderAll(); return; }
  const modifierCategory = event.target.closest("[data-modifier-category]");
  if (modifierCategory) { openModifierPicker(modifierCategory.dataset.modifierCategory); return; }
  if (event.target.closest("#closeModifierPopover")) { closeModifierPicker(); return; }
  if (event.target.closest("#modifierSearch")) { openModifierPicker("search", $("#modifierSearch").value); return; }
  const family = event.target.closest("[data-roll-family]");
  if (family) { selectRollFamily(family.dataset.rollFamily); return; }
  const context = event.target.closest("[data-context]");
  if (context) { selectContext(context.dataset.context); return; }
  const weapon = event.target.closest("[data-select-weapon]");
  if (weapon) { state.roll.selectedWeaponId = weapon.dataset.selectWeapon; state.roll.attackMode = "auto"; resetPlatform(); renderRoll(); saveState(state); return; }
  const attackMode = event.target.closest("[data-attack-mode]");
  if (attackMode) { state.roll.attackMode = attackMode.dataset.attackMode; resetPlatform(); renderRoll(); saveState(state); return; }
  const spell = event.target.closest("[data-select-spell]");
  if (spell) { state.roll.selectedSpellId = spell.dataset.selectSpell; resetSpellChoices(); resetPlatform(); renderRoll(); saveState(state); return; }
  const spellPhase = event.target.closest("[data-spell-phase]");
  if (spellPhase) { state.roll.spellPhase = spellPhase.dataset.spellPhase; state.roll.modeOverride = null; resetPlatform(); renderRoll(); saveState(state); return; }
  const skill = event.target.closest("[data-select-skill]");
  if (skill) { state.roll.selectedSkill = skill.dataset.selectSkill; resetPlatform(); renderRoll(); saveState(state); return; }
  const save = event.target.closest("[data-select-save]");
  if (save) { state.roll.selectedSave = save.dataset.selectSave; resetPlatform(); renderRoll(); saveState(state); return; }
  const clearEffect = event.target.closest("[data-clear-effect]");
  if (clearEffect) { setEffectEnabled(clearEffect.dataset.clearEffect, false); return; }
  const mode = event.target.closest("[data-mode]");
  if (mode) { state.roll.modeOverride = mode.dataset.mode; closeModifierPicker(); resetPlatform(); renderRoll(); saveState(state); return; }
  if (event.target.closest("[data-close-modal]")) { closeModal(); return; }
  if (event.target.closest("#rollButton")) { runRoll(); return; }
  if (event.target.closest('[data-action="reroll-result"]')) { openRerollDialog(); return; }
  const rerollDieButton = event.target.closest("[data-reroll-index]");
  if (rerollDieButton) { performReroll(Number(rerollDieButton.dataset.rerollIndex)); return; }
  if (event.target.closest("#resetRoll")) { resetRoll(); return; }
  if (event.target.closest("#helpButton")) { openModal("How to use this", helpContent(state), '<button class="modal-button primary" type="button" data-close-modal>Done</button>'); return; }
  if (event.target.closest("#openImport")) { openImportDialog(); return; }
  if (event.target.closest("#addEffect") || event.target.closest('[data-action="add-custom-effect"]')) { closeModifierPicker(); openEffectEditor(); return; }
  if (event.target.closest("#soundToggle")) { state.sound = !state.sound; $("#soundToggle").setAttribute("aria-pressed", String(state.sound)); toast(state.sound ? "Dice sound on" : "Dice sound off"); saveState(state); return; }
  if (event.target.closest("#clearHistory")) { confirmClearHistory(); return; }
  const action = event.target.closest("[data-action]")?.dataset.action;
  if (action === "add-weapon") { openWeaponEditor(); return; }
  if (action === "add-spell") { openSpellEditor(); return; }
  if (action === "add-item") { openItemEditor(); return; }
  if (action === "export-backup") { exportBackup(); return; }
  if (action === "import-backup") { $("#backupInput")?.click(); return; }
  const editWeapon = event.target.closest("[data-edit-weapon]");
  if (editWeapon) { openWeaponEditor(state.character.weapons.find(w => w.id === editWeapon.dataset.editWeapon)); return; }
  const deleteWeapon = event.target.closest("[data-delete-weapon]");
  if (deleteWeapon) { deleteItem("weapon", deleteWeapon.dataset.deleteWeapon); return; }
  const editSpell = event.target.closest("[data-edit-spell]");
  if (editSpell) { openSpellEditor(state.character.spells.find(s => s.id === editSpell.dataset.editSpell)); return; }
  const deleteSpell = event.target.closest("[data-delete-spell]");
  if (deleteSpell) { deleteItem("spell", deleteSpell.dataset.deleteSpell); return; }
  const deleteEquipment = event.target.closest("[data-delete-item]");
  if (deleteEquipment) { state.character.items.splice(Number(deleteEquipment.dataset.deleteItem), 1); renderAll(); return; }
  const skillRank = event.target.closest("[data-skill-rank]");
  if (skillRank) { cycleRank(state.character.skills, skillRank.dataset.skillRank, true); return; }
  const saveRank = event.target.closest("[data-save-rank]");
  if (saveRank) { cycleRank(state.character.saves, saveRank.dataset.saveRank, false); return; }
  const config = event.target.closest("[data-config-effect]");
  if (config) { openEffectConfiguration(config.dataset.configEffect); return; }
  if (event.target.closest("[data-modal-save]")) { modalAction?.(); return; }
  if (event.target.closest("[data-modal-delete]")) { modalAction?.("delete"); }
}

function handleChange(event) {
  const target = event.target;
  if (target.id === "rulesetSelect") {
    state.ruleset = target.value;
    state.roll.modeOverride = null;
    state.roll.selectedSpellId = null;
    resetSpellChoices();
    renderAll();
    return;
  }
  if (target.matches("[data-roll-field]")) {
    const key = target.dataset.rollField;
    state.roll[key] = target.type === "checkbox" ? target.checked : target.value;
    if (key === "selectedSpellId") resetSpellChoices();
    state.roll.modeOverride = null;
    resetPlatform(); renderRoll(); saveState(state); return;
  }
  if (target.matches("[data-roll-effect]")) {
    setEffectEnabled(target.dataset.rollEffect, target.checked); return;
  }
  if (target.matches("[data-active-effect]")) {
    toggleArray(state.activeEffects, target.dataset.activeEffect, target.checked);
    state.roll.modeOverride = null; renderAll(); return;
  }
  if (target.matches("[data-character]")) {
    const key = target.dataset.character;
    state.character[key] = target.type === "number" ? nullableNumber(target.value) : target.value;
    if (key === "level" && !event.shiftKey) state.character.proficiencyBonus = proficiencyForLevel(target.value);
    renderAll(); return;
  }
  if (target.matches("[data-ability]")) {
    state.character.abilities[target.dataset.ability] = Number(target.value || 10); renderAll(); return;
  }
  if (target.id === "weaponLibrary" && target.value !== "") { fillWeaponForm(Number(target.value)); return; }
  if (target.id === "characterFile") { parseCharacterImport(target.files?.[0]); return; }
  if (target.id === "backupInput") { importBackup(target.files?.[0]); }
}

function handleInput(event) {
  const target = event.target;
  if (target.id === "modifierSearch") {
    modifierPicker = { category: "search", query: target.value };
    refreshModifierPicker();
    return;
  }
  if (target.matches("[data-roll-field]") && ["targetName", "targetAC", "customLabel", "customNotation"].includes(target.dataset.rollField)) {
    state.roll[target.dataset.rollField] = target.value;
    resetPlatform(); updateRollSummary(); saveState(state);
  }
}

function runRoll() {
  if (tray.running) return;
  const plan = buildRollPlan(state);
  if (plan.blocked || plan.automaticFailure) { toast(plan.blocked ? "The target has total cover; no roll can be made." : "This saving throw fails automatically."); return; }
  if (!plan.dice.length) { toast("Enter valid dice notation first."); return; }
  const outcome = executeRoll(plan);
  $("#dicePreview").hidden = true;
  $("#rollResult").hidden = true;
  $("#rollButton").disabled = true;
  playDiceSound(state.sound);
  navigator.vibrate?.(20);
  tray.roll(outcome.results, { usedResults: outcome.usedResults, onDone: () => finishRoll(plan, outcome) });
}

function finishRoll(plan, outcome) {
  const detail = resultDetail(plan, outcome);
  const canReroll = plan.rerollChoices.length && outcome.rerollsUsed < Math.max(...plan.rerollChoices.map(entry => Number(entry.value || 1)));
  const total = outcome.blocked || outcome.automaticFailure ? "—" : outcome.total;
  $("#rollResult").innerHTML = `<strong>${total}</strong><span>${escapeHtml(detail)}</span>${canReroll ? '<button class="reroll-result" type="button" data-action="reroll-result">Reroll one die</button>' : ""}`;
  $("#rollResult").hidden = false;
  $("#rollButton").disabled = false;
  lastRoll = { plan, outcome };
  if (outcome.rerollsUsed && state.history[0]?.id === lastRollHistoryId) {
    Object.assign(state.history[0], { total: outcome.total, detail, notation: `${plan.notation} · rerolled` });
  } else {
    const entry = { id: uid(), at: new Date().toISOString(), context: plan.context, label: plan.label, notation: plan.notation, total: outcome.total, detail };
    lastRollHistoryId = entry.id;
    state.history.unshift(entry);
  }
  state.history = state.history.slice(0, 60);
  $("#historyList").innerHTML = renderHistory(state);
  saveState(state);
}

function resultDetail(plan, outcome) {
  if (outcome.blocked) return "No roll: the target has total cover";
  if (outcome.automaticFailure) return "Automatic failure";
  const dice = outcome.usedResults.map(die => {
    const applied = die.d20 ? outcome.d20Applied : die.calculatedValue;
    return `${die.sign < 0 ? "−" : ""}${die.value}${applied > die.value ? `→${applied}` : ""}`;
  }).join(" + ");
  const shownFlat = plan.flat + Number(outcome.rerollBonus || 0);
  const parts = [dice, shownFlat ? signed(shownFlat) : ""].filter(Boolean).join(" ");
  if (plan.base.attackRoll && plan.effectiveAC) return `${outcome.criticalHit ? "Critical hit" : outcome.hit ? "Hit" : "Miss"} vs. AC ${plan.effectiveAC} · ${parts}${outcome.discarded ? ` · discarded ${outcome.discarded}` : ""}`;
  if (outcome.naturalCritical) return `${outcome.d20Value === 20 ? "Natural 20" : `Critical on ${outcome.d20Value}`} · ${parts}`;
  if (outcome.criticalHit) return `Critical on hit · ${parts}`;
  if (outcome.naturalOne) return `Natural 1 · ${parts}`;
  if (outcome.damageBreakdown.length > 1) return outcome.damageBreakdown.map(item => `${item.total} ${item.damageType}${item.multiplier !== 1 ? ` (×${item.multiplier})` : ""}`).join(" + ");
  if (outcome.multiplier !== 1) return `${parts} · ${outcome.raw} × ${outcome.multiplier}`;
  if (outcome.alternateDiscarded != null) return `${parts} · discarded damage roll ${outcome.alternateDiscarded}`;
  return parts;
}

function openRerollDialog() {
  if (!lastRoll) return;
  const { plan, outcome } = lastRoll;
  const choices = outcome.results.map((result, index) => ({ result, index }))
    .filter(({ result }) => !result.originalValue && !result.rerolledByChoice && plan.rerollChoices.some(entry => !entry.scope || entry.scope === "d20" && result.d20 || entry.scope === "baseDamage" && result.source === "base"));
  const body = choices.map(({ result, index }) => `<button class="reroll-choice" type="button" data-reroll-index="${index}"><span>${escapeHtml(result.label || (result.d20 ? "d20" : `d${result.sides}`))}</span><strong>${result.value}</strong></button>`).join("");
  openModal("Choose a die to reroll", `<div class="reroll-grid">${body}</div><p class="field-note">The new result must be used.</p>`, '<button class="modal-button" type="button" data-close-modal>Cancel</button>');
}

function performReroll(resultIndex) {
  if (!lastRoll || tray.running) return;
  const { plan, outcome } = lastRoll;
  const next = rerollOutcome(plan, outcome, resultIndex);
  closeModal();
  $("#rollResult").hidden = true;
  $("#rollButton").disabled = true;
  playDiceSound(state.sound);
  tray.roll(next.results, { usedResults: next.usedResults, onDone: () => finishRoll(plan, next) });
}

function resetRoll() {
  const defaults = createDefaultState().roll;
  state.roll = { ...defaults, context: state.roll.context, selectedWeaponId: state.character.weapons[0]?.id || null, selectedSpellId: state.character.spells[0]?.id || null };
  if (state.roll.context === "spell") resetSpellChoices();
  resetPlatform();
  renderAll();
}

function selectRollFamily(family) {
  const context = family === "weapon" ? (["attack", "damage"].includes(state.roll.context) ? state.roll.context : "attack") : family;
  selectContext(context);
}

function selectContext(context) {
  state.roll.context = context;
  state.roll.modeOverride = null;
  closeModifierPicker();
  resetPlatform();
  renderRoll();
  saveState(state);
}

function setEffectEnabled(id, enabled) {
  toggleArray(state.roll.selectedEffects, id, enabled);
  if (!enabled) toggleArray(state.activeEffects, id, false);
  state.roll.modeOverride = null;
  resetPlatform();
  renderAll();
}

function resetPlatform() {
  $("#rollResult").hidden = true;
  $("#dicePreview").hidden = false;
}

function openModifierPicker(category, query = "") {
  if (modifierPicker?.category === category && !$("#modifierPopover").hidden && category !== "search") {
    closeModifierPicker();
    return;
  }
  modifierPicker = { category, query };
  refreshModifierPicker();
}

function refreshModifierPicker() {
  const popover = $("#modifierPopover");
  if (!modifierPicker) { popover.hidden = true; return; }
  popover.hidden = false;
  $("#popoverEyebrow").textContent = `${title(state.roll.context)} roll`;
  $("#popoverTitle").textContent = modifierCategoryLabel(modifierPicker.category, modifierPicker.query);
  $("#modifierPopoverBody").innerHTML = renderModifierPopover(state, modifierPicker.category, modifierPicker.query);
  $$("[data-modifier-category]").forEach(button => button.classList.toggle("is-open", button.dataset.modifierCategory === modifierPicker.category));
}

function closeModifierPicker() {
  modifierPicker = null;
  $("#modifierPopover").hidden = true;
  $$("[data-modifier-category]").forEach(button => button.classList.remove("is-open"));
}

function openWeaponEditor(weapon = null) {
  openModal(weapon ? "Edit weapon" : "Add weapon", weaponForm(weapon), modalButtons(weapon ? "Save changes" : "Add weapon"));
  modalAction = () => {
    const form = $("#weaponForm"); if (!form.reportValidity()) return;
    const data = Object.fromEntries(new FormData(form));
    const value = { id: weapon?.id || uid(), name: data.name.trim(), ability: data.ability, proficient: form.elements.proficient.checked, attackBonus: nullableNumber(data.attackBonus), damage: data.damage.trim(), damageAbility: form.elements.damageAbility.checked, damageBonus: Number(data.damageBonus || 0), damageType: data.damageType, properties: data.properties.trim() };
    if (weapon) Object.assign(weapon, value); else state.character.weapons.push(value);
    state.roll.selectedWeaponId = value.id; closeModal(); renderAll(); toast(weapon ? "Weapon updated" : "Weapon added");
  };
}

function openSpellEditor(spell = null) {
  openModal(spell ? "Edit spell preset" : "Add spell preset", spellForm(spell), modalButtons(spell ? "Save changes" : "Add spell"));
  modalAction = () => {
    const form = $("#spellForm"); if (!form.reportValidity()) return;
    const data = Object.fromEntries(new FormData(form));
    const value = { id: spell?.id || uid(), name: data.name.trim(), rollType: data.rollType, damage: data.damage.trim(), damageType: data.damageType, attackBonus: nullableNumber(data.attackBonus), saveDC: nullableNumber(data.saveDC), damageBonus: 0, source: "custom", imported: false };
    if (spell) Object.assign(spell, value); else state.character.spells.push(value);
    state.roll.selectedSpellId = value.id; resetSpellChoices(); closeModal(); renderAll(); toast(spell ? "Spell updated" : "Spell added");
  };
}

function openItemEditor() {
  openModal("Add equipment", '<form class="form-stack" id="itemForm"><label class="field"><span class="field-label">Item name</span><input name="name" required placeholder="Potion of healing, thieves’ tools…"></label><p class="field-note">If this item changes a roll, add its bonus under Effects so it can be switched on when relevant.</p></form>', modalButtons("Add item"));
  modalAction = () => {
    const form = $("#itemForm"); if (!form.reportValidity()) return;
    state.character.items ||= []; state.character.items.push(new FormData(form).get("name").trim());
    closeModal(); renderAll();
  };
}

function openEffectEditor(effect = null) {
  openModal(effect ? "Edit custom effect" : "Add modifier", effectForm(effect), modalButtons(effect ? "Save changes" : "Add modifier", Boolean(effect)));
  modalAction = action => {
    if (action === "delete" && effect) {
      state.customEffects = state.customEffects.filter(item => item.id !== effect.id);
      toggleArray(state.activeEffects, effect.id, false); closeModal(); renderAll(); return;
    }
    const form = $("#effectForm"); if (!form.reportValidity()) return;
    const data = new FormData(form); const contexts = data.getAll("contexts");
    if (!contexts.length) { toast("Choose at least one roll context."); return; }
    const kindChoice = data.get("kind");
    const entry = { contexts, label: data.get("name").trim() };
    const damageType = data.get("damageType") || "same";
    if (["advantage","disadvantage"].includes(kindChoice)) Object.assign(entry, { kind: "mode", mode: kindChoice });
    else if (kindChoice === "die") Object.assign(entry, { kind: "die", notation: data.get("value") || "1d4", damageType });
    else if (kindChoice === "rerollValues") Object.assign(entry, { kind: kindChoice, values: String(data.get("value") || "1").split(",").map(Number).filter(Number.isFinite) });
    else if (["rerollChoice", "rollTwice", "criticalOnHit", "criticalDamage", "missToHit", "automaticFailure", "blocked", "proficiency", "halfProficiency"].includes(kindChoice)) Object.assign(entry, { kind: kindChoice, value: kindChoice === "rerollChoice" ? 1 : undefined });
    else if (kindChoice === "ignoreResistance") Object.assign(entry, { kind: kindChoice, damageTypes: [damageType] });
    else Object.assign(entry, { kind: kindChoice, value: Number(data.get("value") || 0), damageType });
    if (["rerollValues", "dieFloor", "rollTwice"].includes(kindChoice)) entry.scope = contexts.includes("damage") ? "baseDamage" : "d20";
    const value = { id: effect?.id || uid(), name: data.get("name").trim(), group: "Custom", summary: data.get("summary").trim() || "Custom modifier", rulesets: ["all"], entries: [entry], custom: true };
    if (effect) Object.assign(effect, value); else state.customEffects.push(value);
    toggleArray(state.roll.selectedEffects, value.id, true); closeModal(); renderAll(); toast(effect ? "Modifier updated" : "Modifier added to this roll");
  };
}

function openEffectConfiguration(id) {
  const effect = effectCatalog(state).find(item => item.id === id);
  if (effect?.custom) { openEffectEditor(effect); return; }
  if (effect?.configurable === "damageType") {
    const currentType = state.effectConfig?.[id]?.damageType || buildRollPlan(state).base.damageType || DAMAGE_TYPES[0];
    openModal(`Configure ${effect.name}`, `<form id="configEffectForm" class="form-stack"><label class="field"><span class="field-label">Damage type</span><select name="damageType">${DAMAGE_TYPES.map(type => `<option value="${type}" ${type === currentType ? "selected" : ""}>${type}</option>`).join("")}</select></label></form>`, modalButtons("Save"));
    modalAction = () => {
      state.effectConfig[id] = { damageType: new FormData($("#configEffectForm")).get("damageType") };
      closeModal(); renderAll();
    };
    return;
  }
  const entry = effect?.entries?.find(item => ["die","flat","proficiency","rerollChoice","criticalRange","damageThreshold","saveDC"].includes(item.kind));
  const current = state.effectConfig?.[id]?.notation || entry?.notation || entry?.value || state.character.proficiencyBonus;
  openModal(`Configure ${effect?.name || "effect"}`, `<form id="configEffectForm" class="form-stack"><label class="field"><span class="field-label">Dice or value</span><input name="value" value="${escapeHtml(current)}" required><span class="field-note">Examples: 1d6, 3d6, +2, or −4.</span></label></form>`, modalButtons("Save"));
  modalAction = () => {
    const value = new FormData($("#configEffectForm")).get("value").trim();
    state.effectConfig[id] = { notation: value };
    closeModal(); renderAll();
  };
}

function openImportDialog() {
  pendingImport = null;
  openModal("Import character", importModal(), '<button class="modal-button" type="button" data-close-modal>Cancel</button><button class="modal-button primary" id="applyImport" type="button" data-modal-save disabled>Apply import</button>');
  modalAction = () => {
    if (!pendingImport) return;
    state.character = { ...state.character, ...pendingImport.character };
    state.roll.selectedWeaponId = state.character.weapons[0]?.id || null;
    state.roll.selectedSpellId = state.character.spells[0]?.id || null;
    resetSpellChoices();
    closeModal(); renderAll(); toast(`${state.character.name} imported`);
  };
}

async function parseCharacterImport(file) {
  if (!file) return;
  const status = $("#importStatus");
  status.textContent = "Reading character file…";
  try {
    pendingImport = await importCharacterFile(file);
    status.innerHTML = `<div class="import-summary"><strong>${escapeHtml(pendingImport.character.name)}</strong><br>${escapeHtml(pendingImport.summary)}</div>${pendingImport.warnings.map(w => `<p>${escapeHtml(w)}</p>`).join("")}`;
    $("#applyImport").disabled = false;
  } catch (error) {
    pendingImport = null; status.textContent = error.message || "The character file could not be read.";
  }
}

function fillWeaponForm(index) {
  import("./rules-data.js?v=1.3.0").then(({ WEAPON_LIBRARY }) => {
    const weapon = WEAPON_LIBRARY[index]; const form = $("#weaponForm"); if (!weapon || !form) return;
    ["name","ability","damage","damageType","properties"].forEach(key => { form.elements[key].value = weapon[key]; });
  });
}

function cycleRank(collection, key, allowExpertise) {
  collection[key] = (Number(collection[key] || 0) + 1) % (allowExpertise ? 3 : 2);
  renderAll();
}

function deleteItem(type, id) {
  if (type === "weapon") {
    state.character.weapons = state.character.weapons.filter(item => item.id !== id);
    if (state.roll.selectedWeaponId === id) state.roll.selectedWeaponId = state.character.weapons[0]?.id || null;
  } else {
    state.character.spells = state.character.spells.filter(item => item.id !== id);
    if (state.roll.selectedSpellId === id) state.roll.selectedSpellId = state.character.spells[0]?.id || null;
  }
  renderAll();
}

function confirmClearHistory() {
  openModal("Clear roll history?", '<p class="field-note">This removes every roll stored for this session on this device.</p>', '<button class="modal-button" type="button" data-close-modal>Cancel</button><button class="modal-button danger" type="button" data-modal-save>Clear history</button>');
  modalAction = () => { state.history = []; closeModal(); renderAll(); };
}

function exportBackup() {
  const blob = new Blob([JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), state }, null, 2)], { type: "application/json" });
  const link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = "what-do-i-roll-backup.json"; link.click(); URL.revokeObjectURL(link.href);
}

async function importBackup(file) {
  if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    if (!data.state?.character) throw new Error();
    state = { ...loadState(), ...data.state }; renderAll(); toast("Backup imported");
  } catch { toast("That backup file could not be read."); }
}

function toggleArray(array, value, enabled) {
  const index = array.indexOf(value);
  if (enabled && index < 0) array.push(value);
  if (!enabled && index >= 0) array.splice(index, 1);
}

function resetSpellChoices() {
  const spell = selectedSpell(state);
  state.roll.selectedSpellId = spell?.id || null;
  state.roll.spellPhase = spell?.attack ? "attack" : "damage";
  state.roll.spellSlotLevel = Math.max(1, Number(spell?.level || 1));
  state.roll.spellDamageIndex = 0;
  state.roll.critical = false;
}

function nullableNumber(value) { return value === "" || value == null ? null : Number(value); }
function isFormControl(target) { return target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement || target instanceof HTMLButtonElement; }
function title(value) { return String(value).charAt(0).toUpperCase() + String(value).slice(1); }
