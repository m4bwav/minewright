# Learnings: minewright-hud

Procedural lessons for [SKILL.md](SKILL.md). Research findings live in [RESEARCH.md](RESEARCH.md); every change is logged in [CHANGELOG.md](CHANGELOG.md); test runs in [TESTS.md](TESTS.md); state in `evergreen.json`. Format and write-time gate: MAINTENANCE.md (LEARNINGS-FORMAT). Retired entries go to LEARNINGS-ARCHIVE.md with a reason.

Write an entry the moment a real signal happens: a user correction, the same error twice, a discovered workaround, an environment fact, a stated preference, a failed test or a failure in use. Check existing entries first (add / update / retire / none). Trigger and Hypothesis are required. Promote after three confirmations; retire when harmful > helpful.

## Active

### L-001 · 2026-10-27 · The popup example sent an item id where the image needs a texture path
- Trigger: Step 3 sent gj:item:diamond, but Step 4's image binding needs textures/items/diamond; the example had to change both.
- Hypothesis: The two steps were written separately.
- Rule: Send the texture path in the title and the readable name in the subtitle.
- Evidence: the given.jar build log (examples/given-jar, 2026-10-27)
- Scope: skill
- Status: active · helpful 1 · harmful 0 · last_confirmed 2026-10-27

### L-002 · 2026-10-27 · Hiding the vanilla title needs a title_frame replace
- Trigger: The example needed the vanilla title hidden only for marker titles; modifications on nested controls did nothing.
- Hypothesis: JSON UI modifications reach only direct children; title_frame is a direct child of hud_title_text.
- Rule: Replace title_frame; put the image in the factory-made hud_title_text so its animation replays per title. Unverified in game.
- Evidence: the given.jar build log (examples/given-jar, 2026-10-27)
- Scope: skill
- Status: active · helpful 0 · harmful 0 · last_confirmed 2026-10-27

### L-003 · 2026-10-27 · item_texture.json keys differ from item ids
- Trigger: The example's item list mapped ids to texture paths; many keys differ (seeds_wheat, reeds, beef_raw, totem, apple_golden), some hold arrays, compass and clock are animated atlases.
- Hypothesis: Texture keys predate the flattened item ids.
- Rule: Build the map from item_texture.json and pin it with a fixture test.
- Evidence: R-20261027-6
- Scope: skill
- Status: active · helpful 1 · harmful 0 · last_confirmed 2026-10-27

### L-004 · 2026-10-27 · Invisible parents stop bindings; emissive alpha is unclear
- Trigger: The example's preserved-title data control stopped updating when its parent image was hidden; it also assumed low alpha means more glow in entity_emissive_alpha. Both untested in game.
- Hypothesis: JSON UI does not evaluate bindings under invisible controls.
- Rule: Keep data controls under always-visible parents and swap to a blank texture; check emissive alpha in game.
- Evidence: the given.jar build log (examples/given-jar, 2026-10-27)
- Scope: skill
- Status: active · helpful 0 · harmful 0 · last_confirmed 2026-10-27

### L-005 · 2026-10-27 · BDS cannot test anything on the client side
- Trigger: Every HUD, texture and render-controller change in the example passed on BDS without being exercised; the server lists only the behavior pack in its pack stack.
- Hypothesis: A dedicated server has no renderer.
- Rule: Always owe a human look in the game for resource-pack work.
- Evidence: R-20261027-7
- Scope: skill
- Status: active · helpful 1 · harmful 0 · last_confirmed 2026-10-27
