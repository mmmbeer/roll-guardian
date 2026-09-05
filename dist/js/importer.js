import { ABILITIES, SKILLS } from "./rules-data.js";
import { proficiencyForLevel, uid } from "./state.js";

export async function importCharacterFile(file) {
  const extension = file.name.split(".").pop()?.toLowerCase();
  if (extension === "json" || file.type.includes("json")) {
    return importCharacterJson(JSON.parse(await file.text()));
  }
  if (extension === "pdf" || file.type === "application/pdf") {
    return importCharacterPdf(await file.arrayBuffer());
  }
  throw new Error("Choose a D&D Beyond PDF or JSON character export.");
}

export function importCharacterJson(input) {
  const data = input?.data || input?.character || input;
  if (!data || typeof data !== "object") throw new Error("The JSON file does not contain a character.");
  const level = extractLevel(data);
  const scores = extractAbilityScores(data);
  const itemNames = extractInventory(data).map(item => item.definition?.name || item.name).filter(Boolean);
  const character = {
    name: data.name || data.characterName || "Imported character",
    level,
    proficiencyBonus: number(data.proficiencyBonus) ?? proficiencyForLevel(level),
    abilities: scores,
    saves: extractProficiencies(data, "save"),
    skills: extractProficiencies(data, "skill"),
    spellAbility: extractSpellAbility(data),
    spellAttackBonus: number(data.spellAttackBonus ?? data.spellAttack),
    spellSaveDC: number(data.spellSaveDC ?? data.spellSaveDc),
    weapons: extractWeapons(data),
    spells: extractSpells(data),
    items: [...new Set(itemNames)]
  };
  const itemCount = extractInventory(data).length;
  return {
    character,
    inventoryNames: itemNames,
    summary: `${character.weapons.length} weapon${character.weapons.length === 1 ? "" : "s"}, ${itemCount} carried item${itemCount === 1 ? "" : "s"}, and ${character.spells.length} spell${character.spells.length === 1 ? "" : "s"} found.`,
    warnings: character.weapons.length ? [] : ["No weapons were recognized. You can add them manually after import."]
  };
}

export function importCharacterPdf(buffer) {
  const bytes = new Uint8Array(buffer);
  const raw = new TextDecoder("latin1").decode(bytes);
  const fields = extractPdfFields(raw);
  const visible = extractPdfStrings(raw);
  const lookup = makeFieldLookup(fields);
  const name = findField(lookup, ["charactername", "character name", "charname"]) || findNamedLine(visible, "character") || "Imported character";
  const level = parseInt(findField(lookup, ["level", "classlevel"]) || findLevel(visible) || "1", 10) || 1;
  const abilities = {};
  ABILITIES.forEach(ability => {
    const value = findField(lookup, [ability.label.toLowerCase(), `${ability.key}score`, ability.short.toLowerCase()]);
    abilities[ability.key] = plausibleScore(value) ?? 10;
  });
  const weapons = extractPdfWeapons(lookup, visible);
  const equipment = extractEquipmentText(lookup, visible);
  const character = {
    name, level, proficiencyBonus: plausibleBonus(findField(lookup, ["proficiencybonus", "profbonus"])) ?? proficiencyForLevel(level),
    abilities,
    saves: Object.fromEntries(ABILITIES.map(a => [a.key, 0])),
    skills: Object.fromEntries(SKILLS.map(s => [s.key, 0])),
    spellAbility: "wis",
    spellAttackBonus: plausibleBonus(findField(lookup, ["spellatkbonus", "spell attack bonus", "spellcastingbonus"])),
    spellSaveDC: plausibleDC(findField(lookup, ["spellsavedc", "spell save dc"])),
    weapons,
    spells: [],
    items: equipment
  };
  const warnings = [];
  if (!weapons.length) warnings.push("The PDF did not expose structured weapon fields. Add weapons manually or import a JSON export for a more complete result.");
  warnings.push("PDF exports vary. Review ability scores, proficiency, and weapon formulas before rolling.");
  return {
    character,
    inventoryNames: equipment,
    summary: `${weapons.length} weapon${weapons.length === 1 ? "" : "s"} and ${equipment.length} equipment entr${equipment.length === 1 ? "y" : "ies"} found.`,
    warnings
  };
}

