# Store listing: The Given (given.jar)

Text and files for CurseForge (Minecraft Bedrock > Addons) and, optionally, MCPEDL. Mark signs in and presses submit.

Files: run `python scripts/listing.py` to copy the `.mcaddon` and images here (they are gitignored). Upload `given-jar-<version>.mcaddon`; `icon.png` is the project logo; `hero.jpg`, `eye-calm.png`, `eye-hunt.png` are the gallery.

Live page: https://www.curseforge.com/minecraft-bedrock (project 1773067, submitted 2026-10-29, waiting for moderation).

## Title
The Given (given.jar)

## Summary (one line)
A floating one-eyed sphere demands an item from every player. Bring it in 30 minutes, or it hunts you through walls.

## Category / tags
Addons; Mobs, Horror, Minigame, Multiplayer.

## Game version
Tested on Bedrock 1.26.60 (no experiments, cheats not needed). CurseForge listed 26.50 as its newest version on 2026-10-29, so the file is tagged 26.50.

## Licence
MIT

## Description

There is a big dark ball floating in your world. Its name is **The Given**. It has one eye, and the eye is always watching.

**How it works**
- When The Given opens its eye, it wants one item. Its picture shows in the middle of your screen.
- Every player must bring their own copy within 30 minutes. The clock sits at the bottom of the screen.
- Walk up and drop the item onto the ball. A ding and "you gave it!" mean it counted. Nobody can give it for you.
- If everyone gave it, the eye closes for 10 minutes, then it wants something new.
- If anyone forgot, the whites of the eye turn blood red and The Given flies after them, through walls, closest player first. A Totem of Undying saves you... sort of.
- Creative and spectator players are left alone.

**Commands (operators)**
- `/given_jar:summon`: bring The Given (or use its spawn egg). One per world.
- `/given_jar:tier easy|medium|hard`: how hard the items are to find.
- `/given_jar:skip`: take 10 minutes off the clock (below zero starts the hunt).
- `/given_jar:attack`: start the hunt now.
- `/given_jar:status`: the item, time left and who still owes it (anyone can use it).
- `/given_jar:testmode`: short timers for trying it out.
- Fallback for each: `/scriptevent given_jar:<name>`.

**Install**: double-click the `.mcaddon`, then turn on both packs in your world settings.

Built for LAN play with about four friends. Source, docs and the newest version: https://github.com/m4bwav/minewright/releases/tag/v0.1.1
