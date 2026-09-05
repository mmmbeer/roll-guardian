# What Do I Roll?

A self-contained, mobile-first 5E dice assistant built with HTML, CSS, and JavaScript.

The roll view is organized as a full-viewport dice platform. Modifier groups and global search sit in the top rail, applicable modifiers appear directly below it, and context plus weapon, spell, skill, or save choices stay in two compact bottom rails.

## Included

- 2014 and 2024 rule profiles
- Attack, damage, spell, skill, saving throw, and custom roll contexts
- Weapon-specific attack and damage math
- Rollable SRD 5.1 and 5.2.1 spell catalogs with attack/damage phases and scaling
- Imported class detection with context-aware character feature shortcuts
- More than 120 modifier presets per rules profile across conditions, situations, spells, features, feats, fighting styles, weapon masteries, and SRD magic items
- Typed resistance, vulnerability, immunity, damage thresholds, rerolls, die minimums, automatic criticals, expanded critical ranges, and spell save DC changes
- User-defined flat, dice, advantage, disadvantage, AC, save-DC, damage-defense, reroll, minimum-result, and critical effects
- Skill checks, straight ability checks, Initiative, ability saving throws, and death saving throws
- Client-side D&D Beyond PDF and JSON character import
- Local character storage, backup export/import, and roll history
- Canvas-rendered 3D polyhedral dice whose final faces drive the calculated result
- Eight solid dice colors and ten procedural materials with Proton-powered, reduced-motion-aware roll effects

## Run locally

Serve the `dist` directory with any static web server, or run:

```sh
npm run dev
```

No application build step is required.

The Proton particle engine is vendored with the application, so dice effects do not require CDN access or runtime network requests.

## Cloudflare Pages

The repository includes a production `wrangler.jsonc` with `pages_build_output_dir` set to `./dist`.

For a Git-connected Cloudflare Pages project use:

- Production branch: `main`
- Framework preset: `None`
- Build command: `exit 0`
- Build output directory: `dist`
- Root directory: repository root

Pages Git integration does not use a separate **Deploy command**. If the Cloudflare settings require one and the build log says `Executing user deploy command`, the repository was connected through **Workers Builds**, not **Pages > Import an existing Git repository**. Create or reconnect it as a Pages Git project instead.

For an intentionally configured Direct Upload or third-party CI workflow, deploy with:

```sh
npm run deploy
```

That CI environment must provide `CLOUDFLARE_API_TOKEN` with **Account > Cloudflare Pages > Edit** permission for the target account. Do not use `npx wrangler deploy`, which targets Cloudflare Workers.

The `dist/_headers` file sets a restrictive content security policy and other browser security headers. Character data remains in the visitor's browser and the application makes no network requests.

## Tests

```sh
npm test
```

The detailed modifier coverage matrix and audit boundary are in [`docs/modifier-audit.md`](docs/modifier-audit.md).

Third-party software notices are in [`docs/third-party-notices.md`](docs/third-party-notices.md).

## Character imports

JSON exports provide the most complete import, including classes, recognizable class features, nested spell groups, and preparation state. Prepared and available character spells are marked and grouped above a level-appropriate SRD catalog. D&D Beyond PDF structure varies, so the PDF importer reads exposed form fields and applies conservative heuristics. Review imported weapons and ability scores before play.

## Open rules material

The in-app help panel contains the full attribution notices for SRD 5.1 and SRD 5.2.1 under CC BY 4.0.