function extractWeapons(data) {
  const inventory = extractInventory(data);
  const weapons = inventory.filter(item => {
    const def = item.definition || item;
    return /weapon/i.test(def.filterType || def.type || "") || def.damage?.diceString || def.damageDice;
  }).map(item => {
    const def = item.definition || item;
    const properties = (def.properties || []).map(property => property.name || property).filter(Boolean);
    const finesse = properties.some(property => /finesse/i.test(property));
    const ranged = /ranged/i.test(def.attackType || def.range?.long && "ranged") || properties.some(property => /ammunition/i.test(property));
    const granted = number(item.magicBonus ?? def.magicBonus ?? findGrantedBonus(item));
    return {
      id: uid(), name: def.name || "Imported weapon",
      ability: normalizeAbility(item.abilityModifierStatId || def.ability || (finesse || ranged ? "dex" : "str")),
      proficient: item.isProficient !== false,
      attackBonus: number(item.attackBonus ?? item.toHit) ?? granted,
      damage: normalizeDice(def.damage?.diceString || def.damageDice || item.damage || "1d4"),
      damageAbility: item.damageAbility !== false,
      damageBonus: number(item.damageBonus) ?? granted ?? 0,
      damageType: def.damageType || def.damage?.damageType || "Damage",
      properties: properties.join(", ") || def.propertiesText || "Imported"
    };
  });
  return dedupe(weapons, weapon => weapon.name.toLowerCase());
}

function extractSpells(data) {
  const groups = [data.spells, data.classSpells, data.raceSpells, data.itemSpells]
    .flatMap(group => Array.isArray(group) ? group : group && typeof group === "object" ? Object.values(group).flat() : []);
  return dedupe(groups.map(item => item.definition || item).filter(Boolean).map(spell => {
    const damage = firstDice(spell.damage || spell.damageEffect || spell.description || "");
    const save = spell.saveDcAbilityId || spell.saveAbility || /saving throw/i.test(spell.description || "");
    const attack = spell.requiresAttackRoll || /spell attack/i.test(spell.description || "");
    return {
      id: uid(), name: spell.name || "Imported spell",
      rollType: attack ? "attack" : save ? "save" : damage ? "damage" : "attack",
      damage: damage || "1d8", damageBonus: 0,
      damageType: spell.damageType || spell.damage?.damageType || "Spell damage",
      attackBonus: number(spell.attackBonus), saveDC: number(spell.saveDC || spell.dc)
    };
  }), spell => spell.name.toLowerCase());
}

function extractInventory(data) {
  return [data.inventory, data.items, data.equipment].flatMap(value => Array.isArray(value) ? value : []);
}

function extractAbilityScores(data) {
  const result = Object.fromEntries(ABILITIES.map(a => [a.key, 10]));
  const stats = data.stats || data.abilities || data.abilityScores;
  if (Array.isArray(stats)) {
    ABILITIES.forEach((ability, index) => {
      const entry = stats.find(item => item.id === index + 1 || normalizeAbility(item.name || item.key) === ability.key) || stats[index];
      result[ability.key] = plausibleScore(entry?.value ?? entry?.score) ?? 10;
    });
  } else if (stats && typeof stats === "object") {
    ABILITIES.forEach(ability => {
      result[ability.key] = plausibleScore(stats[ability.key] ?? stats[ability.label] ?? stats[ability.short]) ?? 10;
    });
  }
  return result;
}

