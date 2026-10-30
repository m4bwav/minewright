// minewright fixture: answers `/scriptevent fixture:selftest` with one [MWTEST] marker per check.
// bds_run.py scans the server console for these lines. Stable @minecraft/server APIs only.
import { system, world } from "@minecraft/server";

function check(name, fn) {
  try {
    const why = fn();
    if (why) console.warn(`[MWTEST] FAIL ${name} ${why}`);
    else console.warn(`[MWTEST] PASS ${name}`);
  } catch (e) {
    console.warn(`[MWTEST] FAIL ${name} ${e}`);
  }
}

system.afterEvents.scriptEventReceive.subscribe((ev) => {
  if (ev.id !== "fixture:selftest") return;
  check("fixture", () => (world.getDimension("overworld") ? "" : "no overworld"));
  console.warn("[MWTEST] DONE");
});
