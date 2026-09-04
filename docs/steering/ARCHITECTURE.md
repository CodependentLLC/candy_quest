# Architecture Steering

## Current risk

The current `Game` class owns input flow, physics, collision, enemies, collectibles, hazards, checkpoints, goal logic, camera, particles, rendering, HUD, and terminal states. This is acceptable for the current game size but will become the main source of fragility as more levels and entities are added.

The goal is not a framework rewrite. The goal is gradual separation of reusable systems.

## Target module boundaries

Recommended direction:

```text
src/
  main.js
  game.js
  input.js

  core/
    session.js
    state-machine.js
    timer.js
    events.js
    math.js

  entities/
    player.js
    enemy.js
    collectible.js
    hazard.js
    checkpoint.js
    moving-platform.js

  systems/
    physics.js
    collisions.js
    combat.js
    collectibles.js
    checkpoints.js
    progression.js
    particles.js
    audio.js
    camera.js

  rendering/
    renderer.js
    sprites.js
    hud.js
    debug.js

  content/
    levels/
      level-01.js
      level-02.js
      ...
    characters.js
    enemies.js
    hazards.js
    collectibles.js

  assets.js
```

This may be reached incrementally. Do not refactor everything at once.

## Ownership rules

### Game
Owns:
- high-level lifecycle
- current session state
- current level instance
- update ordering
- terminal states
- orchestration between systems

Does not permanently own:
- enemy-specific behavior
- hazard-specific collision rules
- collectible-specific reward logic
- sprite crop metadata
- per-level special cases

### Level data
Owns:
- geometry
- spawn/checkpoint/goal placement
- entity placement
- per-level tuning
- references to reusable entity types

Does not own:
- JavaScript callbacks
- anonymous functions
- direct rendering logic
- collision algorithms

### Entity definitions
Own:
- type defaults
- dimensions
- collider metadata
- animation names
- behavior parameters

### Systems
Own:
- shared rules applied to many entities

## Update order

Keep a deterministic update order:

1. read input
2. handle terminal/restart/pause actions
3. update round/session timers
4. update moving geometry
5. update player intent and movement
6. resolve world collision
7. update enemies
8. resolve player/enemy interactions
9. resolve hazards
10. resolve collectibles
11. resolve checkpoint/goal
12. update particles/audio/camera
13. render

Do not let rendering mutate gameplay state.

## Event direction

As complexity grows, gameplay events should be emitted rather than directly triggering unrelated effects.

Examples:

```js
events.emit("candy:collected", { value: 1, x, y });
events.emit("player:hurt", { source: hazard.id });
events.emit("checkpoint:activated", { id });
events.emit("level:complete", { levelId });
```

Particles, audio, HUD, and achievements may listen to these events.

## State machine requirement

At minimum, formalize these game/session states:

```text
loading
playing
player-dead
game-over
level-complete
paused
transitioning
```

Do not represent all state exclusively through unrelated booleans.

## No hidden coupling

New content must not depend on:
- hard-coded coordinates in `game.js`
- string comparisons scattered across rendering and physics
- direct access to unrelated system internals
- assumed frame counts outside asset metadata
