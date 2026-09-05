# 5E roll modifier audit

Audit baseline: Wizards of the Coast System Reference Document 5.1 and System Reference Document 5.2.1. The app keeps those rules profiles separate. Presets reproduce only the arithmetic or dice operation. A player still decides whether a rule's trigger, target, range, weapon, resource, or timing requirement is satisfied.

## Coverage

| Area | Implemented behavior |
| --- | --- |
| D20 tests | Ability modifier, proficiency, expertise, half proficiency, flat bonuses and penalties, bonus and penalty dice, advantage/disadvantage cancellation, d20 minimums, critical ranges, result-specific rerolls, discretionary post-roll rerolls, automatic failures, and miss-to-hit effects |
| Ability checks | All 18 skills, six straight ability checks, Initiative, check-specific and ability-specific modifiers |
| Saving throws | Six ability saves, death saves, ability-specific advantage/disadvantage, cover bonuses, and automatic Strength/Dexterity failures |
| Attacks | Melee, ranged, and spell attack scoping, target AC, cover, unseen combatants, range, nearby threats, conditions, automatic criticals, and total cover |
| Damage | Flat and dice riders, critical dice, damage-die rerolls, die-face minimums, roll-twice/keep-highest, damage thresholds, and per-type resistance, vulnerability, and immunity |
| Spellcasting | Spell attack changes, spell save DC changes, support dice, penalties, and typed spell damage riders |
| Rules profiles | Separate 2014 and 2024 versions for Exhaustion, Inspiration, Great Weapon Fighting, Great Weapon Master, Sharpshooter, Hunter's Mark, Alert, Indomitable, and 2024 weapon masteries |
| Sources | Core situations, conditions, common roll-modifying spells, SRD class and species features, SRD feats, fighting styles, weapon masteries, and common SRD magic items |

## Catalog and extension boundary

The bundled catalog contains more than 120 applicable presets in each rules profile. It covers the named roll modifiers in the open SRDs plus generic entries for effects such as magic resistance and concentration advantage.

Material outside the SRDs can introduce differently named features and items, so completeness cannot be maintained as a finite copyrighted-name list. The custom modifier editor therefore exposes every operation used by the engine: dice, flat values, advantage/disadvantage, AC and save-DC changes, typed multipliers, d20 and die minimums, critical thresholds, automatic critical dice, automatic failure, blocked rolls, specific-face rerolls, post-roll rerolls, roll-twice damage, and thresholds. This lets a player reproduce a non-SRD feature without the app redistributing its rules text.

## Corrections made by this audit

- Resistance, vulnerability, and immunity now apply to the configured damage type instead of multiplying an entire mixed-damage roll.
- Critical hits do not double penalty dice.
- Spell-attack bonuses no longer leak into spell damage.
- Scoped modifiers are disabled when the selected ability, check, attack type, proficiency state, or roll phase does not qualify.
- Great Weapon Fighting, Savage Attacker, Reliable Talent, Glibness, Halfling Lucky, Heroic Inspiration, automatic criticals, and expanded critical ranges use their own dice mechanics instead of approximated flat values.
- Straight ability checks, Initiative, and death saving throws are directly selectable.
