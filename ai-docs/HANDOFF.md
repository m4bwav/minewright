# Handoff

<!-- Keep under 50 lines. Replace, never append. Written at the end of a work session so the next one starts without re-deriving state. -->

## Current state
- 0.1.0 is on `main` (five skills, the two scripts, the given.jar example); no tag or release yet.
- The GitHub wiki is published for 0.1.0 (13 pages, live check clean). How it was made and how to update it: [notes/2026-10-27-github-wiki.md](notes/2026-10-27-github-wiki.md).
- README has the hero banner and a wiki link; `.claude-plugin/plugin.json` points at `.claude-plugin/icon.png`.

## In progress
Nothing.

## Decisions made this session
- The wiki's outputs come from `notes/2026-10-27-wiki-verify.py`, which runs on a copy of a checkout and never downloads BDS.

## Dead ends hit
None.

## Next single action
Fix the four doc inaccuracies listed in the wiki note (mw_check.py help text, the hud prefix formula, the README's release sentences until a tag exists, the pack.mjs name), then tag v0.1.0 and update the wiki pages the note names.
