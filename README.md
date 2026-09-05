# What Do I Roll?

A dependency-free, mobile-first 5E dice assistant built with HTML, CSS, and JavaScript.

## Included

- 2014 and 2024 rule profiles
- Attack, damage, spell, skill, saving throw, and custom roll contexts
- Weapon-specific attack and damage math
- Conditions, feats, spell riders, target cover, resistance, and vulnerability
- User-defined flat, dice, advantage, disadvantage, target-AC, and damage-multiplier effects
- Client-side D&D Beyond PDF and JSON character import
- Local character storage, backup export/import, and roll history
- Canvas-rendered 3D polyhedral dice whose final faces drive the calculated result

## Run locally

Serve the `dist` directory with any static web server. No build step or external runtime dependency is required.

## Cloudflare Pages

The repository includes a production `wrangler.jsonc` with `pages_build_output_dir` set to `./dist`.

For a Git-connected Cloudflare Pages project use:

- Production branch: `main`
- Framework preset: `None`
- Build command: leave blank
- Build output directory: `dist`
- Root directory: repository root

The `dist/_headers` file sets a restrictive content security policy and other browser security headers. Character data remains in the visitor's browser and the application makes no network requests.

## Character imports

JSON exports provide the most complete import. D&D Beyond PDF structure varies, so the PDF importer reads exposed form fields and applies conservative heuristics. Review imported weapons and ability scores before play.

## Open rules material

The in-app help panel contains the full attribution notices for SRD 5.1 and SRD 5.2.1 under CC BY 4.0.
