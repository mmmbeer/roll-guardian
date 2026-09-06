import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { DICE_MATERIALS, appearanceMarkup, createDiceAppearanceController } from '../dist/js/dice-materials.js';

test('all samples have CSP-compatible colors, number ink and resolvable textures', () => {
  const cssUrl = new URL('../dist/css/dice-materials.css', import.meta.url);
  const css = readFileSync(cssUrl, 'utf8');
  const markup = appearanceMarkup();
  assert.doesNotMatch(markup, /\sstyle=/);
  for (const material of DICE_MATERIALS) {
    const rule = css.split('\n').find(line => line.startsWith(`.material-${material.id} `));
    assert.ok(rule, material.id);
    assert.ok(rule.includes(`--swatch: ${material.color};`));
    assert.ok(rule.includes(`--ink: ${material.ink};`));
    assert.ok(markup.includes(`material-${material.id} `));
    if (material.previewAsset) {
      const path = rule.match(/url\('([^']+)'\)/)[1];
      assert.ok(existsSync(new URL(path, cssUrl)), path);
    }
  }
});

test('finish selection stays unsaved until Done and Cancel discards the draft', t => {
  const state = { diceAppearance: { material: 'amber' } };
  const traySelections = [];
  const saved = [];
  const buttons = DICE_MATERIALS.map(material => ({
    dataset: { diceMaterial: material.id },
    classList: { toggle() {} },
    setAttribute(key, value) { this[key] = value; }
  }));
  let click;
  let dialog;
  const previousDocument = globalThis.document;
  globalThis.document = {
    querySelector(selector) {
      assert.equal(selector, '#appearanceButton', 'selection must not replace the body or footer');
      return {};
    },
    querySelectorAll() { return buttons; },
    addEventListener(type, handler) { assert.equal(type, 'click'); click = handler; }
  };
  t.after(() => { globalThis.document = previousDocument; });
  createDiceAppearanceController({
    getState: () => state,
    tray: { setAppearance: id => traySelections.push(id) },
    save: () => saved.push(state.diceAppearance.material),
    toast() {},
    openModal(title, body, footer, options) { dialog = { title, body, footer, ...options }; }
  });
  const open = () => click({ target: { closest: selector => selector === '#appearanceButton' ? {} : null } });
  const choose = id => click({ target: { closest: selector => selector === '[data-dice-material]' ? buttons.find(button => button.dataset.diceMaterial === id) : null } });
  open();
  const firstDialog = dialog;
  choose('crimson');
  choose('runestone');
  assert.equal(dialog, firstDialog, 'selection preserves the current modal');
  assert.match(dialog.footer, /data-modal-confirm>Done/);
  assert.equal(buttons.find(button => button.dataset.diceMaterial === 'runestone')['aria-pressed'], 'true');
  assert.equal(state.diceAppearance.material, 'amber');
  assert.deepEqual(saved, []);
  dialog.onClose('cancel');
  assert.equal(state.diceAppearance.material, 'amber');
  open();
  assert.match(dialog.body, /data-dice-material="amber" aria-pressed="true"/);
  choose('sapphire');
  dialog.onClose('confirm');
  assert.equal(state.diceAppearance.material, 'sapphire');
  assert.deepEqual(saved, ['sapphire']);
  assert.deepEqual(traySelections, ['amber', 'sapphire']);
});