function extractProficiencies(data, type) {
  const source = type === "save" ? data.saves || data.savingThrows : data.skills;
  const keys = type === "save" ? ABILITIES.map(a => a.key) : SKILLS.map(s => s.key);
  const result = Object.fromEntries(keys.map(key => [key, 0]));
  if (source && !Array.isArray(source)) {
    keys.forEach(key => {
      const entry = source[key] ?? source[key.replaceAll("-", " ")];
      result[key] = normalizeRank(entry?.proficiency ?? entry?.proficient ?? entry);
    });
  }
  const modifiers = Object.values(data.modifiers || {}).flatMap(value => Array.isArray(value) ? value : []);
  modifiers.forEach(mod => {
    const text = `${mod.subType || ""} ${mod.friendlySubtypeName || ""}`.toLowerCase().replaceAll("_", "-");
    const key = keys.find(candidate => text.includes(candidate));
    if (key && /proficiency|expertise/.test(`${mod.type || ""} ${mod.friendlyTypeName || ""}`.toLowerCase())) {
      result[key] = /expertise/.test(`${mod.type || ""} ${mod.friendlyTypeName || ""}`.toLowerCase()) ? 2 : 1;
    }
  });
  return result;
}

function extractLevel(data) {
  const direct = number(data.level ?? data.totalLevel);
  if (direct) return direct;
  const classes = Array.isArray(data.classes) ? data.classes : [];
  return Math.max(1, classes.reduce((total, entry) => total + Number(entry.level || 0), 0));
}

function extractSpellAbility(data) {
  const id = data.spellCastingAbilityId ?? data.spellcastingAbilityId;
  if (id) return ABILITIES[Number(id) - 1]?.key || "wis";
  return normalizeAbility(data.spellAbility || data.spellcastingAbility || "wis");
}

function extractPdfFields(raw) {
  const fields = [];
  const patterns = [
    /\/T\s*\(([^)]*(?:\\\)[^)]*)*)\)[\s\S]{0,500}?\/V\s*\(([^)]*(?:\\\)[^)]*)*)\)/g,
    /\/T\s*<([0-9A-Fa-f]+)>[\s\S]{0,500}?\/V\s*<([0-9A-Fa-f]+)>/g
  ];
  let match;
  while ((match = patterns[0].exec(raw))) fields.push([decodePdfString(match[1]), decodePdfString(match[2])]);
  while ((match = patterns[1].exec(raw))) fields.push([decodeHex(match[1]), decodeHex(match[2])]);
  return fields;
}

function extractPdfStrings(raw) {
  const values = [];
  const regex = /\(([^()]{2,120})\)/g;
  let match;
  while ((match = regex.exec(raw))) {
    const value = decodePdfString(match[1]).trim();
    if (/^[\x20-\x7E]{2,}$/.test(value)) values.push(value);
  }
  return values;
}

function makeFieldLookup(fields) {
  return fields.map(([key, value]) => [key.toLowerCase().replace(/[^a-z0-9]/g, ""), value]);
}

function findField(lookup, names) {
  const keys = names.map(name => name.toLowerCase().replace(/[^a-z0-9]/g, ""));
  for (const key of keys) {
    const exact = lookup.find(([candidate]) => candidate === key);
    if (exact?.[1]) return exact[1];
  }
  for (const key of keys) {
    const partial = lookup.find(([candidate]) => candidate.includes(key));
    if (partial?.[1]) return partial[1];
  }
  return null;
}

function extractPdfWeapons(lookup, visible) {
  const weapons = [];
  for (let index = 1; index <= 8; index += 1) {
    const name = findField(lookup, [`wpnname${index}`, `weaponname${index}`, `atkname${index}`]);
    if (!name) continue;
    const damageText = findField(lookup, [`wpn${index}damage`, `weapondamage${index}`, `atkdamage${index}`]) || "1d4";
    const bonus = findField(lookup, [`wpn${index}atkbonus`, `weaponattackbonus${index}`, `atkbonus${index}`]);
    weapons.push({
      id: uid(), name, ability: "str", proficient: true, attackBonus: plausibleBonus(bonus),
      damage: firstDice(damageText) || "1d4", damageAbility: false, damageBonus: trailingBonus(damageText),
      damageType: extractDamageType(damageText), properties: "Imported from PDF"
    });
  }
  if (!weapons.length) {
    const weaponNames = ["dagger","longsword","shortsword","greatsword","rapier","shortbow","longbow","crossbow","warhammer","battleaxe","handaxe","spear","mace","staff","glaive"];
    visible.forEach((value, index) => {
      const found = weaponNames.find(name => new RegExp(`\\b${name}\\b`, "i").test(value));
      if (!found) return;
      const nearby = visible.slice(index, index + 5).join(" ");
      const dice = firstDice(nearby);
      if (dice) weapons.push({ id: uid(), name: title(found), ability: /bow|crossbow|rapier|dagger|shortsword/i.test(found) ? "dex" : "str", proficient: true, attackBonus: null, damage: dice, damageAbility: true, damageBonus: 0, damageType: extractDamageType(nearby), properties: "Imported from PDF" });
    });
  }
  return dedupe(weapons, weapon => weapon.name.toLowerCase());
}

