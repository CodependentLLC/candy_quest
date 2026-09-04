# Playable Character Steering

## Shared gameplay contract

All playable characters must obey a shared physics interface so levels do not require character-specific collision code.

Minimum interface:

```js
character.colliderRect
character.feetX
character.feetY
character.vx
character.vy
character.onGround
character.update(dt, input, context)
character.draw(ctx, cameraX)
```

## Current player contract

Preserve:
- stable collider independent from sprite dimensions
- common feet anchor
- consistent visual scale across idle/run/jump/fall
- `VISUAL_GROUNDING_OFFSET = 13`

Do not change this value unless explicitly directed by the owner.

## New character philosophy

New characters should feel different through one or two understandable strengths, not through entirely different physics engines.

Examples:

### Gumdrop Girl
Baseline balanced character.

### Marshmallow Kid
- slightly higher jump
- softer landing
- lower horizontal speed

### Peppermint Racer
- faster acceleration
- lower jump
- better moving-platform handling

### Chocolate Knight
- slower
- can safely stomp tougher enemies
- stronger bounce response

## Character stats

Use data:

```js
{
  id: "peppermint-racer",
  movement: {
    acceleration: 2700,
    friction: 2200,
    maxSpeed: 410,
    gravity: 1750,
    jumpSpeed: 650,
    coyoteSeconds: 0.12,
    jumpBufferSeconds: 0.12
  },
  collider: {
    width: 50,
    height: 72
  },
  abilities: ["dash-light"]
}
```

## Guardrails

- Do not alter platform collision code per character.
- Character sprite size must not define collider size.
- Every animation must remain aligned to the character's canonical feet anchor.
- New character abilities must be modeled as explicit capabilities, not `if characterName === ...` conditions throughout core systems.
- New characters must be able to complete all required main-path level geometry unless a level is explicitly marked character-specific.

## Character acceptance

Each character requires:
- idle/run/jump/fall
- hurt
- victory
- normalized asset dimensions
- verified feet baseline
- collider debug screenshot
- jump height test
- run speed test
- moving-platform test
- one-way platform test
- terminal-state test
