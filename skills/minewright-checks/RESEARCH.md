# Research: minewright-checks

Findings that back [SKILL.md](SKILL.md). Changes they caused are logged in [CHANGELOG.md](CHANGELOG.md); procedural lessons live in [LEARNINGS.md](LEARNINGS.md); test runs and their evidence in [TESTS.md](TESTS.md); schedule and state in `evergreen.json`. Protocol: MAINTENANCE.md.

Topic: Checking a Bedrock add-on without the game: JSON, manifests, identifiers, TypeScript, ESLint, Creator Tools validate, unit tests in one JSON report. Tier `moderate`. Last refresh 2026-10-27; next due 2026-11-26.

## Current understanding

- No single official checker covers a whole Bedrock add-on project with TypeScript. Mojang's Creator Tools (`@minecraft/creator-tools` 0.20.0, CLI `mct`) validates packs: `mct validate -i <folder> --json --force -o <temp>`; without `-o` it writes reports into `out/` in the current folder, and without `--force` it returns cached results (from Mojang's own debug-addon skill).
- The silent failures players see are invisible entities (no client entity or a missing geometry), missing textures, raw names like `item.foo:bar`, and Content Log errors (Mojang's debug-addon skill lists the same).
- JSON schemas: Blockception/Minecraft-bedrock-json-schemas (release v1.21.73-0, still maintained), and `Mojang/bedrock-samples` carries schemas under `metadata/json_schemas/` (for example `server/entity/1.26.50/PhysicsComponentDefinition.json`), which the 2026-10-27 tooling report missed.
- mw_check.py (this skill) passed json, manifest and identifiers on the fixture and failed all three on a broken copy (2026-10-27, Windows, Python 3.14).
- A static pass does not prove the scripts load: a module version the server lacks only shows on BDS (minewright-server).

## Open questions

- Exit code of `mct validate` when it finds errors (assumed non-zero; not run here because installing the 160 MB package needed approval).
- Should the identifiers check validate against bedrock-samples' JSON schemas (format versions per file type)?
- Should items, blocks and animations get the same reference checks as entities?

## Search plan

Four tracks; every refresh runs at least one query on each, scoped to the time since the last refresh.

Subject:

- Mojang's `plugins/minecraft/skills/debug-addon/SKILL.md` in Mojang/minecraft-creator-tools (what Mojang thinks breaks)
- `Mojang/bedrock-samples` `metadata/json_schemas/` (format versions per file type)

Tooling:

- npm `@minecraft/creator-tools` latest and its CHANGELOG (validator rules, CLI flags)
- `gh release list -R Blockception/Minecraft-bedrock-json-schemas -L 3`; Blockception/minecraft-bedrock-language-server
- `path:SKILL.md "behavior pack" validate` on GitHub; `https://skills.sh/api/search?q=bedrock`

Practice:

- `"mct validate" OR "creator tools" ci github actions <year>`; Bedrock OSS wiki troubleshooting pages

Testing:

- this repository's `tests/test_scripts.py` (fixture pass, broken copy fail); Creator Tools' own test content in `samplecontent/`

Best sources: Mojang's repositories and npm. Noisy: forum threads quoting old format versions.

## Findings log

Newest first. One entry per material finding. `Track` is subject, tooling, practice, or testing.

### R-20261027-4 · 2026-10-27 · Testing: mw_check.py proven on a fixture and a broken copy
- summary: On tests/fixtures/addon json, manifest and identifiers pass (Node checks skip: no package.json). A copy with a malformed JSON file, a reused module UUID, a deleted texture and a wrong geometry id fails json, manifest and identifiers with those errors named. Practice track: nothing dated found.
- track: testing
- sources: local run 2026-10-27; tests/test_scripts.py in this repository (checked 2026-10-27)
- magnitude: n/a (initial)
- applied: C-20261027-1

### R-20261027-3 · 2026-10-27 · Tooling: JSON schemas exist in two places
- summary: Blockception's schemas (release v1.21.73-0, 2025-05-05, commits continuing) and bedrock-samples' `metadata/json_schemas/` (found by GitHub code search for `has_collision`). Not used by mw_check.py yet; carried as an open question.
- track: tooling
- sources: https://github.com/Blockception/Minecraft-bedrock-json-schemas, https://github.com/Mojang/bedrock-samples/tree/main/metadata/json_schemas (checked 2026-10-27)
- magnitude: n/a (initial)
- applied: C-20261027-1

### R-20261027-2 · 2026-10-27 · Subject: what breaks silently in a Bedrock add-on
- summary: Invisible entities, missing textures, raw localisation keys and Content Log errors are the symptoms Mojang's own skill targets. Applied as the identifiers check and the Pitfalls section.
- track: subject
- sources: https://github.com/Mojang/minecraft-creator-tools/tree/main/plugins/minecraft/skills (checked 2026-10-27)
- magnitude: n/a (initial)
- applied: C-20261027-1

### R-20261027-1 · 2026-10-27 · Tooling: Creator Tools validate flags and pitfalls
- summary: Mojang's debug-addon skill runs `npx -y @minecraft/creator-tools@latest validate -i <folder> --json --force` with report files sent to a temp folder, because the CLI writes `out/` into the current folder and caches results. mw_check.py's `--mct` uses the same flags with `--no-install` so nothing is downloaded.
- track: tooling
- sources: https://github.com/Mojang/minecraft-creator-tools/tree/main/plugins/minecraft/skills/debug-addon, https://registry.npmjs.org/@minecraft/creator-tools/latest (checked 2026-10-27)
- magnitude: n/a (initial)
- applied: C-20261027-1
