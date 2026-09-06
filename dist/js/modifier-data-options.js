const BOTH = ["2014", "2024"];
const effect = (id, name, group, summary, entries, rulesets = BOTH, extra = {}) =>
  ({ id, name, group, summary, entries, rulesets, ...extra });
const mode = (contexts, value, label, extra = {}) => ({ contexts, kind: "mode", mode: value, label, ...extra });
const flat = (contexts, value, label, extra = {}) => ({ contexts, kind: "flat", value, label, ...extra });
const die = (contexts, notation, label, extra = {}) => ({ contexts, kind: "die", notation, label, ...extra });

export const SUPPORT_EFFECTS = [
  effect("bless", "Bless", "Spells & support", "Add 1d4 to attack rolls and saving throws.", [die(["attack", "save"], "1d4", "Bless")]),
  effect("bane", "Bane", "Spells & support", "Subtract 1d4 from attack rolls and saving throws.", [die(["attack", "save"], "-1d4", "Bane", { criticalEligible: false })]),
  effect("guidance", "Guidance", "Spells & support", "2014: add 1d4 to one ability check. 2024: add 1d4 to checks with the configured skill while the spell lasts.", [die(["skill"], "1d4", "Guidance")]),
  effect("resistance-spell", "Resistance", "Spells & support", "Add 1d4 to one eligible saving throw, then the spell ends.", [die(["save"], "1d4", "Resistance")], ["2014"]),
  effect("resistance-spell-2024", "Resistance spell on target", "Target defenses", "Reduce damage of the configured type by 1d4 while the spell lasts. This is separate from damage resistance.", [die(["damage"], "-1d4", "Resistance spell", { criticalEligible: false })], ["2024"], { configurable: "damageType" }),
  effect("bardic-inspiration", "Bardic Inspiration", "Spells & support", "Add the configured Bardic Inspiration die to an eligible d20 roll.", [die(["attack", "skill", "save"], "1d6", "Bardic Inspiration")], BOTH, { configurable: "bardLevel" }),
  effect("enhance-str", "Enhance Ability: Strength", "Spells & support", "Advantage on Strength ability checks.", [mode(["skill"], "advantage", "Enhance Ability", { abilities: ["str"] })]),
  effect("enhance-dex", "Enhance Ability: Dexterity", "Spells & support", "Advantage on Dexterity ability checks.", [mode(["skill"], "advantage", "Enhance Ability", { abilities: ["dex"] })]),
  effect("enhance-con", "Enhance Ability: Constitution", "Spells & support", "Advantage on Constitution ability checks.", [mode(["skill"], "advantage", "Enhance Ability", { abilities: ["con"] })]),
  effect("enhance-int", "Enhance Ability: Intelligence", "Spells & support", "Advantage on Intelligence ability checks.", [mode(["skill"], "advantage", "Enhance Ability", { abilities: ["int"] })]),
  effect("enhance-wis", "Enhance Ability: Wisdom", "Spells & support", "Advantage on Wisdom ability checks.", [mode(["skill"], "advantage", "Enhance Ability", { abilities: ["wis"] })]),
  effect("enhance-cha", "Enhance Ability: Charisma", "Spells & support", "Advantage on Charisma ability checks.", [mode(["skill"], "advantage", "Enhance Ability", { abilities: ["cha"] })]),
  effect("pass-without-trace", "Pass without Trace", "Spells & support", "Add +10 to Dexterity (Stealth) checks while affected.", [flat(["skill"], 10, "Pass without Trace", { checks: ["stealth"] })]),
  effect("haste", "Haste", "Spells & support", "Advantage on Dexterity saving throws.", [mode(["save"], "advantage", "Haste", { abilities: ["dex"] })]),
  effect("beacon-of-hope", "Beacon of Hope", "Spells & support", "Advantage on Wisdom and death saving throws.", [
    mode(["save"], "advantage", "Beacon of Hope", { abilities: ["wis"], saveKinds: ["death"] })
  ]),
  effect("warding-bond", "Warding Bond", "Spells & support", "Add +1 to saving throws while the bond lasts.", [flat(["save"], 1, "Warding Bond")]),
  effect("foresight", "Foresight", "Spells & support", "Advantage on attacks, ability checks, and saving throws.", [mode(["attack", "skill", "save"], "advantage", "Foresight")]),
  effect("holy-aura", "Holy Aura", "Spells & support", "Protected creatures have advantage on saves and impose disadvantage on attacks against them.", [mode(["save"], "advantage", "Holy Aura"), mode(["attack"], "disadvantage", "Holy Aura")]),
  effect("faerie-fire", "Faerie Fire on target", "Spells & support", "Attack rolls against a visible affected target have advantage.", [mode(["attack"], "advantage", "Faerie Fire")]),
  effect("guiding-bolt-followup", "Guiding Bolt follow-up", "Spells & support", "The next eligible attack against the target has advantage.", [mode(["attack"], "advantage", "Guiding Bolt")]),
  effect("true-strike-2014", "True Strike", "Spells & support", "Gain advantage on the eligible attack.", [mode(["attack"], "advantage", "True Strike")], ["2014"]),
  effect("protection-evil-good", "Protection from Evil and Good", "Spells & support", "An eligible protected target imposes disadvantage on the creature's attacks.", [mode(["attack"], "disadvantage", "Protection")]),
  effect("mind-sliver", "Mind Sliver penalty", "Spells & support", "Subtract 1d4 from the target's next saving throw.", [die(["save"], "-1d4", "Mind Sliver", { criticalEligible: false })]),
  effect("vicious-mockery", "Vicious Mockery penalty", "Spells & support", "The target's next eligible attack has disadvantage.", [mode(["attack"], "disadvantage", "Vicious Mockery")]),
  effect("synaptic-static", "Synaptic Static penalty", "Spells & support", "Subtract 1d6 from attacks and ability checks, plus concentration saves.", [
    die(["attack", "skill"], "-1d6", "Synaptic Static", { criticalEligible: false }),
    die(["save"], "-1d6", "Synaptic Static", { abilities: ["con"], criticalEligible: false })
  ]),
  effect("bestow-curse", "Bestow Curse disadvantage", "Spells & support", "Apply disadvantage to checks and saves with the ability chosen by the caster.", [mode(["skill", "save"], "disadvantage", "Bestow Curse")]),
  effect("enlarge", "Enlarge", "Damage riders", "Add 1d4 to weapon damage.", [die(["damage"], "1d4", "Enlarge", { rollScope: "weapon", damageType: "same" })]),
  effect("reduce", "Reduce", "Damage riders", "Subtract 1d4 from weapon damage.", [die(["damage"], "-1d4", "Reduce", { rollScope: "weapon", damageType: "same", criticalEligible: false })]),
  effect("hunters-mark", "Hunter’s Mark", "Damage riders", "Add the mark damage on a hit and gain advantage on Perception or Survival checks made to find the target.", [
    die(["damage"], "1d6", "Hunter’s Mark", { damageType: "same", rollScope: "weapon", rulesets: ["2014"] }),
    die(["damage"], "1d6", "Hunter’s Mark", { damageType: "Force", rulesets: ["2024"] }),
    mode(["skill"], "advantage", "Hunter’s Mark", { checks: ["perception", "survival"] })
  ], BOTH, { configurable: "die" }),
  effect("hex", "Hex", "Damage riders", "Add 1d6 Necrotic damage when an attack hits the cursed target.", [die(["damage"], "1d6", "Hex", { damageType: "Necrotic" })]),
  effect("divine-favor", "Divine Favor", "Damage riders", "Add 1d4 Radiant damage to an eligible weapon hit.", [die(["damage"], "1d4", "Divine Favor", { damageType: "Radiant", rollScope: "weapon" })]),
  effect("crusaders-mantle", "Crusader's Mantle", "Damage riders", "Add 1d4 Radiant damage to an eligible weapon hit.", [die(["damage"], "1d4", "Crusader's Mantle", { damageType: "Radiant", rollScope: "weapon" })]),
  effect("elemental-weapon", "Elemental Weapon", "Damage riders", "Add +1 to attack rolls and 1d4 elemental damage.", [
    flat(["attack"], 1, "Elemental Weapon", { rollScope: "weapon" }), die(["damage"], "1d4", "Elemental Weapon", { rollScope: "weapon" })
  ], ["2014"]),
  effect("flame-arrows", "Flame Arrows", "Damage riders", "Add 1d6 Fire damage to the ammunition hit.", [die(["damage"], "1d6", "Flame Arrows", { damageType: "Fire", rollScope: "weapon" })]),
  effect("holy-weapon", "Holy Weapon", "Damage riders", "Add 2d8 Radiant damage to weapon hits.", [die(["damage"], "2d8", "Holy Weapon", { damageType: "Radiant", rollScope: "weapon" })]),
  effect("spirit-shroud", "Spirit Shroud", "Damage riders", "Add the configured extra damage to eligible attacks.", [die(["damage"], "1d8", "Spirit Shroud")], BOTH, { configurable: "die" })
];

