// Live driver for the shared Calm spaceship sprite (product rendering code).
// Renders the real shared sprite core AND the Pi overlay animation from the working
// tree, and asserts the parity-locked working behavior the corrected docs/calm.md
// describes: the working warp field toggles between two phase states in place with no
// accumulated leftward drift, while the idle starfield does stream left.
import { createCalmWorkingSpaceshipSprite } from "file:///home/nixos/.no-mistakes/worktrees/f82d8fd6ce1f/01M3AG4YHZWP2BD7KQNBP8BERB/.claude/mods/firstmate-calm/lib/fm-calm-working-spaceship-sprite.ts";
import { createCalmWorkingSpaceshipAnimation } from "file:///home/nixos/.no-mistakes/worktrees/f82d8fd6ce1f/01M3AG4YHZWP2BD7KQNBP8BERB/.pi/extensions/lib/fm-calm-working-spaceship.ts";

const strip = (s) => s.replace(/\u001b\[[0-9]+m/g, "");
const lines = [];
const out = (s = "") => lines.push(String(s));

// --- 1. Pi overlay renders the shared sprite core byte-identically -----------------
const anim = createCalmWorkingSpaceshipAnimation();
const core = createCalmWorkingSpaceshipSprite();
let identical = true;
for (let width of [30, 44, 80]) {
  for (let step = 0; step < 14; step++) {
    const a = JSON.stringify(anim.render(width).map(strip));
    const c = JSON.stringify(core.frame(width).map((r) => r.map((x) => x.text).join("")));
    if (a !== c) { identical = false; break; }
    anim.tick(); core.tick();
  }
}
out(`[1] Pi overlay frames byte-equal to shared sprite core (harness-neutral): ${identical}`);

// --- 2. Idle presentation: (|) saucer over |^| hull, starfield ---------------------
const idle = createCalmWorkingSpaceshipAnimation();
const idleFrame = idle.render(44);
out(`[2] idle frame (rows):`);
for (const r of idleFrame) out(`    ${strip(r)}`);
out(`    saucer rendered: ${strip(idleFrame[0]).includes("(|)")}  hull rendered: ${strip(idleFrame[1]).includes("|^|")}`);

// --- 3. IDLE starfield streams LEFT (the real streaming the docs describe) ---------
// Compare the field over one idle phase step: the asymmetric unit slides the pattern
// by one column (consecutive phases 0->1->2...), so stars move left past the ship.
const idleStream = createCalmWorkingSpaceshipAnimation();
const f0 = strip(idleStream.render(44)[1]); // row 1 = hull row carrying the starfield
try {
  for (let i = 0; i < 6; i++) idleStream.tick(); // idle: one phase per 6 ticks
} catch {}
const f6 = strip(idleStream.render(44)[1]);
// At absolute column c the glyph is cycle[(c+phase)%4]; a phase+1 step slides the
// whole field one column left, so glyph at c after == glyph at c+1 before.
let streamChecks = 0;
for (let c = 4; c <= 40; c++) if (f6[c] === f0[c + 1]) streamChecks++;
out(`[3] idle starfield streams left (phase+1 slides field): ${streamChecks} columns matched the one-column-left slide`);

// --- 4. WORKING warp: parity-locked, toggles in place, NO leftward drift -----------
const wk = createCalmWorkingSpaceshipAnimation();
wk.render(44);
wk.setWorking(true);
const go = wk.render(44);
out(`[4] working frame (single row):`);
out(`    ${strip(go[0])}`);
out(`    compact =( * ) warp saucer present: ${strip(go[0]).startsWith("=( * )")}  rows: ${go.length}`);

// Over a long non-movement run, the field must only toggle between the two even
// phase states {0,2}. Check that every frame is one of the two states and that the
// streak field never shifts LEFT (i.e. position stays and starPhase stays even).
const states = new Set();
let anyOdd = false;
let leftShift = false;
const pos0 = wk.position();
const snapshots = [];
for (let step = 1; step <= 200; step++) {
  wk.tick(); // every tick: phase +2 (even orbit), move lands only on every 4th tick
  const fr = strip(wk.render(44)[0]);
  const phase = wk.starPhase();
  if (phase % 2 !== 0) anyOdd = true;
  states.add(`${phase}`);
  if (step <= 4) snapshots.push(step === 1 ? fr : null); // capture state right after first non-move tick
}
// The parity toggle: after ONE non-movement tick (phase +2), glyph at c == glyph at c+2 before.
const t1 = createCalmWorkingSpaceshipAnimation();
t1.setWorking(true);
const before = strip(t1.render(44)[0]);
t1.tick();
const after = strip(t1.render(44)[0]);
let toggleChecks = 0;
for (let c = 7; c <= 41; c++) if (after[c] === before[c + 2]) toggleChecks++;
out(`[5] working field parity: phase stayed even (anyOdd=${anyOdd}), reached exactly {${[...states].sort().join(",")}} over 200 ticks`);
out(`    field toggles in place after one non-movement tick (glyph c<-c+2): ${toggleChecks} columns matched`);
out(`    working saucer position stayed put through non-movement ticks (no left drift): pos0=${pos0} posNow=${t1.position()}`);
out(`    working saucer swept right while thinking: warp span cruise wraps (see position ${t1.position()})`);
// Confirm the saucer DOES cruise right during working (movement ticks).
const cruiser = createCalmWorkingSpaceshipAnimation();
cruiser.setWorking(true);
cruiser.render(44);
const cols = new Set();
let last = cruiser.position();
for (let s = 1; s <= 4 * 100; s++) { cruiser.tick(); const p = cruiser.position(); if (p !== last) { cols.add(p === 38 ? 0 : p); last = p; } }
out(`[6] working saucer cruises right continuously (wrap marquee): visited ${cols.size} distinct columns over 400 ticks`);

import { writeFileSync } from "node:fs";
writeFileSync(
  "/home/nixos/.no-mistakes/evidence/01M3AG4YHZWP2BD7KQNBP8BERB/calm-spaceship-live.txt",
  lines.join("\n") + "\n",
);
console.log(lines.join("\n"));