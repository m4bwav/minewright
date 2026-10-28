---
title: Stable APIs only; BDS scriptevent self-test instead of GameTest
kind: decision
status: active
date: 2026-10-27
verified: 2026-10-27
stale_after: 2027-04-25
tags: [testing, bds, script-api]
summary: read before adding GameTest, Beta APIs or a new test rung
agent: copilot-cli
---

# Stable APIs only; BDS scriptevent self-test instead of GameTest

## Context

The example must be verified without a Minecraft client on the development machine, in a world the players can keep using.

## Decision

Stable Script API modules only (`@minecraft/server` 2.11.0, `@minecraft/server-ui` 2.3.0 on Bedrock 1.26.60); no Beta APIs. Ladder: pure TypeScript state machine under `node --test`; `mw_check.py`; a Bedrock Dedicated Server run (`bds_run.py`) where `/scriptevent given_jar:selftest` prints `[MWTEST] PASS|FAIL` lines; then the human playtest (PLAYTEST.md).

## Reasons

- Turning on any experiment is permanent for a world, and GameTest (`@minecraft/server-gametest`) is still beta-only.
- BDS 1.26.60.6 runs headless in about 5 seconds and reports script errors and markers on stdout.
- HUD (JSON UI), visuals, sounds and the totem path cannot be proven on BDS; they stay owed to the human playtest.
