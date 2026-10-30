# Handoff

<!-- Keep under 50 lines. Replace, never append. Written at the end of a work session so the next one starts without re-deriving state. -->

## Current state
- 0.1.1 is released: https://github.com/m4bwav/minewright/releases/tag/v0.1.1 (skills zip and `given-jar-0.1.1.mcaddon`). Pack versions 0.1.1.
- 0.1.1 is the first round of playtest requests: the calm eye is bloodshot; during the hunt the whites go blood red; the pack icon is the eye alone on black (red iris, bloodshot white, no sphere); the sphere is named "The Given" in game (add-on name and namespace unchanged); new operator command `/given_jar:attack` (summons if needed, starts the hunt now). See examples/given-jar/ART.md "Bloodshot".
- Art is reproducible: `python scripts/bloodshot.py` paints onto the 0.1.0 pictures in `art/base/`, then `python scripts/make_textures.py`.
- 42 unit tests, 11 BDS self-test markers on BDS 1.26.60.6; CI green. CI's Python 3.9 leg runs on ubuntu-24.04 (ubuntu-latest became 26.04 on 2026-10-19 and has no 3.9).
- Wiki updated for 0.1.1 (Given-Jar-Example page). How it was made: [notes/2026-10-27-github-wiki.md](notes/2026-10-27-github-wiki.md).
- Decisions: [namespace and public layout](decisions/2026-10-27-given-jar-example-namespace-and-public-layout.md), [stable APIs and the BDS self-test](decisions/2026-10-27-stable-apis-only-bds-scriptevent-self-test-instead-of-gamete.md).

- 2026-10-29: 0.1.1 tested in game by the owner (looked good) and posted on CurseForge, project 1773067 (Minecraft Bedrock, Addons; file tagged 26.50, the newest CurseForge lists). Approved and public by 2026-10-30: https://www.curseforge.com/minecraft-bedrock/addons/the-given-given-jar (3 downloads at first check); linked from both READMEs, LISTING.md and the wiki. Process: skills/minewright-project/references/publishing.md; stage files with examples/given-jar/scripts/listing.py; page text in examples/given-jar/listing/LISTING.md.

- 2026-10-30: family playtest of 0.1.1 passed; the owner reports "it works great", no misses to fix.
- 2026-10-30: owed evals re-run (T-20261030-1 in both skills' TESTS.md): workflow action-1 3/3 with, 0/3 without (KEEP); checks outcome-1 now has fixture addon-ts and a wider regex, 3/3 with. Dependabot @types/node 26 and eslint 10 merged (#4, #3); #2 (@eslint/js 10) asked to rebase.

## Owed
- MCPEDL as a second home only if the owner wants it. New CurseForge files go through moderation (publishing.md).
- Known: eye_red's pupil sits about (66,69) of 128, so the iris cube crop is a few pixels off on the hunt eye (ART.md).
- Clean baselines: on this machine the no-skill arm finds the skill junctions in ~/.claude/skills (checks LEARNINGS 2026-10-30); a clean one needs `claude plugin eval` (WSL2 for Bash cases) or the junction removed for the run.
- Creator Tools only via npx; Linux BDS and Realms untested.

## Next single action
Housekeeping done 2026-10-30: everlast-setup learnings moved to m4bwav/everlast (PR #21); evergreen-protocol refresh PR #35 and comfyui-gen refresh PR #101 merged (claims due again 2026-11-02). Nothing owed for minewright unless the owner reports a miss; optional items are under Owed.
