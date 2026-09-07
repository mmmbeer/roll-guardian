import { importCharacterFile } from "./importer.js?v=1.7.0";
import { replaceCharacter } from "./state.js?v=1.7.0";
import { $, $$, openModal, closeModal, renderCharacter, importModal, escapeHtml, toast } from "./ui.js?v=1.7.0";

const TABS = [
  ["import", "Import"], ["basics", "Basics"], ["skills", "Skills"],
  ["saves", "Saves"], ["weapons", "Gear"], ["spells", "Spells"], ["backup", "Backup"]
];

export function createCharacterDialog({ getState, renderAll, resetPlatform, clearAction }) {
  let tab = "basics";
  let original = null;
  let pendingImport = null;
  let importRequest = 0;

  function open(selectedTab = tab) {
    tab = selectedTab;
    const state = getState();
    original ||= structuredClone(state);
    clearAction();
    openModal("Character", `<div class="character-tabs" role="tablist" aria-label="Character sections">${TABS.map(([id, label]) => `<button id="character-tab-${id}" type="button" role="tab" data-character-tab="${id}" aria-controls="character-panel-${id}">${label}</button>`).join("")}</div><div class="character-tab-body"><section id="character-panel-import" role="tabpanel" aria-labelledby="character-tab-import">${importModal()}<p class="field-note">Applying an import replaces the current character and clears remembered roll modifiers.</p></section><div id="characterPanels"></div></div>`,
      '<button class="modal-button danger" type="button" id="blankCharacter">Start blank</button><button class="modal-button" type="button" data-close-modal>Cancel</button><button class="modal-button primary" type="button" id="applyImport" disabled>Apply import</button><button class="modal-button primary" type="button" id="characterDone">Done</button>', {
        onClose: reason => {
          $("#modalBody").classList.remove("character-modal-body");
          importRequest += 1;
          pendingImport = null;
          if (reason === "navigate") return;
          if (reason !== "confirm" && original) Object.assign(getState(), original);
          original = null;
          resetPlatform();
          renderAll();
        }
      });
    $("#modalBody").classList.add("character-modal-body");
    $("#characterDone").onclick = () => closeModal("confirm");
    $("#blankCharacter").onclick = confirmBlank;
    $("#applyImport").onclick = applyImport;
    $("#characterFile").onchange = event => parseImport(event.target.files?.[0]);
    $(".character-tabs").onclick = event => {
      const button = event.target.closest("[data-character-tab]");
      if (button) selectTab(button.dataset.characterTab);
    };
    $(".character-tabs").onkeydown = handleTabKeys;
    refresh();
  }

  function refresh() {
    const container = $("#characterPanels");
    if (!container || $("#modalBackdrop").hidden) return;
    const focused = document.activeElement;
    const field = ["data-character", "data-ability", "data-skill-rank", "data-save-rank"].find(attr => focused?.hasAttribute(attr));
    const selector = field ? `[${field}="${focused.getAttribute(field)}"]` : null;
    container.innerHTML = renderCharacter(getState());
    TABS.filter(([id]) => id !== "import").forEach(([id]) => {
      const panel = document.createElement("div");
      panel.id = `character-panel-${id}`;
      panel.setAttribute("role", "tabpanel");
      panel.setAttribute("aria-labelledby", `character-tab-${id}`);
      container.querySelectorAll(`[data-character-panel="${id}"]`).forEach(section => panel.append(section));
      container.append(panel);
    });
    container.querySelector(".panel-stack")?.remove();
    selectTab(tab, false);
    if (selector) container.querySelector(selector)?.focus({ preventScroll: true });
  }

  function selectTab(id, scroll = true) {
    tab = id;
    $$("[data-character-tab]").forEach(button => {
      const active = button.dataset.characterTab === tab;
      button.setAttribute("aria-selected", String(active));
      button.tabIndex = active ? 0 : -1;
    });
    $$(".character-tab-body [role=tabpanel]").forEach(panel => { panel.hidden = panel.id !== `character-panel-${tab}`; });
    $("#applyImport").hidden = tab !== "import";
    $("#characterDone").hidden = tab === "import";
    if (scroll) $(".character-tab-body").scrollTop = 0;
  }

  function handleTabKeys(event) {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const index = TABS.findIndex(([id]) => id === tab);
    const next = event.key === "Home" ? 0 : event.key === "End" ? TABS.length - 1 : (index + (event.key === "ArrowRight" ? 1 : -1) + TABS.length) % TABS.length;
    selectTab(TABS[next][0]);
    const button = $(`[data-character-tab="${tab}"]`);
    button.focus({ preventScroll: true });
    button.scrollIntoView({ block: "nearest", inline: "nearest" });
  }

  async function parseImport(file) {
    if (!file) return;
    const request = ++importRequest;
    pendingImport = null;
    const status = $("#importStatus");
    $("#applyImport").disabled = true;
    status.textContent = "Reading character file…";
    try {
      const result = await importCharacterFile(file);
      if (request !== importRequest || !status.isConnected) return;
      pendingImport = result;
      status.innerHTML = `<div class="import-summary"><strong>${escapeHtml(result.character.name)}</strong><br>${escapeHtml(result.summary)}</div>${result.warnings.map(warning => `<p>${escapeHtml(warning)}</p>`).join("")}`;
      $("#applyImport").disabled = false;
    } catch (error) {
      if (request === importRequest && status.isConnected) status.textContent = error.message || "The character file could not be read.";
    }
  }

  function applyImport() {
    if (!pendingImport) return;
    replaceCharacter(getState(), pendingImport.character);
    resetPlatform();
    toast(`${getState().character.name} imported`);
    // Review the imported numbers in the other tabs before committing with Done.
    closeModal("navigate");
    open("basics");
    renderAll();
  }

  function childOptions() {
    if (!original || !$("#characterPanels") || $("#modalBackdrop").hidden) return {};
    closeModal("navigate");
    return { onClose: () => queueMicrotask(() => open(tab)) };
  }

  function confirmBlank() {
    closeModal("navigate");
    openModal("Start with a blank character?", '<p>This clears the current character’s abilities, proficiencies, gear, spells, and remembered roll modifiers. All ability modifiers and proficiency bonuses start at zero.</p><p class="field-note">Your roll history, saved custom modifier definitions, and dice appearance stay available. Export a backup first if you want to keep this character.</p>', '<button class="modal-button" type="button" data-close-modal>Cancel</button><button class="modal-button primary" type="button" id="confirmBlankCharacter">Start blank</button>', {
      onClose: reason => { if (reason !== "confirm") queueMicrotask(() => open(tab)); }
    });
    $("#confirmBlankCharacter").onclick = () => {
      replaceCharacter(getState());
      original = null;
      getState().view = "roll";
      closeModal("confirm");
      resetPlatform();
      renderAll();
      toast("Blank character ready. Add bonuses from ＋ Modifiers below.");
    };
  }

  return { open, refresh, childOptions, savedState: () => original || getState() };
}
