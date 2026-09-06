# Modifier usage audit — 1.6.0

Reviewed the complete bundled catalog and all generated character-feature variants. Usage belongs to each effect rather than to a die size or arithmetic operation.

- **single**: one granted use or a limited resource. After actual use, ask whether to remove it from both selected and active effects.
- **turn**: limited to an eligible turn or attack. Ask after use; players can keep it for a renewed opportunity or remove it until it is eligible again.
- **persistent**: remains active until removed. Durations, ammunition counts, concentration, and rest/turn boundaries are not tracked automatically.
- **after roll**: held out of the initial dice. Offer the bonus or penalty after rolling. Preserve all original dice and update the same history entry. Declining does not spend it.

## Rules corrections and timing

- Bardic Inspiration uses the source bard's class level: d6 at 1–4, d8 at 5–9, d10 at 10–14, and d12 at 15–20. Imported Bard class levels and legacy configured dice are supported. A separate source-level override accommodates an ally's Inspiration.
- 2014 Bardic Inspiration is offered before the DM announces the outcome. 2024 Bardic Inspiration requires a failed test: known attack hits are not prompted, and otherwise the prompt asks the player to confirm failure. Skills and saves have no configurable DC, so their success is not inferred.
- Guidance is one use in 2014. In 2024 it remains active for its configured skill.
- Resistance is one saving-throw bonus in 2014. The 2024 spell is a lasting, typed damage reduction in the target drawer. Its negative die is not doubled on a critical hit.
- Bardic Inspiration, Dark One's Own Luck, Tactical Mind, and Boon of Fate dice are offered after the original roll.
- Heroic Inspiration and Indomitable are spent only when the player chooses their reroll. Choosing one no longer applies every available reroll resource's bonus.
- Help, Inspiration, next-attack bonuses/penalties, Mind Sliver, and limited class/feat/mastery modifiers receive cleanup prompts. Lasting support, item riders, and automatic species/style rules remain active.
- Custom modifiers expose lasting, one-use, and once-per-turn usage.
- The imported Divine Smite builder no longer inserts an invalid boolean into the feature list; it is configurable and classified as one use.

This is a lifecycle audit, not an automated resource or combat-trigger engine. The player must confirm resource availability, feature eligibility, and renewals. Tactical Mind resource refunds on unsuccessful checks are still adjudicated by the player. No cleanup runs for a declined optional die or an irrelevant modifier.

## Sources