function extractEquipmentText(lookup, visible) {
  const field = findField(lookup, ["equipment", "equipmentlist", "otherpossessions"]);
  const values = (field ? field.split(/[\n,;]+/) : visible.filter(value => /equipment|inventory/i.test(value))).map(v => v.trim()).filter(v => v.length > 1 && v.length < 90);
  return [...new Set(values)].slice(0, 50);
}

function findNamedLine(values, word) { return values.find(value => value.toLowerCase().includes(word) && value.length < 60); }
function findLevel(values) { return values.map(value => value.match(/level\s*(\d{1,2})/i)?.[1]).find(Boolean); }
function firstDice(value) { return JSON.stringify(value).match(/\b\d+d(?:4|6|8|10|12|20|100)(?:\s*[+-]\s*\d+)?\b/i)?.[0]?.replace(/\s+/g, "") || null; }
function trailingBonus(value) { return number(String(value).match(/[+-]\s*(\d+)\s*$/)?.[0]) ?? 0; }
function extractDamageType(value) { return String(value).match(/acid|bludgeoning|cold|fire|force|lightning|necrotic|piercing|poison|psychic|radiant|slashing|thunder/i)?.[0] || "Damage"; }
function findGrantedBonus(item) { return Object.values(item.grantedModifiers || {}).flat().find(mod => /bonus.*attack|magic/i.test(`${mod.type} ${mod.subType}`))?.value; }
function normalizeDice(value) { return firstDice(value) || String(value).match(/\d+d\d+/i)?.[0] || "1d4"; }
function normalizeAbility(value) { const text = String(value).toLowerCase(); const found = ABILITIES.find((ability,index) => text === String(index+1) || text.includes(ability.key) || text.includes(ability.label.toLowerCase())); return found?.key || "str"; }
function normalizeRank(value) { if (value === true || value === "proficient") return 1; if (String(value).toLowerCase() === "expertise") return 2; return Math.max(0, Math.min(2, Number(value) || 0)); }
function plausibleScore(value) { const n = number(value); return n != null && n >= 1 && n <= 30 ? n : null; }
function plausibleBonus(value) { const n = number(value); return n != null && n >= -10 && n <= 30 ? n : null; }
function plausibleDC(value) { const n = number(value); return n != null && n >= 5 && n <= 35 ? n : null; }
function number(value) { if (value == null || value === "") return null; const n = Number(String(value).replace(/[^0-9+-.]/g, "")); return Number.isFinite(n) ? n : null; }
function decodePdfString(value) { return String(value).replace(/\\([()\\])/g, "$1").replace(/\\n/g, "\n").replace(/\\r/g, "\r").replace(/\\(\d{3})/g, (_, octal) => String.fromCharCode(parseInt(octal, 8))); }
function decodeHex(value) { try { const bytes = value.match(/.{2}/g)?.map(hex => parseInt(hex, 16)) || []; return new TextDecoder("utf-16be").decode(new Uint8Array(bytes)).replace(/^\uFEFF/, ""); } catch { return ""; } }
function dedupe(items, key) { const seen = new Set(); return items.filter(item => { const value = key(item); if (seen.has(value)) return false; seen.add(value); return true; }); }
function title(value) { return value.replace(/\b\w/g, letter => letter.toUpperCase()); }
