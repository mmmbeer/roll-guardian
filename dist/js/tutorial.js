import { $, openModal, closeModal, renderAppliedModifiers, renderDiceLoadout } from "./ui.js?v=1.6.0";
import { buildRollPlan } from "./roll-engine.js?v=1.6.0";
import { createDefaultState } from "./state.js?v=1.6.0";

const KEY = "rollGuardian.tutorial.v1";
const STEPS = [
  ["Your character and rules", '.topbar-actions', "Choose 2014 or 2024 rules. Open Character to import a sheet or enter your abilities, weapons, and spells. Your character and choices are saved in this browser."],
  ["Choose what you’re rolling", '#contextTabs', "Use the bottom bar to switch between weapons, spells, skills, saves, and custom dice. The thin bar above it holds the choices for that roll."],
  ["Choose the attack or damage", '#subcontextRail', "For a weapon, choose Attack or Damage and select the weapon. Spellcasting lets you select a spell, its roll phase, and a spell slot when applicable. The + Add buttons create your own presets."],
  ["Tell the app what applies", '.modifier-tools', "Select conditions, support spells, combat options, and features from the top bar. Search finds modifiers across the whole catalog. Configure sets dice, values, or the source bard’s level. You decide whether each feature’s trigger is met."],
  ["It remembers across roll types", '#appliedModifiers', "A selected modifier stays remembered when you switch rolls. Only matching modifiers appear in Applied and affect the dice. Try this example: Bless applies to attacks and saves but does nothing on damage rolls."],
  ["Set the target", '#subcontextRail', "Open Target in the options bar to slide up its choices. Attack rolls show defenses such as cover. Damage rolls show resistance, vulnerability, and immunity with a configurable damage type. Target choices stay remembered until you remove or change them."],
  ["Roll, then decide what to spend", '#rollButton', "Check the dice in the center, then press Roll or Space. If Bardic Inspiration is ready, you’ll be asked whether to use it after an eligible roll. Keeping it saves it for later. After a limited-use modifier is used, choose whether to remove it before another roll."],
  ["Keep playing", '#helpButton', "Use the × on an Applied modifier to remove it. Lasting effects stay selected until you end them. History keeps your results, including post-roll additions. Open Help any time to replay this tour."
  ]
];

export function createTutorial({ closeModifierPicker }) {
  let step = 0;
  let highlighted = null;
  let trigger = null;
  const demo = createDefaultState();
  demo.roll.selectedEffects = ["bless"];

  function cleanup(reason) {
    highlighted?.classList.remove("tutorial-highlight");
    $("#modalBackdrop").classList.remove("tutorial-backdrop");
    if (reason === "step") return;
    try { localStorage.setItem(KEY, "seen"); } catch { /* Tour still works without storage. */ }
    trigger?.focus({ preventScroll: true });
  }

  function renderDemo() {
    const plan = buildRollPlan(demo);
    $("#tutorialDemo").innerHTML = `<div class="tutorial-demo-tabs">${["attack", "damage", "save"].map(context => `<button class="option-chip ${demo.roll.context === context ? "is-active" : ""}" type="button" data-demo-context="${context}">${context === "save" ? "Save" : context === "attack" ? "Attack" : "Damage"}</button>`).join("")}</div><p class="field-note">Example only · Bless remains selected</p><div class="applied-list">${renderAppliedModifiers(demo)}</div><div class="tutorial-demo-dice">${renderDiceLoadout(demo, plan)}</div>`;
    $("#tutorialDemo").querySelectorAll("[data-clear-effect]").forEach(button => button.disabled = true);
    $("#tutorialDemo").querySelectorAll("[data-demo-context]").forEach(button => button.onclick = () => {
      demo.roll.context = button.dataset.demoContext;
      renderDemo();
    });
  }

  function show() {
    closeModal("step");
    const [title, selector, description] = STEPS[step];
    openModal(title, `<p class="tutorial-progress">Getting started · ${step + 1} of ${STEPS.length}</p><p>${description}</p>${step === 4 ? '<div id="tutorialDemo" class="tutorial-demo"></div>' : ""}`,
      `<button class="modal-button" type="button" data-close-modal>Skip tour</button>${step ? '<button class="modal-button" type="button" data-tour-back>Back</button>' : ""}<button class="modal-button primary" type="button" data-tour-next>${step === STEPS.length - 1 ? "Done" : "Next"}</button>`, { onClose: cleanup });
    const backdrop = $("#modalBackdrop");
    backdrop.classList.add("tutorial-backdrop");
    highlighted = $(selector);
    highlighted?.classList.add("tutorial-highlight");
    backdrop.dataset.placement = (highlighted?.getBoundingClientRect().top || 0) > innerHeight / 2 ? "top" : "bottom";
    $("[data-tour-next]").onclick = () => {
      if (step === STEPS.length - 1) closeModal("confirm");
      else { step += 1; show(); }
    };
    const back = $("[data-tour-back]");
    if (back) back.onclick = () => { step -= 1; show(); };
    if (step === 4) renderDemo();
  }

  function start() {
    trigger = document.activeElement;
    closeModifierPicker();
    $("[data-view-link='roll']").click();
    step = 0;
    show();
  }

  return { start, startIfNew: () => {
    try { if (localStorage.getItem(KEY)) return; } catch { /* Use the tour for this visit. */ }
    start();
  } };
}
