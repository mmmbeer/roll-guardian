import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { JSDOM } from "jsdom";
import { createDefaultState } from "../dist/js/state.js";
import { createCharacterDialog } from "../dist/js/character-dialog.js";
import { closeModal, openModal } from "../dist/js/modal.js?v=1.7.0";

function setup() {
  const dom = new JSDOM(readFileSync(new URL("../dist/index.html", import.meta.url), "utf8"), { url: "http://localhost", pretendToBeVisual: true });
  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  globalThis.requestAnimationFrame = () => 0;
  dom.window.HTMLElement.prototype.scrollIntoView = function () {};
  const state = createDefaultState();
  let dialog;
  dialog = createCharacterDialog({ getState: () => state, renderAll: () => dialog.refresh(), resetPlatform() {}, clearAction() {} });
  return { dom, state, dialog, $: selector => document.querySelector(selector) };
}

function selectedPanel() {
  return [...document.querySelectorAll('[role="tabpanel"]')].filter(panel => !panel.hidden).map(panel => panel.id);
}

function chooseFile(input, file) {
  Object.defineProperty(input, "files", { configurable: true, value: [file] });
  input.dispatchEvent(new window.Event("change", { bubbles: true }));
}

const flush = () => new Promise(resolve => setImmediate(resolve));

test("character tabs show one panel and preserve editing state across tabs and nested dialogs", async () => {
  const { dom, state, dialog, $ } = setup();
  const original = structuredClone(state.character);
  dialog.open();
  assert.equal(document.querySelectorAll('[role="tab"]').length, 7);
  assert.deepEqual(selectedPanel(), ["character-panel-basics"]);
  state.character.name = "Draft name";
  dialog.refresh();
  $('[data-character-tab="skills"]').click();
  assert.deepEqual(selectedPanel(), ["character-panel-skills"]);
  assert.equal($('#character-panel-skills').querySelectorAll('[data-skill-rank]').length, 18);
  assert.equal($('#character-panel-skills').querySelectorAll('[data-save-rank]').length, 0);
  $('[data-character-tab="skills"]').dispatchEvent(new window.KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
  assert.deepEqual(selectedPanel(), ["character-panel-saves"]);
  assert.equal(document.activeElement.id, "character-tab-saves");
  state.character.saves.str = 1;
  dialog.refresh();
  assert.deepEqual(selectedPanel(), ["character-panel-saves"]);
  openModal("Child editor", "<p>Temporary editor</p>", "", dialog.childOptions());
  closeModal();
  await flush();
  assert.deepEqual(selectedPanel(), ["character-panel-saves"]);
  assert.equal(state.character.name, "Draft name");
  closeModal();
  assert.deepEqual(state.character, original);
  dialog.open();
  state.character.name = "Committed name";
  $('#characterDone').click();
  assert.equal(state.character.name, "Committed name");
  assert.equal($('#modalBackdrop').hidden, true);
  dom.window.close();
});

test("blank confirmation can be canceled and clearing returns cleanly to the roller", async () => {
  const { dom, state, dialog, $ } = setup();
  state.activeEffects = ["bless"];
  dialog.open("import");
  $('#blankCharacter').click();
  assert.equal($('#modalTitle').textContent, "Start with a blank character?");
  closeModal();
  await flush();
  assert.deepEqual(selectedPanel(), ["character-panel-import"]);
  assert.equal(state.character.weapons.length, 2);
  assert.deepEqual(state.activeEffects, ["bless"]);
  $('#blankCharacter').click();
  $('#confirmBlankCharacter').click();
  await flush();
  assert.equal($('#modalBackdrop').hidden, true);
  assert.equal(state.character.name, "Blank character");
  assert.equal(state.character.weapons.length, 0);
  assert.equal(state.character.proficiencyBonus, 0);
  assert.deepEqual(state.activeEffects, []);
  assert.equal(state.view, "roll");
  dom.window.close();
});

test("import review survives tab changes and Cancel restores the previous character", async () => {
  const { dom, state, dialog, $ } = setup();
  const original = structuredClone(state.character);
  state.activeEffects = ["bless"];
  dialog.open("import");
  chooseFile($('#characterFile'), { name: "character.json", type: "application/json", text: async () => JSON.stringify({ name: "Imported mage", level: 3 }) });
  await flush();
  assert.equal($('#applyImport').disabled, false);
  $('[data-character-tab="basics"]').click();
  $('[data-character-tab="import"]').click();
  assert.equal($('#applyImport').disabled, false);
  $('#applyImport').click();
  assert.equal(state.character.name, "Imported mage");
  assert.deepEqual(state.activeEffects, []);
  assert.deepEqual(selectedPanel(), ["character-panel-basics"]);
  closeModal();
  assert.deepEqual(state.character, original);
  assert.deepEqual(state.activeEffects, ["bless"]);
  dom.window.close();
});

test("failed and stale imports never leave an earlier file available to apply", async () => {
  const { dom, dialog, $ } = setup();
  dialog.open("import");
  chooseFile($('#characterFile'), { name: "ok.json", type: "application/json", text: async () => '{"name":"First"}' });
  await flush();
  assert.equal($('#applyImport').disabled, false);
  chooseFile($('#characterFile'), { name: "bad.json", type: "application/json", text: async () => 'not JSON' });
  assert.equal($('#applyImport').disabled, true);
  await flush();
  assert.equal($('#applyImport').disabled, true);
  let resolve;
  chooseFile($('#characterFile'), { name: "slow.json", type: "application/json", text: () => new Promise(done => { resolve = done; }) });
  closeModal();
  dialog.open("import");
  resolve('{"name":"Stale result"}');
  await flush();
  assert.equal($('#applyImport').disabled, true);
  assert.doesNotMatch($('#importStatus').textContent, /Stale result/);
  closeModal();
  dom.window.close();
});