export const COMBAT_EFFECTS = [
  effect("magic-weapon", "Magic weapon bonus", "Equipment & styles", "Add the configured magic bonus to weapon attacks and damage.", [flat(["attack"], 1, "Magic weapon", { rollScope: "weapon" }), flat(["damage"], 1, "Magic weapon", { rollScope: "weapon", damageType: "same" })], BOTH, { configurable: "flat" }),
  effect("magic-ammunition", "Magic ammunition bonus", "Equipment & styles", "Add the configured bonus to the attack and damage roll made with the ammunition.", [flat(["attack"], 1, "Magic ammunition", { attackTypes: ["ranged"] }), flat(["damage"], 1, "Magic ammunition", { damageType: "same" })], BOTH, { configurable: "flat" }),
  effect("archery", "Archery fighting style", "Equipment & styles", "Add +2 to ranged weapon attack rolls.", [flat(["attack"], 2, "Archery", { attackTypes: ["ranged"] })]),
  effect("dueling", "Dueling fighting style", "Equipment & styles", "Add +2 to eligible one-handed melee weapon damage.", [flat(["damage"], 2, "Dueling", { rollScope: "weapon", attackTypes: ["melee"], damageType: "same" })]),
  effect("great-weapon-fighting-2014", "Great Weapon Fighting", "Equipment & styles", "Reroll a 1 or 2 once on eligible melee weapon damage dice and use the new roll.", [{ contexts: ["damage"], kind: "rerollValues", values: [1, 2], scope: "baseDamage", perDie: true, attackTypes: ["melee"], weaponProperties: ["two-handed", "versatile"], label: "Great Weapon Fighting" }], ["2014"]),
  effect("great-weapon-fighting-2024", "Great Weapon Fighting", "Equipment & styles", "Treat a 1 or 2 on eligible weapon damage dice as a 3.", [{ contexts: ["damage"], kind: "dieFloor", value: 3, scope: "baseDamage", attackTypes: ["melee"], weaponProperties: ["two-handed", "versatile"], label: "Great Weapon Fighting" }], ["2024"]),
  effect("savage-attacker-2024", "Savage Attacker", "Feats", "Roll the weapon's damage dice twice and use either roll.", [{ contexts: ["damage"], kind: "rollTwice", scope: "baseDamage", label: "Savage Attacker" }], ["2024"]),
  effect("great-weapon-master-2014", "Great Weapon Master power attack", "Feats", "Take -5 to the attack and add +10 to its damage.", [flat(["attack"], -5, "Great Weapon Master", { attackTypes: ["melee"], weaponProperties: ["heavy"] }), flat(["damage"], 10, "Great Weapon Master", { attackTypes: ["melee"], weaponProperties: ["heavy"], damageType: "same" })], ["2014"]),
  effect("sharpshooter-2014", "Sharpshooter power attack", "Feats", "Take -5 to the attack and add +10 to its damage.", [flat(["attack"], -5, "Sharpshooter", { attackTypes: ["ranged"] }), flat(["damage"], 10, "Sharpshooter", { attackTypes: ["ranged"], damageType: "same" })], ["2014"]),
  effect("great-weapon-master-2024", "Great Weapon Master damage", "Feats", "Add Proficiency Bonus to the eligible damage once on each of your turns.", [{ contexts: ["damage"], kind: "proficiency", label: "Great Weapon Master", attackTypes: ["melee", "ranged"], weaponProperties: ["heavy"], damageType: "same" }], ["2024"]),
  effect("grappler-2014", "Grappler: grappled target", "Feats", "Gain advantage on attack rolls against a creature you are grappling.", [mode(["attack"], "advantage", "Grappler")], ["2014"]),
  effect("boon-of-fate-bonus", "Boon of Fate: bonus", "Feats", "Add 2d4 to the d20 test after success or failure is known.", [die(["attack", "skill", "save"], "2d4", "Boon of Fate")], ["2024"]),
  effect("boon-of-fate-penalty", "Boon of Fate: penalty", "Feats", "Subtract 2d4 from the d20 test after success or failure is known.", [die(["attack", "skill", "save"], "-2d4", "Boon of Fate", { criticalEligible: false })], ["2024"]),
  effect("boon-combat-prowess", "Boon of Combat Prowess", "Feats", "Turn a missed melee or ranged weapon attack into a hit.", [{ contexts: ["attack"], kind: "missToHit", label: "Combat Prowess", attackTypes: ["melee", "ranged"] }], ["2024"]),
  effect("boon-irresistible", "Boon of Irresistible Offense", "Feats", "Ignore resistance to your Bludgeoning, Piercing, and Slashing damage.", [{ contexts: ["damage"], kind: "ignoreResistance", damageTypes: ["Bludgeoning", "Piercing", "Slashing"], label: "Irresistible Offense" }], ["2024"]),
  effect("alert-2014", "Alert initiative bonus", "Feats", "Add +5 to Initiative.", [flat(["skill"], 5, "Alert", { checks: ["initiative"] })], ["2014"]),
  effect("alert-2024", "Alert initiative bonus", "Feats", "Add your Proficiency Bonus to Initiative.", [{ contexts: ["skill"], kind: "proficiency", label: "Alert", checks: ["initiative"] }], ["2024"]),
  effect("vex-2024", "Vex mastery follow-up", "Weapon mastery", "Apply advantage to the next eligible attack against the target.", [mode(["attack"], "advantage", "Vex")], ["2024"]),
  effect("sap-2024", "Sap mastery penalty", "Weapon mastery", "The affected target's next eligible attack has disadvantage.", [mode(["attack"], "disadvantage", "Sap")], ["2024"]),
  effect("graze-2024", "Graze mastery miss damage", "Weapon mastery", "On a miss, deal damage equal to the attack ability modifier. Enter that modifier if needed.", [flat(["damage"], 3, "Graze", { damageType: "same" })], ["2024"], { configurable: "flat" }),
  effect("stone-of-good-luck", "Stone of Good Luck", "Magic items", "Add +1 to ability checks and saving throws.", [flat(["skill", "save"], 1, "Stone of Good Luck")]),
  effect("luck-blade", "Luck Blade", "Magic items", "Add +1 to attack rolls, damage rolls, and saving throws while the item applies.", [flat(["attack", "save"], 1, "Luck Blade"), flat(["damage"], 1, "Luck Blade", { damageType: "same" })]),
  effect("oil-of-sharpness", "Oil of Sharpness", "Magic items", "Add +3 to weapon attack and damage rolls.", [flat(["attack"], 3, "Oil of Sharpness", { rollScope: "weapon" }), flat(["damage"], 3, "Oil of Sharpness", { rollScope: "weapon", damageType: "same" })]),
  effect("rod-pact-keeper", "Rod of the Pact Keeper", "Magic items", "Add the configured bonus to Warlock spell attacks and save DC.", [flat(["spell"], 1, "Rod of the Pact Keeper", { requiresAttackRoll: true }), { contexts: ["spell"], kind: "saveDC", value: 1, label: "Rod of the Pact Keeper", requiresSaveDC: true }], BOTH, { configurable: "flat" }),
  effect("wand-war-mage", "Wand of the War Mage", "Magic items", "Add the configured bonus to spell attack rolls.", [flat(["spell"], 1, "Wand of the War Mage", { requiresAttackRoll: true })], BOTH, { configurable: "flat" }),
  effect("robe-archmagi", "Robe of the Archmagi", "Magic items", "Add +2 to spell attack rolls and spell save DC.", [flat(["spell"], 2, "Robe of the Archmagi", { requiresAttackRoll: true }), { contexts: ["spell"], kind: "saveDC", value: 2, label: "Robe of the Archmagi", requiresSaveDC: true }]),
  effect("gloves-thievery", "Gloves of Thievery", "Magic items", "Add +5 to Dexterity (Sleight of Hand) checks and lock-picking checks.", [flat(["skill"], 5, "Gloves of Thievery", { checks: ["sleight-of-hand"] })]),
  effect("sentinel-shield", "Sentinel Shield", "Magic items", "Advantage on Initiative and Wisdom (Perception) checks.", [mode(["skill"], "advantage", "Sentinel Shield", { checks: ["initiative", "perception"] })]),
  effect("boots-elvenkind", "Boots of Elvenkind", "Magic items", "Advantage on Dexterity (Stealth) checks that rely on moving silently.", [mode(["skill"], "advantage", "Boots of Elvenkind", { checks: ["stealth"] })]),
  effect("eyes-eagle", "Eyes of the Eagle", "Magic items", "Advantage on Wisdom (Perception) checks that rely on sight.", [mode(["skill"], "advantage", "Eyes of the Eagle", { checks: ["perception"] })]),
  effect("bracers-archery", "Bracers of Archery", "Magic items", "Add +2 to damage rolls with eligible bows.", [flat(["damage"], 2, "Bracers of Archery", { damageType: "same" })]),
  effect("spellguard-shield", "Spellguard Shield", "Magic items", "Advantage on saving throws against spells and magical effects.", [mode(["save"], "advantage", "Spellguard Shield")]),
  effect("magic-resistance", "Magic Resistance", "Magic items", "Advantage on saving throws against spells and other magical effects.", [mode(["save"], "advantage", "Magic Resistance")]),
  effect("concentration-advantage", "Advantage on Concentration", "Class features", "Advantage on Constitution saving throws made to maintain Concentration.", [mode(["save"], "advantage", "Concentration", { abilities: ["con"] })]),
  effect("flame-tongue", "Flame Tongue", "Magic items", "Add 2d6 Fire damage while the weapon is ignited.", [die(["damage"], "2d6", "Flame Tongue", { damageType: "Fire", rollScope: "weapon" })]),
  effect("frost-brand", "Frost Brand", "Magic items", "Add 1d6 Cold damage on a hit.", [die(["damage"], "1d6", "Frost Brand", { damageType: "Cold", rollScope: "weapon" })]),
  effect("dragon-slayer", "Dragon Slayer", "Magic items", "Add 3d6 damage against an eligible dragon.", [die(["damage"], "3d6", "Dragon Slayer", { damageType: "same", rollScope: "weapon" })]),
  effect("giant-slayer", "Giant Slayer", "Magic items", "Add 2d6 damage against an eligible giant.", [die(["damage"], "2d6", "Giant Slayer", { damageType: "same", rollScope: "weapon" })])
];

