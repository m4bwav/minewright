# Research: minewright-hud

Findings that back [SKILL.md](SKILL.md). Changes they caused are logged in [CHANGELOG.md](CHANGELOG.md); procedural lessons live in [LEARNINGS.md](LEARNINGS.md); test runs and their evidence in [TESTS.md](TESTS.md); schedule and state in `evergreen.json`. Protocol: MAINTENANCE.md.

Topic: Bedrock HUD and UI for add-ons: JSON UI hud_screen, Ore UI risk, title and actionbar patterns, animations, item textures, server-ui forms, vanilla fallback. Tier `fast`. Last refresh 2026-10-27; next due 2026-11-10.

## Current understanding

- `hud_screen.json` is still JSON UI in Mojang's samples (commit for v1.26.60.5, 2026-10-28; the hotbar was restructured there, R-20261030-1), so resource packs can still change the HUD today.
- wiki.bedrock.dev (community) warns JSON UI is being deprecated for Ore UI, which packs cannot modify, and that JSON UI add-ons will eventually break. No Mojang statement or timeline was found. Feedback-site threads (user posts) say the hotbar selector moved to Ore UI. Emojis are not supported on Ore UI screens.
- Patterns: Preserve Title Texts (hidden `data_control`, `#hud_title_text_string`, `binding_condition: "visibility_changed"`); string to number with `0 + #str`; `anim_type` offset, alpha and size with from, to, duration, easing, play_event, end_event, as used in Mojang's `ui_common.json` and the HUD's own item-name popup.
- No JSON UI control renders an item by id; the hotbar uses a hard-coded `custom` renderer. Custom glyph sheets (`font/glyph_E0.png` to `glyph_F8.png`, 16 by 16 cells) are documented only by the community wiki, as not officially supported.
- Script API display: `ScreenDisplay` has `setTitle`, `updateSubtitle`, `setActionBar`, `setHudVisibility`, `hideAllExcept`, `resetHudElementsVisibility` (stable page, checked 2026-10-27); `TitleDisplayOptions` in ticks; `HudElement` stable since 1.11.0.
- `@minecraft/server-ui` has only forms (`ActionFormData`, `MessageFormData`, `ModalFormData`): dialogs, not a HUD. Stable version 2.3.0 on npm and on BDS 1.26.60.6 (Learn's module page still says 2.2.0).

- Item texture paths must come from `item_texture.json`, whose keys often differ from item ids; compass and clock are animated atlases (R-20261027-6). Bedrock Dedicated Server cannot exercise any HUD or resource-pack work (R-20261027-7).

## Open questions

- Which HUD screens has Ore UI taken over as of each release? Needs a check of `hud_screen.json` in each bedrock-samples release.
- Does an `image` control with a bound texture path to `textures/items/<name>` work for every vanilla item (block items, flattened names)? Untested in game.
- Is there a Microsoft Learn page for custom fonts? The guessed slug returned 404.
- Do the example's `title_frame` replace, factory-child animation and blank-texture trick work in the game? Built, not yet seen (L-002, L-004).

## Search plan

Four tracks; every refresh runs at least one query on each, scoped to the time since the last refresh.

Subject:

- `gh api repos/Mojang/bedrock-samples/commits?path=resource_pack/ui/hud_screen.json` (is the HUD still JSON UI, what changed)
- wiki.bedrock.dev JSON UI pages (intro, preserve title texts, type conversion); feedback.minecraft.net `ore ui` threads, newest first
- Learn `scriptapi/minecraft/server/screendisplay` and the server-ui module page

Tooling:

- `path:SKILL.md "json ui"` on GitHub; Blockception language server (JSON UI support)
- Creator Tools changelog for a JSON UI editor or validator

Practice:

- `"json ui" "ore ui" <year>` (creators' migration reports); Bedrock OSS Discord highlights

Testing:

- in-game check with the resource pack off and on, at small and large GUI scale; screenshots compared by hand (no headless HUD renderer exists for Bedrock)

Best sources: Mojang/bedrock-samples, wiki.bedrock.dev, Microsoft Learn. Noisy: UI pack showcases without source.

## Findings log

Newest first. One entry per material finding. `Track` is subject, tooling, practice, or testing.

### R-20261030-1 · 2026-10-30 · Subject: 1.26.60 restructured the JSON UI hotbar
- summary: bedrock-samples v1.26.60.5 (2026-10-28) still ships hud_screen.json as JSON UI, but the hotbar changed: a new `hotbar_slots_renderer` (`custom` renderer, width 0, paints the slots itself) and `hud.hotbar_grid` now sit inside a new `hotbar_grid_frame` panel, and the old `hotbar_renderer@hotbar_renderer` child was removed. Paper doll and chat panels gained `#editor_chat_layout_active` view bindings. Packs that override `hotbar_grid`, `hotbar_renderer` or the hotbar's parent controls by path need re-checking against 1.26.60. No Mojang Ore UI statement since 10-27; server-ui 2.3.0 still latest (2.4.0 beta). Tooling, practice, testing: nothing new.
- track: subject (tooling, practice, testing quiet)
- sources: https://github.com/Mojang/bedrock-samples/commits/main/resource_pack/ui/hud_screen.json (diff of the last two commits, checked 2026-10-30), https://registry.npmjs.org/@minecraft/server-ui
- magnitude: 0.4 (recommendation changed: re-check hotbar overrides)
- applied: C-20261030-1

### R-20261027-7 · 2026-10-27 · Testing: BDS gives no evidence for resource-pack work
- summary: Two BDS 1.26.60.6 runs (the fixture and the example) listed only the behavior pack in Pack Stack and never reported a resource-pack line, though both shipped one (the example with a JSON UI hud_screen.json). Applied to Step 6: HUD work is proven only in the game.
- track: testing
- sources: local bds_run.py runs 2026-10-27 (checked 2026-10-27)
- magnitude: 0.4 (recommendation changed)
- applied: C-20261027-2

### R-20261027-6 · 2026-10-27 · Subject: vanilla item texture keys and the title controls
- summary: bedrock-samples item_texture.json has keys seeds_wheat, reeds, beef_raw, totem, bucket_empty, apple_golden and diamond, array-valued keys such as bucket, and compass_item and clock_item (animated atlases). hud_screen.json defines hud_title_text and title_frame. The title_frame replace, the factory-child animation and the invisible-parent binding rule come from the example build and are not yet seen in game. Applied to Steps 3, 4 and 6.
- track: subject
- sources: https://github.com/Mojang/bedrock-samples/blob/main/resource_pack/textures/item_texture.json, https://github.com/Mojang/bedrock-samples/blob/main/resource_pack/ui/hud_screen.json (checked 2026-10-27)
- magnitude: 0.4 (recommendation changed)
- applied: C-20261027-2

### R-20261027-5 · 2026-10-27 · Tooling, practice, testing: nothing HUD-specific
- summary: No skill, MCP server or validator for JSON UI was found; Creator Tools' skills do not cover UI. No headless way to render the Bedrock HUD exists, so testing is an in-game look with the pack on and off.
- track: tooling
- sources: https://github.com/Mojang/minecraft-creator-tools/tree/main/plugins/minecraft/skills (checked 2026-10-27)
- magnitude: n/a (initial)
- applied: C-20261027-1

### R-20261027-4 · 2026-10-27 · Subject: Script API display and forms
- summary: ScreenDisplay methods confirmed on the stable Learn page on 2026-10-27; server-ui forms are dialogs; npm 2.3.0 versus Learn's 2.2.0, settled by BDS accepting 2.3.0. Applied to Steps 1 and 5.
- track: subject
- sources: https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/screendisplay?view=minecraft-bedrock-stable, https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server-ui/minecraft-server-ui?view=minecraft-bedrock-stable, https://registry.npmjs.org/-/package/@minecraft/server-ui/dist-tags (checked 2026-10-27)
- magnitude: n/a (initial)
- applied: C-20261027-1

### R-20261027-3 · 2026-10-27 · Subject: no item render by id; glyphs are unofficial
- summary: The JSON UI control list has no item renderer; the hotbar's renderer is hard-coded. Glyph sheets work but the wiki marks them unofficial. Applied to Step 4.
- track: subject
- sources: https://wiki.bedrock.dev/json-ui/json-ui-documentation.html, https://wiki.bedrock.dev/text/custom-emojis (checked 2026-10-27)
- magnitude: n/a (initial)
- applied: C-20261027-1

### R-20261027-2 · 2026-10-27 · Subject: popup-then-timer patterns
- summary: Preserve Title Texts, `0 + #str` conversion, and `anim_type` keys verified in Mojang's ui_common.json. Applied to Step 3.
- track: subject
- sources: https://wiki.bedrock.dev/json-ui/preserve-title-texts.html, https://wiki.bedrock.dev/json-ui/type-conversion.html, https://github.com/Mojang/bedrock-samples/blob/main/resource_pack/ui/ui_common.json, https://wiki.bedrock.dev/json-ui/json-ui-documentation.html (checked 2026-10-27)
- magnitude: n/a (initial)
- applied: C-20261027-1

### R-20261027-1 · 2026-10-27 · Subject: JSON UI still runs the HUD, with an Ore UI migration under way
- summary: hud_screen.json current in bedrock-samples (1.26.50.4); community wiki deprecation warning; feedback threads on the hotbar selector; emojis unsupported on Ore UI. Applied to Step 2's risk rule and the vanilla fallback in Step 1.
- track: subject
- sources: https://github.com/Mojang/bedrock-samples/blob/main/resource_pack/ui/hud_screen.json, https://wiki.bedrock.dev/json-ui/json-ui-intro.html, https://feedback.minecraft.net/hc/en-us/community/posts/46268079545485-Allow-resource-packs-to-customize-hotbar-selected-texture-in-Ore-UI, https://wiki.bedrock.dev/text/custom-emojis (checked 2026-10-27)
- magnitude: n/a (initial)
- applied: C-20261027-1
