---
title: "given.jar example: namespace and public layout"
kind: decision
status: active
date: 2026-10-27
verified: 2026-10-27
stale_after: 2027-04-25
tags: [addon, namespace, layout]
summary: read before renaming the example, its namespace or moving it out of the repo
agent: copilot-cli
---

# given.jar example: namespace and public layout

## Context

The first example add-on had to ship inside a public repository and needed an identifier namespace and display name.

## Decision

Display name "given.jar", identifier namespace `given_jar`, kept inside minewright as `examples/given-jar`, naming no player.

## Reasons

- A dot in a Bedrock namespace is risky in Molang `query.property('ns:name')` and in custom command names; an underscore is safe everywhere.
- The repository is public, so the example is generic; family details live in the private sidecar.
- One repository keeps the skills and their first real test together, so a skill fix and the example change that proved it land in the same pull request.

## Consequences

- Commands are `/given_jar:skip`, `summon`, `tier`, `testmode`, `status`; `/scriptevent given_jar:<name>` is the fallback.
- Java (Fabric/NeoForge) would come later as `minewright-java-*` skills; nothing is built for it yet.
