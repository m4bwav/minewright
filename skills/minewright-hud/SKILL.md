---
name: minewright-hud
description: "Put information on a Minecraft Bedrock player's screen from an add-on: titles, subtitles and the actionbar from the Script API (the stable, always-working layer), HUD element visibility, and resource-pack JSON UI on top (hud_screen.json, the Preserve Title Texts pattern, title-prefix markers, anim_type offset and alpha animations for a popup that slides into a timer, string-to-number conversion, vanilla item textures by path) with the risks: Ore UI is replacing JSON UI, custom glyphs are unofficial, no item-render-by-id, server-ui forms are dialogs, not a HUD. Always ships a plain title and actionbar fallback. Use whenever the user asks for 'a timer on screen', 'show the item in the middle of the screen', 'custom HUD', 'JSON UI', 'hud_screen.json', 'animate the title', 'a menu or form', 'hide the hotbar', or says 'refresh minewright-hud'. Game rules are minewright-workflow; pack layout is minewright-project."
---

# Bedrock HUD and UI for add-ons

Outcome: on-screen information that works on every platform with the vanilla title and actionbar, plus (only when asked) a JSON UI layer that improves it and can break without making the game unplayable.

## Step 0: freshness (every use, one read)

Read `evergreen.json` next to this file. This skill is tier `fast`: the JSON UI to Ore UI migration moves screens without notice. If `contradiction` is set or today is on or after `next_due`, tell the user in one line, do the task with the current content, then refresh (`evergreen-refresh`). If `verify_at_use` is true, re-check `volatile_claims` first. If `tests.failing` is non-empty, say so and run `evergreen-tune` after the task.

## Step 1: the vanilla layer (always)

Stable Script API, works on every platform with no resource pack:

```ts
player.onScreenDisplay.setTitle("Find: Diamond", {
  subtitle: "30:00", fadeInDuration: 10, stayDuration: 60, fadeOutDuration: 10 }); // ticks
player.onScreenDisplay.setActionBar("Diamond  29:41");
```

- The actionbar is the persistent line above the hotbar; refresh it from the game loop (every 10 to 20 ticks) because it fades.
- `setHudVisibility` / `hideAllExcept` / `resetHudElementsVisibility` with the `HudElement` enum (stable since 1.11.0) hide or show vanilla HUD parts; always restore them when the round ends.
- Text must make sense alone: if the JSON UI layer breaks, this is what players see.

## Step 2: decide whether JSON UI is worth it

JSON UI is the resource-pack UI language. `hud_screen.json` is still JSON UI in Mojang's current samples (updated for 1.26.50), so a pack can still restyle the HUD. But:

- The community wiki warns that JSON UI is being replaced by Ore UI, which resource packs cannot modify, and that JSON UI add-ons will eventually break. Mojang has published no timeline. The hotbar selector has already moved to Ore UI (per community feedback threads).
- Emojis and custom glyphs do not render on Ore UI screens.
- So: JSON UI only for polish, only on the HUD, and always over the vanilla layer of Step 1. Tell the user this risk in one line before writing it.

## Step 3: popup that drops into a timer (JSON UI)

The pattern, from wiki.bedrock.dev and Mojang's own item-name popup in `hud_screen.json`:

1. The script sends a title with a marker prefix, for example `setTitle("gj:item:diamond")` or `gj:timer:29:41`. Vanilla shows it as plain text when the JSON UI layer is missing, so keep the marker short and readable, or hide titles with that prefix only in the JSON UI.
2. In `resource_pack/ui/hud_screen.json`, a hidden `data_control` binds `#hud_title_text_string` with `binding_condition: "visibility_changed"` and keeps the last value in a `property_bag` (the "Preserve Title Texts" pattern), so the text stays after the title fades.
3. A control shows when the preserved string starts with the prefix (`(#text - 'gj:item:') = #text` is false), strips the prefix, and plays animations: `anim_type` `offset` (from centre to bottom) and `alpha`, with `duration`, `easing`, `play_event` and `end_event`, the same keys Mojang uses in `ui_common.json`.
4. For numbers, convert strings with `0 + #str` (the older `#str * 1` no longer works in some versions).
5. Modify the vanilla file with `modifications` (insert into the root panel's `controls`) rather than replacing `hud_screen.json` whole, so game updates touch less.

References: `https://wiki.bedrock.dev/json-ui/preserve-title-texts.html`, `https://wiki.bedrock.dev/json-ui/json-ui-documentation.html`, `https://wiki.bedrock.dev/json-ui/type-conversion.html`, and the samples in `Mojang/bedrock-samples` `resource_pack/ui/`.

## Step 4: showing an item's picture

There is no JSON UI control that renders an item by id (the hotbar uses a hard-coded `custom` renderer). Options, best first:

- An `image` control whose `texture` comes from a binding, set to the vanilla texture path (for example `textures/items/diamond`), sent in the title text. Keep a curated map from item id to texture path in the script; block items need their block face texture.
- Custom font glyphs (`font/glyph_E1.png`, 16 by 16 cells, used as `\uE1xx` in text) render inline in titles and chat. They are unofficial (wiki: "not officially supported") and fail on Ore UI screens.
- Text only: the item's name, which always works.

## Step 5: forms and menus

`@minecraft/server-ui` (`ActionFormData`, `MessageFormData`, `ModalFormData`) shows dialogs that take over the screen and wait for an answer. Good for settings, choices and confirmations an operator opens; wrong for anything that must stay visible while playing. Stable version: see minewright-project.

## Step 6: verify

- minewright-checks (JSON parses, including `ui/*.json`), then in the game: the vanilla layer alone (disable the resource pack), then with the JSON UI layer, at the smallest and largest GUI scale, on a phone screen if the players use one.
- No fast flashing: alpha animations under three cycles per second.

## Output

The vanilla display code, the JSON UI files only when asked, the risk sentence about Ore UI, and what to check in the game.

## While working: capture learnings

If the user corrects you, the same error happens twice, a workaround is found, or an environment fact is discovered, write it to `LEARNINGS.md` now (format in MAINTENANCE.md; check existing entries first). If a learning proves a claim above wrong, fix it here, log it in `CHANGELOG.md`, and set `contradiction` in `evergreen.json`.

## Maintenance

This skill is evergreen (tier `fast`; the schedule is in `evergreen.json`). Files: `evergreen.json` (state), [RESEARCH.md](RESEARCH.md) (findings and search plan), [CHANGELOG.md](CHANGELOG.md) (every change, with reasons), [LEARNINGS.md](LEARNINGS.md) (lessons), [TESTS.md](TESTS.md) and `evals/evals.json` (the cases that prove it and the runs). Protocol: MAINTENANCE.md (pointer to the installed evergreen plugin). Refresh with `evergreen-refresh`; test with `evergreen-test`; fix a failure with `evergreen-tune`. Sibling skills in this suite: minewright-checks, minewright-hud, minewright-project, minewright-server, minewright-workflow.
