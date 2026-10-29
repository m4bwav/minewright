# given.jar manual playtest (test mode)

Do this on the real PC before playing for real. The unit tests and the server self-test check the rules and the
scripts; only a person can check what the game looks and sounds like. Two players (A and B) on LAN are best; one
player can do most of it alone. Turn on test mode first so minutes become seconds:

| | Test mode |
|---|---|
| Mission | 30 s |
| Skip | 10 s |
| Eye closed | 10 s |

Setup: a new survival world with the packs on (INSTALL.md) and, for testing only, cheats on so you can `/give`
yourself items (given.jar itself does not need cheats). A is the host. `/given_jar:status` tells you the current
item. Have one Totem of Undying ready.

Write down anything that does not match the "should happen" column.

## Arrival

| # | Do | Should happen |
|---|---|---|
| 1 | A: `/given_jar:testmode on` | Chat: "Test mode ON..." |
| 2 | A: `/given_jar:summon` | A dark sphere appears 3 blocks in front of A, floating about 1 block up, eye closed (eyelid picture). Chat: "A strange eye is watching you..." |
| 3 | Walk around it | The eye side turns to follow the nearest player. It bobs slowly. No shadow-flicker, no missing-texture purple/black. |
| 4 | Hit it, shoot it, push it, pour lava on it | Nothing hurts it; it does not move. |
| 5 | A: `/given_jar:summon` again | "There is already a watcher in this world." |
| 6 | A (creative): use the Watcher Spawn Egg | The new sphere disappears; chat "There can only be one watcher..." |

## Mission

| # | Do | Should happen |
|---|---|---|
| 7 | Wait 5 s after the summon | Eye opens (realistic eye, iris moves a little). Sound. Chat names the item. Item picture appears in the middle of the screen, then drops toward the bottom; subtitle "Bring me: ...". |
| 8 | Look at the bottom of the screen | Action bar: "<item>  0:2x  (drop it on the eye)", counting down each second. A small item picture stays just above it. |
| 9 | Check the HUD numbers | The falling picture should end near the small picture. If it lands far off, note the distance (ART.md lists the numbers to tune). |
| 10 | A switches to creative | A's action bar says "just watching". |
| 11 | A back to survival. B drops a wrong item on the sphere | Nothing happens; the item stays. |
| 12 | B drops the mission item next to A, far from the sphere | Nothing happens. |
| 13 | B throws the mission item onto the sphere (Q while looking at it) | Item vanishes, a ding, chat "B gave the eye a ...". B's small item picture disappears, B's action bar "(you gave it!)". |
| 14 | B drops a second one on it | It stays on the ground (B already delivered). |
| 15 | A stands right next to the sphere while B throws from 3 blocks | B gets the credit, not A. |
| 16 | A drops a stack of 3 on the sphere | A is credited, 2 are left on the ground. |
| 17 | Wait | When everyone in survival delivered: level-up sound, eye closes, chat "The Given closes its eye for 10 seconds." |
| 18 | Wait 10 s | New mission, a different item. |

## Skip

| # | Do | Should happen |
|---|---|---|
| 19 | During a mission: `/given_jar:skip` | Clock drops by 10 s. Chat says how much is left. |
| 20 | Skip until below zero | "The hunt starts now!" and the hunt begins at once. |
| 21 | B (not operator) tries `/given_jar:skip` | Not allowed. `/given_jar:status` works for B. |
| 22 | During the break: skip | The eye opens sooner. |
| 22b | On a world with no Given, in survival: `/given_jar:attack` | The Given appears 3 blocks in front of you, its whites turn blood red at once, chat "Time is up! The Given's eye turns red...", and it hunts you. Run it again during the hunt: "The hunt is already on." |

## Hunt

| # | Do | Should happen |
|---|---|---|
| 23 | Let a mission run out with A and B both not delivering, B closer to the sphere | Eye turns red (iris and whites blood red, still veined), curse sound, chat lists A and B. Sphere bobs fast. |
| 24 | Watch | It flies at B first, straight through walls and the ground, about 6 blocks a second. B hears a heartbeat. B's action bar "RUN!...". |
| 25 | B gets touched (no totem) | B dies. Chat "The Given caught B!". Then it goes for A. |
| 26 | A runs into a nether portal while hunted | Counts as caught; hunt ends. Eye closes for 10 s. |
| 27 | Repeat with A logging off while hunted | Counts as caught. |
| 28 | Repeat with A dying from a fall while hunted | Counts as caught. |
| 29 | Repeat with A in creative when time runs out | A is not on the list. |
| 30 | Repeat with B far away (more than 4 chunks) | The sphere reappears about 20 blocks behind B; no second sphere is left behind when you go back. |
| 31 | Watch the eye through a whole hunt, close up | Calm eye before: white with red veins, green-grey iris. During the hunt: whites blood red. When the hunt ends: the eye closes, and at the next mission it opens calm (white whites) again. |

## Totem jump-scare

| # | Do | Should happen |
|---|---|---|
| 32 | B holds a Totem of Undying, fails a mission, gets touched | Totem animation, B survives. Eye closes, sphere backs away for about 3 s, then nothing for about 4 s. |
| 33 | Keep looking around | The sphere appears right in front of B's face with the red eye open and a scream. No flashing. Chat "The Given got B! BOO!". It counts as caught; the hunt moves on or ends. |

## Saving

| # | Do | Should happen |
|---|---|---|
| 34 | Quit the world mid-mission and load it again | Same item, time continues from about where it was (time does not run while the world is closed). |
| 35 | `/given_jar:testmode off` | Clock scales back to minutes. |
| 36 | `/given_jar:tier hard`, wait for the next mission | A hard item (diamond, blaze rod, ...). |

## Look and feel

- Is the open eye clearly an eye at 5, 10 and 20 blocks?
- Are the veins visible on the calm eye at 5 blocks? Does the red eye glow a bit in the dark? Does the closed eye look closed?
- Is anything too scary for the youngest player? (Change the jump-scare sound in `src/core/machine.ts`, SOUNDS.)
