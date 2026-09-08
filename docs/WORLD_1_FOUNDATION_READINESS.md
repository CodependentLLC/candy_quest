# World 1 Foundation Readiness

Date: 2026-09-08
Branch: `OS-153-cq-w1-1-foundation-run-final-foundation-acceptance-and-readiness-gate`

## Evidence

- `npm run validate:assets`: passed; 27 runtime PNG assets validated.
- `npm test`: passed; smoke and server tests passed.
- `npx playwright test --list`: passed; 20 tests collected across desktop and mobile projects.
- `npm run test:e2e`: passed; 20 tests passed.
- `npm run test:release`: passed; asset, unit/server, and browser gates passed.
- Browser core flows reported zero console, page, and request errors in passing tests.
- Desktop and mobile screenshots were generated under `test-output/`.
- `VISUAL_GROUNDING_OFFSET` remains `13` and is protected by the smoke test.
- Existing browser coverage exercised boot, movement, jump, pause/resume, solid/one-way collision, respawn, checkpoint, stars/goal, and screenshot paths.

## Integration fixes made

The acceptance run exposed and fixed the malformed nested reduced-motion/pause test structure. The mobile HUD was constrained to the viewport, reduced-motion bursts were disabled, and the wall test input stub was brought up to the current input API. These are release-gate integration fixes only.

## Blocking gaps on latest main

This branch was intentionally created from the latest `main`, which does not yet contain all prerequisite foundation tickets. The following acceptance items cannot be evidenced as complete here:

- No formal world/level schema validator is present on `main`.
- Level rules are not authoritative: gameplay still contains global timer fallback and hard-coded star denominator/goal requirements.
- No reusable mechanic/entity registry is present on `main`.
- No explicit application/gameplay state machine is present on `main`.
- The world map and map-return flow are not present.
- Profile/world-progress/level-run separation is incomplete.
- A registered and validated `world-01-02` fixture path is not available.
- A complete F2 visual collision review was not possible in this automated run; it requires interactive inspection of player feet, moving platforms, one-way surfaces, bounce pads, hazards, and enemy zones.

## Decision

**NO-GO for starting World 1-2.** The release commands are green and the Playwright harness is usable, but the prerequisite foundation work is not all merged into the `main` used for this gate. Re-run this report after those foundation branches are merged and verify the remaining map, state, schema, registry, rules, persistence, fixture-level, and F2 collision evidence before approving World 1-2.
