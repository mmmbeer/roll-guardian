const SUPPORTED_SIDES = new Set([2, 4, 6, 8, 10, 12, 20, 100]);

export function diceBoxNotation(results) {
  if (!Array.isArray(results) || !results.length) return null;
  if (results.some(result => !SUPPORTED_SIDES.has(Number(result.sides)))) return null;
  const dice = results.map(result => `1d${Number(result.sides)}`).join("+");
  const values = results.map(result => clampResult(result.value, result.sides)).join(",");
  return `${dice}@${values}`;
}

function clampResult(value, sides) {
  return Math.max(1, Math.min(Number(sides), Math.round(Number(value) || 1)));
}