export const FEATURE_EFFECTS = [
  effect("sneak-attack", "Sneak Attack", "Class features", "Add the character's current Sneak Attack dice when its requirements are met.", [die(["damage"], "3d6", "Sneak Attack", { rollScope: "weapon", damageType: "same" })], BOTH, { configurable: "die", rollScope: "weapon" }),
  effect("reckless-attack", "Reckless Attack", "Class features", "Gain advantage on eligible Strength-based attacks this turn.", [mode(["attack"], "advantage", "Reckless Attack", { abilities: ["str"] })]),
  effect("reckless-target", "Reckless Attack: attacks against you", "Class features", "Attacks against you have advantage until your next turn.", [mode(["attack"], "advantage", "Reckless target")]),
  effect("precise-hunter-2024", "Precise Hunter", "Class features", "Gain advantage on attacks against the creature marked by Hunter’s Mark.", [mode(["attack"], "advantage", "Precise Hunter")], ["2024"]),
  effect("jack-of-all-trades", "Jack of All Trades", "Class features", "Add half your Proficiency Bonus to an ability check that does not already include it.", [{ contexts: ["skill"], kind: "halfProficiency", label: "Jack of All Trades", requiresUntrained: true }], ["2014"]),
  effect("tactical-mind", "Tactical Mind", "Class features", "Add 1d10 after a failed ability check.", [die(["skill"], "1d10", "Tactical Mind")], ["2024"]),
  effect("indomitable-2014", "Indomitable", "Class features", "Reroll the saving throw and use the new roll.", [{ contexts: ["save"], kind: "rerollChoice", value: 1, scope: "d20", label: "Indomitable" }], ["2014"]),
  effect("indomitable-2024", "Indomitable", "Class features", "Reroll the saving throw, add Fighter level, and use the new roll.", [{ contexts: ["save"], kind: "rerollChoice", value: 1, scope: "d20", rerollBonus: 1, label: "Indomitable" }], ["2024"], { configurable: "flat" }),
  effect("aura-of-protection", "Aura of Protection", "Class features", "Add the Paladin's Charisma modifier to saving throws (minimum +1).", [flat(["save"], 1, "Aura of Protection")], BOTH, { configurable: "flat" }),
  effect("innate-sorcery", "Innate Sorcery", "Class features", "Gain advantage on Sorcerer spell attacks and add +1 to Sorcerer spell save DC.", [mode(["spell"], "advantage", "Innate Sorcery", { requiresAttackRoll: true }), { contexts: ["spell"], kind: "saveDC", value: 1, label: "Innate Sorcery", requiresSaveDC: true }], ["2024"]),
  effect("champion-critical", "Champion improved critical", "Class features", "Score a critical hit on a 19 or 20. Configure 18 for 2014 Superior Critical.", [{ contexts: ["attack", "spell"], kind: "criticalRange", value: 19, label: "Improved Critical", requiresAttackRoll: true }], BOTH, { configurable: "flat" }),
  effect("dark-ones-own-luck", "Dark One's Own Luck", "Class features", "Add 1d10 to an ability check or saving throw.", [die(["skill", "save"], "1d10", "Dark One's Own Luck")], ["2014"]),
  effect("reliable-talent", "Reliable Talent", "Class features", "Treat a d20 roll below 10 as 10 on an eligible proficient ability check.", [{ contexts: ["skill"], kind: "d20Floor", value: 10, label: "Reliable Talent", requiresTrained: true }]),
  effect("stroke-of-luck-check", "Stroke of Luck: ability check", "Class features", "Treat the d20 as a 20 for the failed ability check.", [{ contexts: ["skill"], kind: "d20Floor", value: 20, label: "Stroke of Luck" }]),
  effect("stroke-of-luck-attack", "Stroke of Luck: missed attack", "Class features", "Turn the missed attack into a hit.", [{ contexts: ["attack"], kind: "missToHit", label: "Stroke of Luck" }]),
  effect("halfling-lucky", "Halfling Lucky", "Species traits", "Reroll a 1 on the d20 and use the new roll.", [{ contexts: ["attack", "skill", "save", "spell"], kind: "rerollValues", values: [1], scope: "d20", label: "Halfling Lucky" }]),
  effect("dwarven-resilience", "Dwarven Resilience", "Species traits", "Advantage on saving throws against poison.", [mode(["save"], "advantage", "Dwarven Resilience")]),
  effect("gnome-cunning", "Gnome Cunning", "Species traits", "Advantage on Intelligence, Wisdom, and Charisma saving throws against magic.", [mode(["save"], "advantage", "Gnome Cunning", { abilities: ["int", "wis", "cha"] })]),
  effect("brave-2014", "Brave", "Species traits", "Advantage on saving throws against being frightened.", [mode(["save"], "advantage", "Brave")], ["2014"]),
  effect("savage-attacks", "Savage Attacks", "Species traits", "Add one weapon damage die on a critical hit.", [die(["damage"], "1d8", "Savage Attacks", { requiresCritical: true, rollScope: "weapon", damageType: "same", criticalEligible: false })], ["2014"], { configurable: "die" }),
  effect("glibness", "Glibness", "Spells & support", "Treat a Charisma check d20 roll below 15 as 15.", [{ contexts: ["skill"], kind: "d20Floor", value: 15, label: "Glibness", abilities: ["cha"] }])
];
