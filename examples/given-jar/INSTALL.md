# Installing given.jar on Windows

Checked 2026-10-27 against Minecraft Bedrock 1.26.60 (Windows, the GDK build from the Microsoft Store or
minecraft.net). No experiments are needed, and the world does not need cheats.

## 1. Get the file

`given-jar-0.1.1.mcaddon` (build it with `npm run pack`; it lands in `dist/`).

## 2. Import it

1. **Close Minecraft completely first.** On the current Windows (GDK) build, double-clicking a `.mcaddon` while the
   game is already running silently does nothing (Mojang bug MCPE-227874, fixed in a later preview, not yet in the
   release).
2. Double-click `given-jar-0.1.1.mcaddon`. Minecraft starts and shows two "Successfully imported" messages
   (behavior pack and resource pack).

If the import still does nothing, install by hand:

1. Open `%appdata%\Minecraft Bedrock\users\shared\games\com.mojang` in File Explorer (paste it in the address bar).
   This is the GDK location. The old `...\Packages\Microsoft.MinecraftUWP_8wekyb3d8bbwe\LocalState\games\com.mojang`
   folder is the legacy UWP location and is no longer used.
2. Rename a copy of the `.mcaddon` to `.zip` and extract it.
3. Copy `given_jar_BP` into `behavior_packs` and `given_jar_RP` into `resource_packs`.

## 3. Turn it on for a world

1. Create a new world (or edit an existing one): **Edit > Behavior Packs > Available**, select **given.jar**,
   **Activate**. The resource pack is switched on with it because the two packs depend on each other; check under
   **Resource Packs > Active** that given.jar is there too.
2. Leave every switch under **Experiments** off. given.jar uses only stable Script API modules.
3. Game mode: Survival for the players. Cheats can stay off.
4. Minecraft warns that achievements are off for worlds with add-ons. That is normal for any add-on that is not from
   the Marketplace.

## 4. Play over LAN

On the host PC:

1. In the world settings, **Multiplayer**: turn on **Multiplayer Game** and **Visible to LAN Players**.
2. Load the world.
3. Summon the sphere: type `/given_jar:summon`, or switch to creative, take the **Watcher Spawn Egg** from the
   creative inventory, use it, and switch back to survival.

On every other PC (same home network):

1. **Play > Friends**. The host's world is listed under **LAN Games**. Join it.
2. Joining players download the packs from the host automatically. They do not need to install anything.

Commands like `/given_jar:skip` need operator rights. The host has them. To give them to someone else: pause menu,
player list, choose the player, set permission to **Operator**.

## Updating

Import the new `.mcaddon` the same way (game closed). If Minecraft keeps the old version, remove `given_jar_BP` and
`given_jar_RP` from the com.mojang folders above and import again.
