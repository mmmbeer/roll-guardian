const BOTH = ["2014", "2024"];
const effect = (id, name, group, summary, entries, rulesets = BOTH, extra = {}) =>
  ({ id, name, group, summary, entries, rulesets, ...extra });
const mode = (contexts, value, label, extra = {}) => ({ contexts, kind: "mode", mode: value, label, ...extra });
const flat = (contexts, value, label, extra = {}) => ({ contexts, kind: "flat", value, label, ...extra });
const die = (contexts, notation, label, extra = {}) => ({ contexts, kind: "die", notation, label, ...extra });

export const CORE_EFFECTS = [
  effect("help-check", "Help with an ability check", "Situational", "Gain advantage when another creature can help with the task.", [mode(["skill"], "advantage", "Help")]),
  effect("help-attack", "Help with an attack", "Situational", "Gain advantage on the first eligible attack against the distracted target.", [mode(["attack"], "advantage", "Help")]),
  effect("unseen-attacker", "You are unseen by the target", "Situational", "Your attack roll has advantage while the target cannot see you.", [mode(["attack"], "advantage", "Unseen attacker")]),
  effect("unseen-target", "You cannot see the target", "Situational", "Your attack roll has disadvantage while you cannot see the target.", [mode(["attack"], "disadvantage", "Unseen target")]),
  effect("long-range", "Long-range weapon attack", "Situational", "A ranged weapon attack beyond normal range has disadvantage.", [mode(["attack"], "disadvantage", "Long range", { attackTypes: ["ranged"] })]),
  effect("ranged-threatened", "Ranged attack with an enemy within 5 ft.", "Situational", "The ranged attack has disadvantage while an eligible hostile creature is within 5 feet.", [mode(["attack"], "disadvantage", "Enemy nearby", { attackTypes: ["ranged", "spell"] })]),
  effect("underwater-attack", "Unsuitable underwater attack", "Situational", "The attack has disadvantage unless the weapon meets the underwater-combat exception.", [mode(["attack"], "disadvantage", "Underwater")]),
  effect("mounted-smaller-target", "Mounted against a smaller target", "Situational", "A melee attack against an unmounted creature smaller than your mount has advantage.", [mode(["attack"], "advantage", "Mounted", { attackTypes: ["melee"] })], ["2014"]),
  effect("inspiration-2014", "Inspiration", "Situational", "Spend Inspiration to gain advantage on this ability check, attack roll, or saving throw.", [mode(["attack", "skill", "save"], "advantage", "Inspiration")], ["2014"]),
  effect("heroic-inspiration-2024", "Heroic Inspiration", "Situational", "After the roll, reroll one die and use the new result.", [{ contexts: ["attack", "damage", "skill", "save", "spell", "custom"], kind: "rerollChoice", value: 1, label: "Heroic Inspiration" }], ["2024"]),
  effect("armor-untrained", "Armor worn without training", "Situational", "Disadvantage on applicable Strength- or Dexterity-based d20 tests.", [mode(["attack", "skill", "save"], "disadvantage", "Untrained armor", { abilities: ["str", "dex"] })]),
  effect("heavy-weapon-small-2014", "Small creature using a Heavy weapon", "Situational", "The attack roll has disadvantage.", [mode(["attack"], "disadvantage", "Heavy weapon", { weaponProperties: ["heavy"] })], ["2014"]),
  effect("heavy-weapon-requirement-2024", "Heavy weapon requirement not met", "Situational", "The attack roll has disadvantage if the required Strength or Dexterity score is below 13.", [mode(["attack"], "disadvantage", "Heavy requirement", { weaponProperties: ["heavy"] })], ["2024"]),
  effect("target-dodging", "Target is Dodging", "Target conditions", "Attack rolls against a target taking the Dodge action have disadvantage when its defenses apply.", [mode(["attack"], "disadvantage", "Dodge")]),
  effect("target-charmed", "Target is charmed by you", "Target conditions", "Gain advantage on an eligible social ability check against the charmed target.", [mode(["skill"], "advantage", "Charmed target", { checks: ["deception", "intimidation", "performance", "persuasion", "ability-cha"] })]),
  effect("blinded-self", "Blinded", "Your conditions", "Your attack rolls have disadvantage.", [mode(["attack"], "disadvantage", "Blinded")]),
  effect("frightened", "Frightened (source visible)", "Your conditions", "Attacks and ability checks have disadvantage while the source is visible.", [mode(["attack", "skill"], "disadvantage", "Frightened")]),
  effect("invisible-self", "Invisible", "Your conditions", "Your attacks have advantage. Under 2024 rules, Initiative also has advantage.", [
    mode(["attack"], "advantage", "Invisible"), mode(["skill"], "advantage", "Invisible", { checks: ["initiative"], rulesets: ["2024"] })
  ]),
  effect("poisoned", "Poisoned", "Your conditions", "Attack rolls and ability checks have disadvantage.", [mode(["attack", "skill"], "disadvantage", "Poisoned")]),
  effect("prone-self", "Prone", "Your conditions", "Your attack rolls have disadvantage.", [mode(["attack"], "disadvantage", "Prone")]),
  effect("restrained-self", "Restrained", "Your conditions", "Your attacks and Dexterity saving throws have disadvantage.", [
    mode(["attack"], "disadvantage", "Restrained"), mode(["save"], "disadvantage", "Restrained", { abilities: ["dex"] })
  ]),
  effect("squeezing-self", "Squeezing", "Your conditions", "Attacks and Dexterity saving throws have disadvantage while squeezing.", [
    mode(["attack"], "disadvantage", "Squeezing"), mode(["save"], "disadvantage", "Squeezing", { abilities: ["dex"] })
  ]),
  effect("auto-fail-str-dex", "Paralyzed, petrified, stunned, or unconscious", "Your conditions", "Strength and Dexterity saving throws automatically fail.", [{ contexts: ["save"], kind: "automaticFailure", label: "Automatic failure", abilities: ["str", "dex"] }]),
  effect("target-blinded", "Target blinded", "Target conditions", "Attack rolls against the target have advantage.", [mode(["attack"], "advantage", "Target blinded")]),
  effect("target-invisible", "Target invisible", "Target conditions", "Attack rolls against the target have disadvantage if you cannot see it.", [mode(["attack"], "disadvantage", "Target invisible")]),
  effect("target-paralyzed-near", "Target paralyzed (within 5 ft.)", "Target conditions", "Attacks have advantage and a hit is a critical hit within 5 feet.", [mode(["attack"], "advantage", "Target paralyzed"), { contexts: ["attack"], kind: "criticalOnHit", label: "Paralyzed target" }, { contexts: ["damage"], kind: "criticalDamage", label: "Paralyzed target" }]),
  effect("target-paralyzed-far", "Target paralyzed (farther than 5 ft.)", "Target conditions", "Attack rolls against the target have advantage.", [mode(["attack"], "advantage", "Target paralyzed")]),
  effect("target-petrified", "Target petrified", "Target conditions", "Attacks have advantage and the target has resistance to all damage.", [mode(["attack"], "advantage", "Target petrified"), { contexts: ["damage"], kind: "multiplier", value: 0.5, damageType: "*", label: "Petrified resistance" }]),
  effect("target-prone-near", "Target prone (within 5 ft.)", "Target conditions", "Attacks from within 5 feet have advantage.", [mode(["attack"], "advantage", "Target prone nearby")]),
  effect("target-prone-far", "Target prone (farther than 5 ft.)", "Target conditions", "Attacks from farther than 5 feet have disadvantage.", [mode(["attack"], "disadvantage", "Target prone at range")]),
  effect("target-restrained", "Target restrained", "Target conditions", "Attack rolls against the target have advantage.", [mode(["attack"], "advantage", "Target restrained")]),
  effect("target-squeezing", "Target squeezing", "Target conditions", "Attack rolls against a squeezing target have advantage.", [mode(["attack"], "advantage", "Target squeezing")]),
  effect("target-stunned", "Target stunned", "Target conditions", "Attack rolls against the target have advantage.", [mode(["attack"], "advantage", "Target stunned")]),
  effect("target-unconscious-near", "Target unconscious (within 5 ft.)", "Target conditions", "Attacks have advantage and a hit is a critical hit within 5 feet.", [mode(["attack"], "advantage", "Target unconscious"), { contexts: ["attack"], kind: "criticalOnHit", label: "Unconscious target" }, { contexts: ["damage"], kind: "criticalDamage", label: "Unconscious target" }]),
  effect("target-unconscious-far", "Target unconscious (farther than 5 ft.)", "Target conditions", "Attack rolls against the target have advantage.", [mode(["attack"], "advantage", "Target unconscious")]),
  effect("half-cover", "Target has half cover", "Target defenses", "The target gains +2 AC against the attack.", [{ contexts: ["attack"], kind: "targetAC", value: 2, label: "Half cover" }]),
  effect("three-quarter-cover", "Target has three-quarters cover", "Target defenses", "The target gains +5 AC against the attack.", [{ contexts: ["attack"], kind: "targetAC", value: 5, label: "Three-quarters cover" }]),
  effect("total-cover", "Target has total cover", "Target defenses", "The target cannot be targeted directly by the attack or spell.", [{ contexts: ["attack", "spell"], kind: "blocked", label: "Total cover" }]),
  effect("self-half-cover", "You have half cover", "Your defenses", "Add +2 to Dexterity saving throws.", [flat(["save"], 2, "Half cover", { abilities: ["dex"] })]),
  effect("self-three-quarter-cover", "You have three-quarters cover", "Your defenses", "Add +5 to Dexterity saving throws.", [flat(["save"], 5, "Three-quarters cover", { abilities: ["dex"] })]),
  effect("exhaustion-2014-checks", "Exhaustion level 1+", "Your conditions", "Disadvantage on ability checks.", [mode(["skill"], "disadvantage", "Exhaustion")], ["2014"]),
  effect("exhaustion-2014-combat", "Exhaustion level 3+", "Your conditions", "Disadvantage on attack rolls and saving throws.", [mode(["attack", "save"], "disadvantage", "Exhaustion")], ["2014"]),
  effect("exhaustion-2024", "Exhaustion (2024)", "Your conditions", "Subtract 2 from every d20 test for each Exhaustion level.", [flat(["attack", "skill", "save"], -2, "Exhaustion")], ["2024"], { configurable: "flatNegative" }),
  effect("target-resistant", "Target resistant", "Target defenses", "Halve damage of the configured type after the roll, rounding down.", [{ contexts: ["damage"], kind: "multiplier", value: 0.5, label: "Resistance" }], BOTH, { configurable: "damageType" }),
  effect("target-vulnerable", "Target vulnerable", "Target defenses", "Double damage of the configured type after the roll.", [{ contexts: ["damage"], kind: "multiplier", value: 2, label: "Vulnerability" }], BOTH, { configurable: "damageType" }),
  effect("target-immune", "Target immune", "Target defenses", "Reduce damage of the configured type to 0.", [{ contexts: ["damage"], kind: "multiplier", value: 0, label: "Immunity" }], BOTH, { configurable: "damageType" }),
  effect("ignore-resistance", "Ignore damage resistance", "Target defenses", "Ignore resistance to the configured damage type when a rule permits it.", [{ contexts: ["damage"], kind: "ignoreResistance", damageTypes: ["*"], label: "Ignore resistance" }], BOTH, { configurable: "damageType" }),
  effect("damage-threshold", "Damage threshold", "Target defenses", "Deal no damage unless the configured threshold is met or exceeded.", [{ contexts: ["damage"], kind: "damageThreshold", value: 10, label: "Damage threshold" }], BOTH, { configurable: "flat" })
];
