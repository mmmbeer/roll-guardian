import { buildRollPlan, executeRoll, rerollOutcome, addPostRollModifier } from "./roll-engine.js?v=1.6.0";
import { usedLimitedEffects, removeEffects } from "./modifier-lifecycle.js?v=1.6.0";
import { playDiceSound } from "./dice-3d.js?v=1.6.0";
import { saveState, uid } from "./state.js?v=1.6.0";
import { $, openModal, closeModal, escapeHtml, renderHistory, toast } from "./ui.js?v=1.6.0";
import { resultDetail } from "./roll-result.js?v=1.6.0";

export function createRollController({ getState, tray, renderAll, closeModifierPicker }) {
  let last = null;
  let busy = false;
  let prompted = new Set();

  function animate(results, usedResults, done) {
    busy = true;
    $(".app-shell").inert = true;
    $("#rollButton").disabled = true;
    $("#dicePreview").hidden = true;
    playDiceSound(getState().sound);
    tray.roll(results, { usedResults, onDone: () => {
      busy = false;
      $(".app-shell").inert = false;
      $("#rollButton").disabled = false;
      done();
    } });
  }

  function run() {
    if (busy || tray.running || !$("#modalBackdrop").hidden) return;
    const plan = buildRollPlan(getState());
    if (plan.blocked || plan.automaticFailure) { toast("This roll is blocked or fails automatically."); return; }
    if (!plan.dice.length) { toast("Enter valid dice notation first."); return; }
    closeModifierPicker();
    prompted = new Set();
    last = { plan, outcome: executeRoll(plan), id: uid() };
    $("#rollResult").hidden = true;
    animate(last.outcome.results, last.outcome.usedResults, () => {
      display();
      offerNext(last.plan.postRollChoices.slice());
    });
  }

  function display() {
    const state = getState();
    const { plan, outcome, id } = last;
    const detail = resultDetail(plan, outcome);
    const canReroll = plan.rerollChoices.some(entry => !outcome.rerollEffectsUsed.includes(entry.effectId));
    $("#rollResult").innerHTML = `<strong>${outcome.total}</strong><span>${escapeHtml(detail)}</span>${canReroll ? '<button class="reroll-result" type="button" data-action="reroll-result">Reroll one die</button>' : ""}`;
    $("#rollResult").hidden = false;
    const existing = state.history.find(entry => entry.id === id);
    const entry = { id, at: existing?.at || new Date().toISOString(), context: plan.context,
      label: plan.label, notation: plan.notation, total: outcome.total, detail };
    if (existing) Object.assign(existing, entry);
    else state.history.unshift(entry);
    state.history = state.history.slice(0, 60);
    $("#historyList").innerHTML = renderHistory(state);
    saveState(state);
  }

  function offerNext(choices) {
    const entry = choices.shift();
    if (!entry) { promptCleanup(); return; }
    const { plan, outcome } = last;
    const needsFailure = entry.effectId === "tactical-mind" || entry.effectId === "bardic-inspiration" && plan.ruleset === "2024";
    if (needsFailure && (outcome.hit === true || plan.base.attackRoll && outcome.naturalCritical)) { offerNext(choices); return; }
    const timing = needsFailure ? "Use only if this test failed." : entry.effectId === "bardic-inspiration"
      ? "Choose before the DM announces success or failure." : "Confirm the feature’s trigger before using it.";
    const body = `<p class="post-roll-total">Rolled <strong>${outcome.total}</strong></p><p>Use ${escapeHtml(entry.label)} (${escapeHtml(entry.notation)}) on this roll?</p><p class="field-note">${timing} Keeping it leaves it ready for another relevant roll.</p>`;
    openModal(`Use ${entry.label}?`, body,
      `<button class="modal-button" type="button" data-close-modal>Keep for later</button><button class="modal-button primary" type="button" data-use-post-roll>Use ${escapeHtml(entry.notation)}</button>`, {
        onClose: reason => {
          if (reason !== "use") queueMicrotask(() => offerNext(choices));
        }
      });
    $("[data-use-post-roll]").onclick = () => {
      closeModal("use");
      const next = addPostRollModifier(last.plan, last.outcome, entry.effectId);
      last.plan = next.plan;
      last.outcome = next.outcome;
      animate(next.added, next.added, () => { display(); offerNext(choices); });
    };
  }

  function promptCleanup() {
    const effects = usedLimitedEffects(last.plan, last.outcome).filter(effect => !prompted.has(effect.id));
    if (!effects.length) return;
    effects.forEach(effect => prompted.add(effect.id));
    openModal("Remove used modifiers?", `<p>These modifiers were used on this roll. Remove spent effects so they won’t be added again.</p><div class="form-stack">${effects.map(effect => `<label class="check-chip"><input type="checkbox" data-spent-effect="${escapeHtml(effect.id)}" checked><span>${escapeHtml(effect.name)}<small>${effect.usage === "turn" ? "Limited to an eligible turn or attack; enable again when available." : "One use spent; enable again when renewed."}</small></span></label>`).join("")}</div>`,
      '<button class="modal-button" type="button" data-close-modal>Keep selected modifiers</button><button class="modal-button primary" type="button" data-remove-spent>Remove checked</button>');
    $("[data-remove-spent]").onclick = () => {
      const ids = [...document.querySelectorAll("[data-spent-effect]:checked")].map(input => input.dataset.spentEffect);
      removeEffects(getState(), ids);
      closeModal("confirm");
      renderAll();
    };
  }

  function openRerollDialog() {
    if (!last || busy) return;
    const { plan, outcome } = last;
    const body = plan.rerollChoices.filter(entry => !outcome.rerollEffectsUsed.includes(entry.effectId)).map(entry => {
      const dice = outcome.results.map((result, index) => ({ result, index })).filter(({ result }) =>
        !result.rerolledByChoice && (!entry.scope || entry.scope === "d20" && result.d20 || entry.scope === "baseDamage" && result.source === "base"));
      return `<h3>${escapeHtml(entry.label)}</h3><div class="reroll-grid">${dice.map(({ result, index }) => `<button class="reroll-choice" type="button" data-reroll-index="${index}" data-reroll-effect="${entry.effectId}"><span>${escapeHtml(result.label || `d${result.sides}`)}</span><strong>${result.value}</strong></button>`).join("")}</div>`;
    }).join("");
    openModal("Choose a die to reroll", `${body}<p class="field-note">The new result must be used. Only the chosen feature is spent.</p>`);
  }

  function performReroll(index, effectId) {
    if (!last || busy) return;
    last.outcome = rerollOutcome(last.plan, last.outcome, index, effectId);
    closeModal("confirm");
    animate(last.outcome.results, last.outcome.usedResults, () => { display(); promptCleanup(); });
  }

  return { run, openRerollDialog, performReroll, reset: () => { if (!busy) last = null; } };
}
