// Mechanical spell facts derived from SRD 5.1 and SRD 5.2.1 (CC BY 4.0).
// The required Wizards of the Coast attribution is presented in the app help panel.
const SPELL_ROWS_2014 = [
  ["Acid Arrow",2,"4d4","Acid","a,u:1d4","2d4:Acid"],
  ["Acid Splash",0,"1d6","Acid","s:dex,c"],
  ["Alter Self",2,"1d6","Varies",""] ,
  ["Animate Objects",5,"1d4 + 4","Bludgeoning","","2d6 + 1:Bludgeoning|2d12 + 4:Bludgeoning"],
  ["Arcane Hand",5,"4d8","Force","a,u:2d8"],
  ["Arcane Sword",7,"3d10","Force","a"],
  ["Black Tentacles",4,"3d6","Bludgeoning","s:dex"],
  ["Bestow Curse",3,"1d8","Necrotic","s:wis"],
  ["Blade Barrier",6,"6d10","Slashing","s:dex"],
  ["Blight",4,"8d8","Necrotic","s:con,u:1d8"],
  ["Branding Smite",2,"2d6","Radiant","u:1d6"],
  ["Burning Hands",1,"3d6","Fire","s:dex,u:1d6"],
  ["Call Lightning",3,"3d10","Lightning","u:1d10"],
  ["Chain Lightning",6,"10d8","Lightning","s:dex"],
  ["Chill Touch",0,"1d8","Necrotic","a,c"],
  ["Circle of Death",6,"8d6","Necrotic","s:con,u:2d6"],
  ["Cloudkill",5,"5d8","Poison","s:con,u:1d8"],
  ["Cone of Cold",5,"8d8","Cold","s:con,u:1d8"],
  ["Contagion",5,"","","a,s:con"],
  ["Control Water",4,"2d8","Bludgeoning","s:str"],
  ["Contact Other Plane",5,"6d6","Psychic",""] ,
  ["Delayed Blast Fireball",7,"12d6","Fire","s:dex,u:1d6"],
  ["Dimension Door",4,"4d6","Force",""] ,
  ["Dispel Evil and Good",5,"","","a"],
  ["Disintegrate",6,"10d6 + 40","Force","s:dex,u:3d6"],
  ["Divine Favor",1,"1d4","Radiant",""] ,
  ["Dream",5,"3d6","Psychic","s:wis"],
  ["Earthquake",8,"5d6","Bludgeoning","s:dex"],
  ["Eldritch Blast",0,"1d10","Force","a"],
  ["Enlarge/Reduce",2,"1d4","Varies","s:con"],
  ["Faithful Hound",4,"4d8","Piercing","a"],
  ["Feeblemind",8,"4d6","Psychic","s:int"],
  ["Finger of Death",7,"7d8 + 30","Necrotic","s:con"],
  ["Fire Bolt",0,"1d10","Fire","a,c"],
  ["Fire Shield",4,"2d8","Fire","","2d8:Cold"],
  ["Fire Storm",7,"7d10","Fire","s:dex"],
  ["Fireball",3,"8d6","Fire","s:dex,u:1d6"],
  ["Flame Blade",2,"3d6","Fire","a,u:1d6"],
  ["Flame Strike",5,"4d6 + 4d6","Fire + Radiant","s:dex,u:1d6"],
  ["Flaming Sphere",2,"2d6","Fire","u:1d6"],
  ["Forbiddance",6,"5d10","Radiant or Necrotic",""] ,
  ["Freezing Sphere",6,"10d6","Cold","s:con,u:1d6"],
  ["Geas",5,"5d10","Psychic","s:wis"],
  ["Glyph of Warding",3,"5d8","Varies","s:dex,u:1d8"],
  ["Guiding Bolt",1,"4d6","Radiant","a,u:1d6"],
  ["Harm",6,"14d6","Necrotic","s:con"],
  ["Heat Metal",2,"2d8","Fire","s:con,u:1d8"],
  ["Hellish Rebuke",1,"2d10","Fire","s:dex,u:1d10"],
  ["Hunter's Mark",1,"1d6","Varies",""] ,
  ["Ice Storm",4,"2d8 + 4d6","Bludgeoning + Cold","s:dex,u:1d8"],
  ["Incendiary Cloud",8,"10d8","Fire","s:dex"],
  ["Inflict Wounds",1,"3d10","Necrotic","a,u:1d10"],
  ["Insect Plague",5,"4d10","Piercing","s:con,u:1d10"],
  ["Lightning Bolt",3,"8d6","Lightning","s:dex,u:1d6"],
  ["Magic Missile",1,"3d4 + 3","Force","u:1d4+1"],
  ["Meld Into Stone",3,"6d6","Bludgeoning",""] ,
  ["Meteor Swarm",9,"20d6 + 20d6","Fire + Bludgeoning","s:dex"],
  ["Moonbeam",2,"2d10","Radiant","s:con,u:1d10"],
  ["Phantasmal Killer",4,"4d10","Psychic","s:wis"],
  ["Plane Shift",7,"","","a,s:cha"],
  ["Poison Spray",0,"1d12","Poison","s:con,c"],
  ["Prismatic Spray",7,"10d6","Varies","s:dex"],
  ["Prismatic Wall",9,"10d6","Fire","s:dex","10d6:Acid|10d6:Lightning|10d6:Poison|10d6:Cold"],
  ["Produce Flame",0,"1d8","Fire","a,c"],
  ["Ray of Enfeeblement",2,"","","a,s:con"],
  ["Ray of Frost",0,"1d8","Cold","a,c"],
  ["Sacred Flame",0,"1d8","Radiant","s:dex,c"],
  ["Scorching Ray",2,"2d6","Fire","a"],
  ["Shatter",2,"3d8","Thunder","s:con,u:1d8"],
  ["Shocking Grasp",0,"1d8","Lightning","a,c"],
  ["Spiritual Weapon",2,"1d8","Force","a,m,u:1d8,e:2"],
  ["Spike Growth",2,"2d4","Piercing",""] ,
  ["Spirit Guardians",3,"3d8","Radiant or Necrotic","s:wis,u:1d8"],
  ["Storm of Vengeance",9,"2d6","Thunder","s:con","4d6:Acid|10d6:Lightning|2d6:Bludgeoning"],
  ["Sunbeam",6,"6d8","Radiant","s:con"],
  ["Sunburst",8,"12d6","Radiant","s:con"],
  ["Teleport",7,"3d10","Force",""] ,
  ["Thunderwave",1,"2d8","Thunder","s:con,u:1d8"],
  ["Vampiric Touch",3,"3d6","Necrotic","a,u:1d6"],
  ["Vicious Mockery",0,"1d4","Psychic","s:wis,c"],
  ["Wall of Fire",4,"5d8","Fire","s:dex,u:1d8"],
  ["Wall of Ice",6,"10d6","Cold","s:dex","5d6:Cold"],
  ["Wall of Thorns",6,"7d8","Piercing","s:dex","7d8:Slashing"],
  ["Web",2,"2d4","Fire","s:dex"],
  ["Weird",9,"4d10","Psychic","s:wis"],
  ["Wind Wall",3,"3d8","Bludgeoning","s:str"],
  ["Wish",9,"1d10","Necrotic",""]
];

