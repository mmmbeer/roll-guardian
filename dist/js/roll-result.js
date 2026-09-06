import { signed } from "./ui.js?v=1.6.0";

export function resultDetail(plan, outcome) {
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

