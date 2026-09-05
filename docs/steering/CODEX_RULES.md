# Codex / Coding Agent Steering

Read this before making any gameplay change.

## Protect these invariants

1. `VISUAL_GROUNDING_OFFSET` is `13`. Do not change it.
2. Player collider is independent from sprite dimensions.
3. Do not resize player collider to fix art alignment.
4. Do not move platform collision to fix an image crop unless the gameplay surface itself is wrong.
5. Timer starts at 60 seconds.
6. Zero lives ends the run.
7. Zero time ends the run.
8. Terminal game states stop gameplay simulation.
9. One-way platforms permit upward passage.
10. Moving platform collider and sprite use one transform.

## Before coding

Inspect:
- relevant level data
- entity config
- collision code
- sprite metadata
- existing tests

Do not guess.

## Implementation rules

- Prefer data-driven content.
- Do not add level-coordinate checks to `game.js`.
- Do not branch on literal character/enemy names across core systems.
- Add a reusable type definition when adding new entity behavior.
- Keep rendering side-effect free.
- Keep collision deterministic.
- Clamp timers and counters.
- Make terminal-state handling idempotent.
- Reset transient state on restart/level transition.

## Collision bugs

When fixing a collision bug:
1. reproduce it
2. identify whether the source is art, anchor, collider, movement, or resolution
3. fix the correct layer
4. add a regression test
5. verify in F2 debug mode

Never use arbitrary visual offsets as a first-line physics fix.

## Deliverable format

Every implementation report must include:
- files changed
- behavior changed
- invariants intentionally preserved
- tests added/updated
- tests run
- test result
- manual/browser verification performed
- known remaining issue

Do not claim visual success without actual visual/browser evidence.
