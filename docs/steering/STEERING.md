# Candy Quest — Steering Guide

## Purpose

This steering pack defines the rules for growing Candy Quest from a single polished level into a reusable, extensible 2D platformer with multiple worlds, increasing difficulty, additional playable characters, new enemies, hazards, collectibles, power states, and progression.

These documents are intended for human developers and coding agents such as Codex. They are architectural constraints, content rules, acceptance criteria, and product guardrails—not implementation suggestions that may be ignored.

## Current baseline

The current game is a vanilla JavaScript / HTML5 Canvas platformer served by a small Node static server.

The current runtime has:
- a `Game` class that owns the primary loop and most systems
- a `Player` entity
- one level definition in `src/level.js`
- data-defined platforms, moving platforms, candy, stars, hazards, bounce pads, enemies, checkpoint, and goal
- asset loading through `src/assets.js`
- game-over rules for lives and the 60-second timer
- a debug collision mode
- smoke tests in `test/smoke.mjs`

## Non-negotiable existing behavior

Do not regress these while expanding the game:

- `VISUAL_GROUNDING_OFFSET` must remain exactly `13` unless the owner explicitly changes it.
- Player collider geometry is gameplay geometry and must remain independent of sprite art.
- Player animation states must share a stable world position and feet anchor.
- Platform, hazard, enemy, and collectible collision geometry must not be inferred from decorative PNG bounds.
- A final-life death ends the run; it does not auto-respawn.
- The round timer starts at 60 seconds and reaching zero ends the run.
- Full restart resets terminal state, lives, timer, checkpoint state, and transient effects.
- One-way platforms remain pass-through from below and landable from above.
- Moving platform graphics and collision must share the same world transform.
- New visuals must never silently modify gameplay geometry.

## Desired product direction

Candy Quest should feel:
- playful
- readable
- rewarding
- safe for kids
- forgiving but not trivial
- visually coherent
- increasingly challenging
- easy to extend through data rather than hard-coded exceptions

Growth should come from combining a small number of understandable mechanics rather than continually adding arbitrary rules.

## Steering document index

1. `ARCHITECTURE.md` — target code structure and system ownership
2. `LEVELS.md` — level schema, progression, pacing, and difficulty
3. `CHARACTERS.md` — playable character rules and shared movement contract
4. `ENEMIES.md` — enemy architecture, behaviors, and difficulty ramp
5. `HAZARDS.md` — hazards, collision fairness, telegraphing, and damage rules
6. `COLLISION_PHYSICS.md` — authoritative physics and collision contracts
7. `ASSETS_ANIMATION.md` — sprite, atlas, animation, and rendering rules
8. `GAME_FEEL.md` — premium feedback, rewards, audio hooks, and presentation
9. `PROGRESSION.md` — worlds, unlocks, difficulty, scoring, and replayability
10. `QA_ACCEPTANCE.md` — testing, debug tools, regression gates, and release checks
11. `CODEX_RULES.md` — exact implementation rules for coding agents
12. `CONTENT_TEMPLATE.md` — templates for adding levels, characters, enemies, hazards, and collectibles

## Change policy

Any new feature must answer four questions before implementation:

1. Is it a new reusable mechanic or a one-off exception?
2. Can it be expressed in level/entity data?
3. What existing system owns it?
4. What automated or visual acceptance test proves it works?

If the answer is "put a special case in `game.js`", stop and design a reusable system first.
