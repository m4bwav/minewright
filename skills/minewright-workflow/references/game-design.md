# Game design before code (Bedrock add-ons)

Read this when the request is a new add-on or a gameplay feature: a mob with a behaviour, a minigame, a timed mission, a boss, a new item with rules. It decides what gets built before any script is written, and what the playtest must look for afterwards. Engine and API facts here come from the skill's [RESEARCH.md](../RESEARCH.md); look them up again before relying on them.

## 1. The one-pager

For a new add-on, write `docs/ONE-PAGER.md` in the project and show it to the user before writing gameplay code:

| Heading | What goes there |
|---|---|
| Working title | Display name, and the identifier namespace (lowercase letters, digits, underscores; no dots, which Molang and some identifier parsers treat specially). |
| Players | Ages, platforms (Windows, phone, tablet, console through a Realm), how many at once, LAN, Realm or server. |
| Core loop | One verb for what players do most, then the cycle around it. |
| Rules | Each rule as a sentence a player could repeat. Then the edge cases: a player logs off, changes dimension, dies some other way, is in creative or spectator, joins late. |
| Numbers | Every duration, speed, radius and count, by name. They go into the config file unchanged. |
| Commands | Slash commands and who may use them (operators or anyone), with a `/scriptevent` fallback for each. |
| Experiments | "None" unless the user agreed to a permanently experimental world. |
| Out of scope | What it will not do. |

Keep it current. When a later request contradicts it, say so in one line and let the user decide.

## 2. One config file, with a test mode

All numbers from the one-pager live in one module (`src/config.ts` in a TypeScript project, `scripts/config.js` otherwise). Code reads names, never literals. A test mode, toggled by an operator command and stored in a world dynamic property, swaps minutes for seconds so a playtest of a 30-minute loop takes a few minutes. The status command prints the current mode and the live timers.

## 3. Rules that stay fair for young players

- A threat always has a tell (a sound first, then a visible change) and a way to escape or survive it.
- Timers are visible: a countdown on the actionbar beats a surprise.
- Nobody loses their own items or progress unless the user asked for that rule. Prefer "caught" and a respawn to deleting inventories.
- Scary moments are short, and announced by sound. No fast flashing or strobing (photosensitivity); keep any flash under three per second and avoid full-screen red flashes.
- Players who did their part are never punished for a teammate who did not, unless the design says so.
- An operator can always skip, pause or turn the game off, and the add-on behaves when removed (no world left in a broken state).
- Creative and spectator players are left alone by anything that hunts or scores.
- Shared screens and mixed ages: text short and readable, no reading needed to survive.

## 4. Entities the client can render

Decide early what the client must show, because only entity properties with `client_sync: true` and Molang reach the render controller:

- One `enum` property for each visual state (for example `open`, `closed`, `red`), one for mode if animations differ.
- The render controller picks textures, geometry parts and visibility with `query.property('ns:name')`.
- The script sets the property; the change shows next tick.

## 5. Playtest checklist (hand this to the user)

Run in test mode on the target platform with the real number of players. Ask the testers, not the agent:

1. Install: did the add-on import, and does the world show it under Behavior and Resource Packs? Any red Content Log errors?
2. First minute: does each player know what to do without being told? What did they try first?
3. The loop: play one full round. Did timers match the config? Did every rule from the one-pager happen?
4. Edge cases: one player logs off mid-round, one switches to creative, one goes to the Nether, one dies to something else. Does the game recover?
5. Fairness: was anything confusing or unfair? Did anyone feel punished for someone else?
6. Scares and effects: too much, too little? Any flashing that bothered anyone?
7. Operator controls: do skip, status and test mode work, and are they refused for non-operators?
8. Leave and come back: quit the world, reopen it. Does the game resume where it was?
9. Remove the add-on from a copy of the world: does the world still open?

The agent's own break-it pass comes before this: run the self-test on Bedrock Dedicated Server (minewright-server), then try each edge case it can script with commands.