const SPELL_ROWS_2024 = [
  ["Acid Arrow",2,"4d4","Acid","a,u:1d4","2d4:Acid"],
  ["Acid Splash",0,"1d6","Acid","s:dex,c"],
  ["Alter Self",2,"1d6","Varies","a,m"],
  ["Animate Objects",5,"1d4 + 3","Bludgeoning","u:1d4","2d6 + 3:Bludgeoning|2d12 + 3:Bludgeoning"],
  ["Arcane Hand",5,"5d8","Force","a,s:str,u:2d8"],
  ["Arcane Sword",7,"4d12","Force","a,m"],
  ["Befuddlement",8,"10d12","Psychic","s:int"],
  ["Bestow Curse",3,"1d8","Necrotic","s:wis"],
  ["Black Tentacles",4,"3d6","Bludgeoning","s:str"],
  ["Blade Barrier",6,"6d10","Force","s:dex"],
  ["Blight",4,"8d8","Necrotic","s:con,u:1d8"],
  ["Burning Hands",1,"3d6","Fire","s:dex,u:1d6"],
  ["Call Lightning",3,"3d10","Lightning","s:dex,u:1d10"],
  ["Chain Lightning",6,"10d8","Lightning","s:dex"],
  ["Chill Touch",0,"1d10","Necrotic","a,c"],
  ["Chromatic Orb",1,"3d8","Varies","a,u:1d8"],
  ["Circle of Death",6,"8d8","Necrotic","s:con,u:2d8"],
  ["Cloudkill",5,"5d8","Poison","s:con,u:1d8"],
  ["Cone of Cold",5,"8d8","Cold","s:con,u:1d8"],
  ["Conjure Animals",3,"3d10","Slashing","s:dex,u:1d10"],
  ["Conjure Celestial",7,"6d12","Radiant","s:dex"],
  ["Conjure Elemental",5,"8d8","Varies","s:dex,u:2d8","4d8:Varies"],
  ["Conjure Fey",6,"3d12","Psychic","a,m,u:1d12"],
  ["Conjure Minor Elementals",4,"2d8","Varies","u:2d8"],
  ["Conjure Woodland Beings",4,"5d8","Force","s:wis,u:1d8"],
  ["Contact Other Plane",5,"6d6","Psychic",""] ,
  ["Contagion",5,"11d8","Necrotic","s:con"],
  ["Control Water",4,"2d8","Bludgeoning","s:str"],
  ["Delayed Blast Fireball",7,"12d6","Fire","s:dex,u:1d6"],
  ["Dimension Door",4,"4d6","Force",""] ,
  ["Disintegrate",6,"10d6 + 40","Force","s:dex,u:3d6"],
  ["Dissonant Whispers",1,"3d6","Psychic","s:wis,u:1d6"],
  ["Divine Favor",1,"1d4","Radiant",""] ,
  ["Divine Smite",1,"2d8","Radiant","u:1d8"],
  ["Dragon’s Breath",2,"3d6","Varies","s:dex,u:1d6"],
  ["Dream",5,"3d6","Psychic","s:wis"],
  ["Earthquake",8,"12d6","Bludgeoning","s:dex"],
  ["Eldritch Blast",0,"1d10","Force","a"],
  ["Enlarge/Reduce",2,"1d4","Varies","s:con"],
  ["Ensnaring Strike",1,"1d6","Piercing","s:str,u:1d6"],
  ["Faithful Hound",4,"4d8","Force","s:dex"],
  ["Finger of Death",7,"7d8 + 30","Necrotic","s:con"],
  ["Fireball",3,"8d6","Fire","s:dex,u:1d6"],
  ["Fire Bolt",0,"1d10","Fire","a,c"],
  ["Fire Shield",4,"2d8","Fire","","2d8:Cold"],
  ["Fire Storm",7,"7d10","Fire","s:dex"],
  ["Flame Blade",2,"3d6","Fire","a,m,u:1d6"],
  ["Flame Strike",5,"5d6 + 5d6","Fire + Radiant","s:dex,u:1d6"],
  ["Flaming Sphere",2,"2d6","Fire","s:dex,u:1d6"],
  ["Forbiddance",6,"5d10","Radiant or Necrotic",""] ,
  ["Freezing Sphere",6,"10d6","Cold","s:con,u:1d6"],
  ["Geas",5,"5d10","Psychic","s:wis"],
  ["Giant Insect",4,"1d4","Poison",""] ,
  ["Glyph of Warding",3,"5d8","Varies","s:dex,u:1d8"],
  ["Guiding Bolt",1,"4d6","Radiant","a,u:1d6"],
  ["Harm",6,"14d6","Necrotic","s:con"],
  ["Heat Metal",2,"2d8","Fire","s:con,u:1d8"],
  ["Hellish Rebuke",1,"2d10","Fire","s:dex,u:1d10"],
  ["Hex",1,"1d6","Necrotic",""] ,
  ["Hunter’s Mark",1,"1d6","Force",""] ,
  ["Ice Knife",1,"1d10","Piercing","a,s:dex,u:1d6","2d6:Cold"],
  ["Ice Storm",4,"2d10 + 4d6","Bludgeoning + Cold","s:dex,u:1d10"],
  ["Incendiary Cloud",8,"10d8","Fire","s:dex"],
  ["Inflict Wounds",1,"2d10","Necrotic","s:con,u:1d10"],
  ["Insect Plague",5,"4d10","Piercing","s:con,u:1d10"],
  ["Lightning Bolt",3,"8d6","Lightning","s:dex,u:1d6"],
  ["Magic Missile",1,"1d4 + 1","Force","u:1d4+1"],
  ["Meld into Stone",3,"6d6","Force",""] ,
  ["Meteor Swarm",9,"20d6 + 20d6","Fire + Bludgeoning","s:dex"],
  ["Mind Spike",2,"3d8","Psychic","s:wis,u:1d8"],
  ["Moonbeam",2,"2d10","Radiant","s:con,u:1d10"],
  ["Phantasmal Force",2,"2d8","Psychic","s:int"],
  ["Phantasmal Killer",4,"4d10","Psychic","s:wis,u:1d10"],
  ["Poison Spray",0,"1d12","Poison","a,c"],
  ["Power Word Kill",9,"12d12","Psychic",""] ,
  ["Prismatic Spray",7,"12d6","Fire","s:dex","12d6:Acid|12d6:Lightning|12d6:Poison|12d6:Cold"],
  ["Prismatic Wall",9,"12d6","Fire","s:con","12d6:Acid|12d6:Lightning|12d6:Poison|12d6:Cold"],
  ["Produce Flame",0,"1d8","Fire","a,c"],
  ["Ray of Frost",0,"1d8","Cold","a,c"],
  ["Ray of Sickness",1,"2d8","Poison","a,u:1d8"],
  ["Sacred Flame",0,"1d8","Radiant","s:dex,c"],
  ["Scorching Ray",2,"2d6","Fire","a"],
  ["Searing Smite",1,"1d6","Fire","s:con,u:1d6"],
  ["Shatter",2,"3d8","Thunder","s:con,u:1d8"],
  ["Shining Smite",2,"2d6","Radiant","u:1d6"],
  ["Shocking Grasp",0,"1d8","Lightning","a,c"],
  ["Sorcerous Burst",0,"1d8","Varies","a,c"],
  ["Spike Growth",2,"2d4","Piercing",""] ,
  ["Spirit Guardians",3,"3d8","Radiant","s:wis,u:1d8","3d8:Necrotic"],
  ["Spiritual Weapon",2,"1d8","Force","a,m,u:1d8"],
  ["Starry Wisp",0,"1d8","Radiant","a,c"],
  ["Storm of Vengeance",9,"2d6","Thunder","s:con","4d6:Acid|10d6:Lightning|2d6:Bludgeoning|1d6:Cold"],
  ["Summon Dragon",5,"2d6","Varies","a,m,u:1d6"],
  ["Sunbeam",6,"6d8","Radiant","s:con"],
  ["Sunburst",8,"12d6","Radiant","s:con"],
  ["Symbol",7,"10d10","Necrotic","s:con"],
  ["Teleport",7,"3d10","Force",""] ,
  ["Thunderwave",1,"2d8","Thunder","s:con,u:1d8"],
  ["True Strike",0,"1d6","Extra radiant; add weapon damage","a,t"],
  ["Tsunami",8,"6d10","Bludgeoning","s:str","5d10:Bludgeoning"],
  ["Vampiric Touch",3,"3d6","Necrotic","a,u:1d6"],
  ["Vicious Mockery",0,"1d6","Psychic","s:wis,c"],
  ["Vitriolic Sphere",4,"10d4","Acid","s:dex,u:2d4","5d4:Acid"],
  ["Wall of Fire",4,"5d8","Fire","s:dex,u:1d8"],
  ["Wall of Ice",6,"10d6","Cold","s:dex","5d6:Cold"],
  ["Wall of Thorns",6,"7d8","Piercing","s:dex","7d8:Slashing"],
  ["Web",2,"2d4","Fire","s:dex"],
  ["Weird",9,"10d10","Psychic","s:wis","5d10:Psychic"],
  ["Wind Wall",3,"4d8","Bludgeoning","s:str"],
  ["Wish",9,"1d10","Necrotic",""]
];

