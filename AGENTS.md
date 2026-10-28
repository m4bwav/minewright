# Agent rules for minewright

Rules for any AI agent (Claude Code, Copilot, Cursor, Codex, Gemini CLI) working in this repository. `CLAUDE.md` imports this file and `.github/copilot-instructions.md` points here.

Read [README.md](README.md) first. The five skills live under [skills/](skills/). Each is an evergreen unit with its companions beside it: RESEARCH, CHANGELOG, LEARNINGS, TESTS, `evals/evals.json`, MAINTENANCE and `evergreen.json`. The example add-on lives under `examples/given-jar/` with its own README.

## Rules

- Evergreen units in pointer mode: before editing a skill, read its `evergreen.json`. If `next_due` has passed or `contradiction` is set, say so and refresh after the task (the evergreen plugin's `evergreen-refresh`, otherwise the skill's `MAINTENANCE.md`). Every edit to a SKILL.md gets a CHANGELOG entry with its reason (`R-`, `L-` or `T-` ids, or "user request"). Re-run that skill's `evals/evals.json` (evergreen-test) when the change alters what the skill triggers on, decides or does.
- Research beats recall. Script API module versions, the engine version, the Bedrock Dedicated Server build, install paths and the JSON UI to Ore UI migration move with every game release. Never change a version, command, path or API name from memory: cite the source in RESEARCH.md (an `R-` entry with the date checked) and log the change in CHANGELOG.md (a `C-` entry).
- Stable APIs only in anything this repository ships or recommends by default. Beta APIs make a world experimental permanently.
- `skills/minewright-checks/scripts/mw_check.py` and `skills/minewright-server/scripts/bds_run.py` are stdlib Python 3.9+. Each prints exactly one JSON object and fails soft. `bds_run.py` downloads nothing without `--download`. Neither prints anything secret. Keep both true on Windows, macOS and Linux (BDS itself runs on Windows and Linux only).
- Skills stay under 200 lines, with a description of at most 1,024 characters (Agent Skills spec) that says what the skill does and names the sibling that owns nearby requests.
- The skills install nothing on their own: Node packages, Mojang's Creator Tools, Bedrock Dedicated Server (and its EULA), loopback exemptions and MCP registrations are the user's to approve.
- Before committing, run `python tests/check_skills.py` (structure, companions, manifests, links and the public-safety guards), `python tests/test_scripts.py` and `python scripts/budget.py` from the repository root. CI runs all three.
- Size budget: `scripts/budget.py` sets green, yellow and red limits on what every session loads (descriptions) and on the installed size. Red fails CI. Say so when a change crosses yellow.
- This is a public repository. Nothing in it names a person other than the author credit, a machine, an absolute path on someone's machine, a private project, or a credential. A lesson learned on a particular machine or for a particular family is generalised here ("the development machine", "a young player"); the specifics belong in the owner's private notes, never in a commit.
- Java Edition is out of scope for now. If it is added later, it gets its own `minewright-java-*` skills rather than branches inside the Bedrock ones.
- Versions: when a packaged file changes, bump `.claude-plugin/plugin.json` and `plugin.json` together and tag `vX.Y.Z`. The release workflow checks the tag against the manifest, runs the checks, zips `skills/`, builds the example add-on when it exists and attaches its `.mcaddon`.
- No AI attribution anywhere: no Co-Authored-By trailers and no "generated with" lines in commits, pull requests or files.
