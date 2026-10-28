# Handoff

<!-- Keep under 50 lines. Replace, never append. Written at the end of a work session so the next one starts without re-deriving state. -->

## Current state
- 0.1.0 is released: https://github.com/m4bwav/minewright/releases/tag/v0.1.0 (skills zip and `given-jar-0.1.0.mcaddon`).
- Five evergreen Bedrock skills (workflow, project, checks, server, hud), `mw_check.py`, `bds_run.py`; given.jar example with 40 unit tests and 11 BDS self-test markers on BDS 1.26.60.6; CI green on three OSes.
- The GitHub wiki is published for 0.1.0 (13 pages). How it was made and how to update it: [notes/2026-10-27-github-wiki.md](notes/2026-10-27-github-wiki.md).
- Decisions: [namespace and public layout](decisions/2026-10-27-given-jar-example-namespace-and-public-layout.md), [stable APIs and the BDS self-test](decisions/2026-10-27-stable-apis-only-bds-scriptevent-self-test-instead-of-gamete.md).

## Owed
- Human playtest of given.jar on a Windows client (examples/given-jar/PLAYTEST.md, test mode): HUD drop animation, eye glow, textures, jump scare, totem path. Nothing client-side has been seen yet.
- Eval re-runs: workflow action-1 (C-20261027-4) and the rewritten checks outcome-1, then three runs per case instead of one.
- Trigger results on the development machine are skewed: about 154 installed skills, so Claude Code lists the minewright skills by name only (environment class; see each TESTS.md).
- Creator Tools ran through npx only; the Linux BDS build is untested.

## Next single action
Play through PLAYTEST.md in test mode, write every miss as a learning in the owning skill, fix, bump 0.1.1 and tag.