const catalogs = new Map();

export function spellsForRuleset(ruleset) {
  const version = String(ruleset) === "2014" ? "2014" : "2024";
  if (!catalogs.has(version)) {
    const rows = version === "2014" ? SPELL_ROWS_2014 : SPELL_ROWS_2024;
    catalogs.set(version, rows.map(row => createSpell(row, version)));
  }
  return catalogs.get(version);
}

export function availableSpells(state) {
  const library = spellsForRuleset(state.ruleset);
  const byName = new Map(library.flatMap(spell => spellNameKeys(spell.name).map(key => [key, spell])));
  const known = (state.character.spells || []).map(spell => {
    const catalogSpell = spellNameKeys(spell.name).map(key => byName.get(key)).find(Boolean);
    return { ...(catalogSpell || {}), ...spell, source: "character", known: true,
      attack: catalogSpell?.attack ?? spell.rollType === "attack",
      catalogId: catalogSpell?.id || null,
      damages: catalogSpell?.damages || customDamages(spell), level: catalogSpell?.level ?? spell.level ?? 0 };
  }).sort(sortKnownSpells);
  const knownCatalogIds = new Set(known.map(spell => spell.catalogId).filter(Boolean));
  const maxLevel = spellLevelAccess(state.character);
  const availableLibrary = library
    .filter(spell => !knownCatalogIds.has(spell.id))
    .filter(spell => maxLevel == null || spell.level <= maxLevel)
    .sort(sortSpells);
  return { known, library: availableLibrary, maxLevel };
}

