# Learnings: minewright-server

Procedural lessons for [SKILL.md](SKILL.md). Research findings live in [RESEARCH.md](RESEARCH.md); every change is logged in [CHANGELOG.md](CHANGELOG.md); test runs in [TESTS.md](TESTS.md); state in `evergreen.json`. Format and write-time gate: MAINTENANCE.md (LEARNINGS-FORMAT). Retired entries go to LEARNINGS-ARCHIVE.md with a reason.

Write an entry the moment a real signal happens: a user correction, the same error twice, a discovered workaround, an environment fact, a stated preference, a failed test or a failure in use. Check existing entries first (add / update / retire / none). Trigger and Hypothesis are required. Promote after three confirmations; retire when harmful > helpful.

## Active

### L-001 · 2026-10-27 · minecraft.net drops downloads from some user agents
- Trigger: the first `bds_run.py --download` failed with `RemoteDisconnected: Remote end closed connection without response`. A HEAD request with curl's default agent hung; the same URL answered 200 with a plain `minewright-bds-run/0.1` agent, and failed again once the agent string carried a `(+https://...)` comment.
- Hypothesis: a bot filter in front of the download host rejects some agent strings.
- Rule: send a short product-style `User-Agent` and `Accept: */*`; when a download from minecraft.net fails at connect, retry with another agent before blaming the network.
- Evidence: local runs 2026-10-27 (C-20261027-1)
- Scope: skill
- Status: active · helpful 1 · harmful 0 · last_confirmed 2026-10-27

### L-002 · 2026-10-27 · Console scriptevent works with cheats off
- Trigger: Learn says `/scriptevent` needs cheats; on BDS 1.26.60.6 a world with `allow-cheats=false` still passed `scriptevent fixture:selftest` from the server console to the script.
- Hypothesis: the server console runs commands at a level that skips the cheats check.
- Rule: do not rely on this for players (they still need cheats or a custom command with `cheatsRequired: false`); for the console test loop, cheats on or off both work. `bds_run.py` turns cheats on anyway.
- Evidence: R-20261027-3
- Scope: skill
- Status: active · helpful 1 · harmful 0 · last_confirmed 2026-10-27

### L-003 · 2026-10-27 · BDS 1.26.60.6 talks to a signalling service at start
- Trigger: every run logged `Signed in to signaling service successfully` before `Server started.`, and the effective properties include `transport=nethernet` and `server-udp-ports=19132`, which `server.properties` in the zip does not set.
- Hypothesis: the new NetherNet transport registers with an online service; startup may wait for or fail without the network.
- Rule: run the first test on a machine with internet access; if a run hangs before `Server started.` offline, say so instead of guessing, and record it here.
- Evidence: R-20261027-3 console logs
- Scope: skill
- Status: active · helpful 0 · harmful 0 · last_confirmed 2026-10-27
<!-- Example (delete once you have a real entry):
### L-001 · 2026-10-27 · One-line lesson in plain words
- Trigger: what happened, with dates or counts
- Hypothesis: why
- Rule: the shortest instruction that prevents the trigger
- Evidence: C-20261027-1, T-20261027-1, confirmed 2026-10-27
- Scope: skill | repo:<slug> | env:<name> | global
- Status: active · helpful 1 · harmful 0 · last_confirmed 2026-10-27
-->