[2014 Bard](https://www.dndbeyond.com/classes/1-bard), [2024 Bard](https://www.dndbeyond.com/classes/2190876-bard), [2024 Guidance](https://www.dndbeyond.com/spells/2618971-guidance), [2024 Resistance](https://www.dndbeyond.com/spells/2618947-resistance), and the [open SRDs](https://www.dndbeyond.com/srd).

## Complete classification

155 unique presets and character-feature variants. Context lists are broad categories; the engine also checks abilities, skills, attack type, rules version, spell phase, and other declared scopes.

| Modifier | ID | 2014 usage | 2024 usage | Contexts |
| --- | --- | --- | --- | --- |
| Advantage on Concentration | concentration-advantage | persistent | persistent | save |
| Agonizing Blast | agonizing-blast | persistent | persistent | damage |
| Alert initiative bonus | alert-2014 | persistent | — | skill |
| Alert initiative bonus | alert-2024 | — | persistent | skill |
| Archery fighting style | archery | persistent | persistent | attack |
| Armor worn without training | armor-untrained | persistent | persistent | attack, skill, save |
| Aura of Protection | aura-of-protection | persistent | persistent | save |
| Bane | bane | persistent | persistent | attack, save |
| Bardic Inspiration | bardic-inspiration | single · after roll | single · after roll | attack, skill, save |
| Beacon of Hope | beacon-of-hope | persistent | persistent | save |
| Bestow Curse disadvantage | bestow-curse | persistent | persistent | skill, save |
| Bless | bless | persistent | persistent | attack, save |
| Blinded | blinded-self | persistent | persistent | attack |
| Boon of Combat Prowess | boon-combat-prowess | — | single | attack |
| Boon of Fate: bonus | boon-of-fate-bonus | — | single · after roll | attack, skill, save |
| Boon of Fate: penalty | boon-of-fate-penalty | — | single · after roll | attack, skill, save |
| Boon of Irresistible Offense | boon-irresistible | — | persistent | damage |
| Boots of Elvenkind | boots-elvenkind | persistent | persistent | skill |
| Bracers of Archery | bracers-archery | persistent | persistent | damage |
| Brave | brave-2014 | persistent | — | save |
| Brutal Strike | brutal-strike | turn | turn | damage |
| Champion improved critical | champion-critical | persistent | persistent | attack, spell |
| Colossus Slayer | colossus-slayer | turn | turn | damage |
| Crusader's Mantle | crusaders-mantle | persistent | persistent | damage |
| Damage threshold | damage-threshold | persistent | persistent | damage |
| Dark One's Own Luck | dark-ones-own-luck | single · after roll | — | skill, save |
| Divine Favor | divine-favor | persistent | persistent | damage |
| Divine Smite | divine-smite | single | — | damage |
| Divine Strike | divine-strike | turn | turn | damage |
| Dragon Slayer | dragon-slayer | persistent | persistent | damage |
| Dread Ambusher | dread-ambusher | turn | turn | damage |
| Dueling fighting style | dueling | persistent | persistent | damage |
| Dwarven Resilience | dwarven-resilience | persistent | persistent | save |
| Elemental Weapon | elemental-weapon | persistent | — | attack, damage |
| Enhance Ability: Charisma | enhance-cha | persistent | persistent | skill |
| Enhance Ability: Constitution | enhance-con | persistent | persistent | skill |
| Enhance Ability: Dexterity | enhance-dex | persistent | persistent | skill |
| Enhance Ability: Intelligence | enhance-int | persistent | persistent | skill |
| Enhance Ability: Strength | enhance-str | persistent | persistent | skill |
| Enhance Ability: Wisdom | enhance-wis | persistent | persistent | skill |
| Enlarge | enlarge | persistent | persistent | damage |
| Exhaustion (2024) | exhaustion-2024 | — | persistent | attack, skill, save |
| Exhaustion level 1+ | exhaustion-2014-checks | persistent | — | skill |
| Exhaustion level 3+ | exhaustion-2014-combat | persistent | — | attack, save |
| Eyes of the Eagle | eyes-eagle | persistent | persistent | skill |
| Faerie Fire on target | faerie-fire | persistent | persistent | attack |
| Flame Arrows | flame-arrows | persistent | persistent | damage |
| Flame Tongue | flame-tongue | persistent | persistent | damage |
| Foresight | foresight | persistent | persistent | attack, skill, save |
| Frightened (source visible) | frightened | persistent | persistent | attack, skill |
| Frost Brand | frost-brand | persistent | persistent | damage |
| Gathered Swarm | gathered-swarm | turn | turn | damage |
| Giant Slayer | giant-slayer | persistent | persistent | damage |
| Giant’s Might | giant-s-might | turn | turn | damage |
| Glibness | glibness | persistent | persistent | skill |
| Gloves of Thievery | gloves-thievery | persistent | persistent | skill |
| Gnome Cunning | gnome-cunning | persistent | persistent | save |
| Grappler: grappled target | grappler-2014 | persistent | — | attack |
| Graze mastery miss damage | graze-2024 | — | persistent | damage |
| Great Weapon Fighting | great-weapon-fighting-2014 | persistent | — | damage |
| Great Weapon Fighting | great-weapon-fighting-2024 | — | persistent | damage |
| Great Weapon Master damage | great-weapon-master-2024 | — | turn | damage |
| Great Weapon Master power attack | great-weapon-master-2014 | persistent | — | attack, damage |
| Guidance | guidance | single | persistent | skill |
| Guiding Bolt follow-up | guiding-bolt-followup | single | single | attack |
| Halfling Lucky | halfling-lucky | persistent | persistent | attack, skill, save, spell |
| Haste | haste | persistent | persistent | save |
| Heavy weapon requirement not met | heavy-weapon-requirement-2024 | — | persistent | attack |
| Help with an ability check | help-check | single | single | skill |
| Help with an attack | help-attack | single | single | attack |
| Heroic Inspiration | heroic-inspiration-2024 | — | single | attack, damage, skill, save, spell, custom |
| Hex | hex | persistent | persistent | damage |
| Holy Aura | holy-aura | persistent | persistent | save, attack |
| Holy Weapon | holy-weapon | persistent | persistent | damage |
| Hunter’s Mark | hunters-mark | persistent | persistent | damage, skill |
| Ignore damage resistance | ignore-resistance | persistent | persistent | damage |
| Improved Divine Smite | improved-divine-smite | persistent | — | damage |
| Indomitable | indomitable-2014 | single | — | save |
| Indomitable | indomitable-2024 | — | single | save |
| Innate Sorcery | innate-sorcery | — | persistent | spell |
| Inspiration | inspiration-2014 | single | — | attack, skill, save |
| Invisible | invisible-self | persistent | persistent | attack, skill |
| Jack of All Trades | jack-of-all-trades | persistent | — | skill |
| Long-range weapon attack | long-range | persistent | persistent | attack |
| Luck Blade | luck-blade | persistent | persistent | attack, save, damage |
| Magic ammunition bonus | magic-ammunition | persistent | persistent | attack, damage |
| Magic Resistance | magic-resistance | persistent | persistent | save |
| Magic weapon bonus | magic-weapon | persistent | persistent | attack, damage |
| Mind Sliver penalty | mind-sliver | single | single | save |
| Mounted against a smaller target | mounted-smaller-target | persistent | — | attack |
| Oil of Sharpness | oil-of-sharpness | persistent | persistent | attack, damage |
| Paralyzed, petrified, stunned, or unconscious | auto-fail-str-dex | persistent | persistent | save |
| Pass without Trace | pass-without-trace | persistent | persistent | skill |
| Poisoned | poisoned | persistent | persistent | attack, skill |
| Precise Hunter | precise-hunter-2024 | — | persistent | attack |
| Prone | prone-self | persistent | persistent | attack |
| Protection from Evil and Good | protection-evil-good | persistent | persistent | attack |
| Psychic Blades | psychic-blades | single | single | damage |
| Radiant Strikes | radiant-strikes | — | persistent | damage |
| Rage damage | rage-damage | persistent | persistent | damage |
| Ranged attack with an enemy within 5 ft. | ranged-threatened | persistent | persistent | attack |
| Reckless Attack | reckless-attack | persistent | persistent | attack |
| Reckless Attack: attacks against you | reckless-target | persistent | persistent | attack |
| Reduce | reduce | persistent | persistent | damage |
| Reliable Talent | reliable-talent | persistent | persistent | skill |
| Resistance | resistance-spell | single | — | save |
| Resistance spell on target | resistance-spell-2024 | — | persistent | damage |
| Restrained | restrained-self | persistent | persistent | attack, save |
| Robe of the Archmagi | robe-archmagi | persistent | persistent | spell |
| Rod of the Pact Keeper | rod-pact-keeper | persistent | persistent | spell |
| Sap mastery penalty | sap-2024 | — | single | attack |
| Savage Attacker | savage-attacker-2024 | — | turn | damage |
| Savage Attacks | savage-attacks | persistent | — | damage |
| Sentinel Shield | sentinel-shield | persistent | persistent | skill |
| Sharpshooter power attack | sharpshooter-2014 | persistent | — | attack, damage |
| Small creature using a Heavy weapon | heavy-weapon-small-2014 | persistent | — | attack |
| Sneak Attack | sneak-attack | turn | turn | damage |
| Spellguard Shield | spellguard-shield | persistent | persistent | save |
| Spirit Shroud | spirit-shroud | persistent | persistent | damage |
| Squeezing | squeezing-self | persistent | persistent | attack, save |
| Stone of Good Luck | stone-of-good-luck | persistent | persistent | skill, save |
| Stroke of Luck: ability check | stroke-of-luck-check | single | single | skill |
| Stroke of Luck: missed attack | stroke-of-luck-attack | single | single | attack |
| Synaptic Static penalty | synaptic-static | persistent | persistent | attack, skill, save |
| Tactical Mind | tactical-mind | — | single · after roll | skill |
| Target blinded | target-blinded | persistent | persistent | attack |
| Target has half cover | half-cover | persistent | persistent | attack |
| Target has three-quarters cover | three-quarter-cover | persistent | persistent | attack |
| Target has total cover | total-cover | persistent | persistent | attack, spell |
| Target immune | target-immune | persistent | persistent | damage |
| Target invisible | target-invisible | persistent | persistent | attack |
| Target is charmed by you | target-charmed | persistent | persistent | skill |
| Target is Dodging | target-dodging | persistent | persistent | attack |
| Target paralyzed (farther than 5 ft.) | target-paralyzed-far | persistent | persistent | attack |
| Target paralyzed (within 5 ft.) | target-paralyzed-near | persistent | persistent | attack, damage |
| Target petrified | target-petrified | persistent | persistent | attack, damage |
| Target prone (farther than 5 ft.) | target-prone-far | persistent | persistent | attack |
| Target prone (within 5 ft.) | target-prone-near | persistent | persistent | attack |
| Target resistant | target-resistant | persistent | persistent | damage |
| Target restrained | target-restrained | persistent | persistent | attack |
| Target squeezing | target-squeezing | persistent | persistent | attack |
| Target stunned | target-stunned | persistent | persistent | attack |
| Target unconscious (farther than 5 ft.) | target-unconscious-far | persistent | persistent | attack |
| Target unconscious (within 5 ft.) | target-unconscious-near | persistent | persistent | attack, damage |
| Target vulnerable | target-vulnerable | persistent | persistent | damage |
| True Strike | true-strike-2014 | single | — | attack |
| Unsuitable underwater attack | underwater-attack | persistent | persistent | attack |
| Vex mastery follow-up | vex-2024 | — | single | attack |
| Vicious Mockery penalty | vicious-mockery | single | single | attack |
| Wand of the War Mage | wand-war-mage | persistent | persistent | spell |
| Warding Bond | warding-bond | persistent | persistent | save |
| You are unseen by the target | unseen-attacker | persistent | persistent | attack |
| You cannot see the target | unseen-target | persistent | persistent | attack |
| You have half cover | self-half-cover | persistent | persistent | save |
| You have three-quarters cover | self-three-quarter-cover | persistent | persistent | save |