export function spellLevelAccess(character) {
  if (!character?.imported) return null;
  const explicit = Number(character.maxSpellLevel);
  if (character.maxSpellLevel != null && Number.isFinite(explicit)) return Math.max(-1, Math.min(9, explicit));
  const levels = (character.classes || []).map(entry => classSpellLevel(entry)).filter(level => level != null);
  if (levels.length) return Math.max(...levels);
  const knownLevels = (character.spells || []).map(spell => Number(spell.level)).filter(Number.isFinite);
  return knownLevels.length ? Math.max(...knownLevels) : null;
}

export function selectedSpell(state) {
  const groups = availableSpells(state);
  return [...groups.known, ...groups.library].find(spell => spell.id === state.roll.selectedSpellId)
    || groups.known[0] || groups.library[0] || null;
}

export function spellDamage(spell, characterLevel, slotLevel, damageIndex = 0) {
  const damage = spell?.damages?.[Number(damageIndex)] || spell?.damages?.[0];
  if (!damage) return { notation: "", damageType: "", addAbility: false };
  let notation = damage.notation;
  if (spell.cantripScale && damageIndex === 0) notation = scaleCantrip(notation, characterLevel);
  if (spell.lateCantripScale && damageIndex === 0) notation = scaleLateCantrip(notation, characterLevel);
  if (spell.upcast && damageIndex === 0) {
    const steps = Math.floor((Math.max(spell.level, Number(slotLevel || spell.level)) - spell.level) / spell.upcastEvery);
    notation = appendNotation(notation, spell.upcast, steps);
  }
  return { ...damage, notation };
}

