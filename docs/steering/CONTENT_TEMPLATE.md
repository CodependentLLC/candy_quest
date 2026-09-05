# Content Addition Templates

## New level

```js
export default {
  id: "world-02-level-01",
  name: "Jelly Springs 1",
  world: "jelly-springs",
  width: 6000,
  height: 720,

  rules: {
    timeLimitSeconds: 60,
    startingLives: 3
  },

  spawn: { x: 100, y: 450 },

  checkpoints: [],
  goal: {},

  platforms: [],
  movingPlatforms: [],
  hazards: [],
  enemies: [],
  collectibles: [],
  decorations: [],

  difficulty: {
    rating: 2,
    targetCompletionSeconds: 48
  }
};
```

## New playable character

```js
{
  id: "character-id",
  name: "Display Name",

  movement: {
    acceleration: 2450,
    friction: 2100,
    maxSpeed: 365,
    gravity: 1750,
    jumpSpeed: 700,
    coyoteSeconds: 0.12,
    jumpBufferSeconds: 0.12
  },

  collider: {
    offsetX: 0,
    offsetY: 0,
    width: 50,
    height: 72
  },

  animations: {
    idle: "character-idle",
    run: "character-run",
    jump: "character-jump",
    fall: "character-fall",
    hurt: "character-hurt",
    victory: "character-victory"
  },

  abilities: []
}
```

## New enemy type

```js
{
  id: "enemy-type",
  behavior: "patrol",
  movement: {
    speed: 80
  },
  collision: {
    width: 48,
    height: 42,
    stompZoneHeight: 14
  },
  combat: {
    contactDamage: 1,
    stompable: true
  },
  rewards: {
    score: 100
  }
}
```

## New hazard type

```js
{
  id: "hazard-type",

  collision: {
    offsetX: 0,
    offsetY: 0,
    width: 64,
    height: 20
  },

  behavior: {
    mode: "static"
  },

  damage: {
    instantDeath: true
  }
}
```

## New collectible type

```js
{
  id: "collectible-type",
  radius: 24,

  reward: {
    score: 100,
    candy: 1,
    timeSeconds: 0,
    lives: 0
  },

  feedback: {
    particle: "candy-pop",
    sound: "candy-pickup"
  }
}
```

## Pull request / ticket acceptance block

Paste this into implementation tickets:

```text
Acceptance:
- Feature is data-driven where practical.
- Existing physics invariants are preserved.
- VISUAL_GROUNDING_OFFSET remains 13.
- No sprite bounds are used as implicit collision bounds.
- Restart resets transient state.
- Terminal game states stop gameplay.
- Automated regression coverage added.
- F2 collision debug reviewed for interactive geometry.
- No browser console errors.
```
