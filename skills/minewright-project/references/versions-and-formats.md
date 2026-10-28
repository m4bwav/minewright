# Versions and formats that work together (checked 2026-10-27)

Read this when creating `package.json`, raising a `format_version`, or when a lint, build or entity breaks after an update. Every line was verified on the date given in [RESEARCH.md](../RESEARCH.md); re-check before relying on it.

## npm dev dependencies (Node 24)

| Package | Pin | Why this one |
|---|---|---|
| `@minecraft/server` | 2.11.0 | must equal the manifest's module version |
| `@minecraft/vanilla-data` | 1.26.60 | ids for the current game |
| `typescript` | 5.9.3 | npm `latest` is 7.0.2, but `typescript-eslint` 8.72.1 allows only `<6.1.0` (peer range), and `eslint-plugin-minecraft-linting` 2.0.13 depends on `typescript ^5.6.0` |
| `eslint`, `@eslint/js` | 9.39.5 | the Minecraft lint plugin depends on `eslint ^9.17.0` (npm `latest` is 10.13.0); npm marks eslint 9 deprecated, which is expected |
| `typescript-eslint` | 8.72.1 | flat config with type-aware rules |
| `eslint-plugin-minecraft-linting` | 2.0.13 | Script API rules from Mojang |
| `esbuild` | 0.28.2 | bundles `src/main.ts`; `--external:@minecraft/*` works |
| `@types/node` | 24.19.2 | `node:test` types for the unit tests |

npm 11 prints an `allow-scripts` warning for esbuild's install script; esbuild works without it through its optional platform package, so nothing needs approving.

Node 24.18 runs `node --test test/*.test.ts` with no flag (type stripping). Use `.ts` extensions in relative imports, and keep the code erasable: no `enum`, no constructor parameter properties, no `namespace`.

## Entity component names move with format_version

A behavior-pack entity is parsed against the schema of its `format_version`. A component the schema no longer knows makes the whole entity fail to load, and the game itself shows nothing.

| Component | Accepted up to | From | Use instead |
|---|---|---|---|
| `minecraft:pushable` | 1.26.0 | 1.26.10 | `minecraft:pushable_by_entity: {}` and `minecraft:pushable_by_block: {}` (presence components); to make an entity not pushable, leave both out |

Bedrock Dedicated Server 1.26.60.6 logs it as:

```
[... ERROR] [Actor] <world> | actor_definitions | <pack> | <id> | minecraft:entity | ERROR: Entity '<id>' failed to load from JSON: parse errors occurred:  -> components -> minecraft:pushable: this component was found in the input, but is not present in the Schema
```

Rules:

- Copy components from a `Mojang/bedrock-samples` entity whose `format_version` matches yours (the vanilla cow is at 1.26.10 with the new components).
- Keep a working `format_version` unless a component you need requires a newer one. Creator Tools 0.20.0 recommends raising entity versions to 1.26.50 but does not flag the components that the raise breaks.
- After any raise: minewright-checks (`components` check), then minewright-server's self-test, which spawns the entity.

## Resource file versions vanilla still uses

From `Mojang/bedrock-samples` main: `cow.entity.json` 1.10.0 (some newer mobs, such as the zombie, 1.26.0), `cow.render_controllers.json` 1.8.0, `cow.animation.json` 1.8.0, `cow.geo.json` 1.8.0. Creator Tools recommends 1.26.50 for client entities; it is optional. On Bedrock Dedicated Server 1.26.60.6 the fixture (client entity 1.10.0, render controller 1.10.0, geometry 1.12.0) and the example add-on (client entity, render controller and animation 1.10.0, geometry 1.21.0, behavior entity 1.26.50) load without errors; the client side still needs a look in the game.