function createSpell(row, ruleset) {
  const [name, level, damage, damageType, flagText = "", variantText = ""] = row;
  const flags = flagText.split(",").filter(Boolean);
  const upcast = flags.find(flag => flag.startsWith("u:"))?.slice(2) || null;
  const saveAbility = flags.find(flag => flag.startsWith("s:"))?.slice(2) || null;
  const upcastEvery = Number(flags.find(flag => flag.startsWith("e:"))?.slice(2) || 1);
  const addAbility = flags.includes("m");
  const damages = damage ? [{ notation: damage, damageType, addAbility }, ...parseVariants(variantText)] : [];
  return { id: `srd-${ruleset}-${slug(name)}`, name, level, attack: flags.includes("a"), saveAbility,
    cantripScale: flags.includes("c"), lateCantripScale: flags.includes("t"), upcast, upcastEvery, damages, source: "srd", ruleset };
}

function parseVariants(value) {
  return String(value || "").split("|").filter(Boolean).map(entry => {
    const split = entry.indexOf(":");
    return { notation: entry.slice(0, split), damageType: entry.slice(split + 1), addAbility: false };
  });
}

function customDamages(spell) {
  return spell.damage ? [{ notation: spell.damage, damageType: spell.damageType || "Spell damage", addAbility: false }] : [];
}

function scaleCantrip(notation, level) {
  const multiplier = Number(level || 1) >= 17 ? 4 : Number(level || 1) >= 11 ? 3 : Number(level || 1) >= 5 ? 2 : 1;
  return notation.replace(/^(\d+)d(\d+)/, (_, count, sides) => `${Number(count) * multiplier}d${sides}`);
}

function scaleLateCantrip(notation, level) {
  const multiplier = Number(level || 1) >= 17 ? 3 : Number(level || 1) >= 11 ? 2 : Number(level || 1) >= 5 ? 1 : 0;
  return multiplier ? notation.replace(/^(\d+)d(\d+)/, (_, count, sides) => `${Number(count) * multiplier}d${sides}`) : "0";
}

function appendNotation(notation, extra, count) {
  return count > 0 ? [notation, ...Array(count).fill(extra)].join(" + ") : notation;
}

function spellNameKeys(value) {
  const raw = String(value || "").normalize("NFKD").replace(/[\u0300-\u036f]/g, "");
  const withoutNotes = raw.replace(/(?:\s*[([][^\])]*[\])])+\s*$/g, "").replace(/\s*[★*†‡]+\s*$/g, "");
  const normalized = normalizeName(withoutNotes);
  const aliases = {
    "bigby s hand": "arcane hand",
    "evard s black tentacles": "black tentacles",
    "melf s acid arrow": "acid arrow",
    "mordenkainen s faithful hound": "faithful hound",
    "otiluke s freezing sphere": "freezing sphere"
  };
  return [...new Set([normalizeName(raw), normalized, aliases[normalized]].filter(Boolean))];
}

function classSpellLevel(entry) {
  const name = String(entry?.name || "").toLowerCase();
  const level = Math.max(1, Number(entry?.level || 1));
  if (/bard|cleric|druid|sorcerer|wizard/.test(name)) return Math.min(9, Math.ceil(level / 2));
  if (/warlock/.test(name)) return Math.min(5, Math.ceil(level / 2));
  if (/artificer|paladin|ranger/.test(name)) return Math.min(5, level < 5 ? 1 : Math.floor((level + 3) / 4));
  if (/barbarian|fighter|monk|rogue/.test(name)) return -1;
  return null;
}

function normalizeName(value) { return String(value || "").toLowerCase().replace(/[’']/g, "'").replace(/[^a-z0-9]+/g, " ").trim(); }
function slug(value) { return normalizeName(value).replaceAll(" ", "-"); }
function sortSpells(a, b) { return Number(a.level || 0) - Number(b.level || 0) || a.name.localeCompare(b.name); }
function sortKnownSpells(a, b) { return Number(b.prepared === true) - Number(a.prepared === true) || sortSpells(a, b); }
