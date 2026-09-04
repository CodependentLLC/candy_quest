# Level Design & Data Steering

## Goal

Levels must become content data loaded through a common runtime. A new level should not require editing core collision or rendering code unless it introduces a genuinely new reusable mechanic.

## Required level schema

Each level should expose:

```js
export default {
  id: "candy-meadow-01",
  name: "Candy Meadow",
  world: "candy-meadow",

  width: 5200,
  height: 720,

  rules: {
    timeLimitSeconds: 60,
    startingLives: 3
  },

  spawn: { x: 120, y: 470 },

  checkpoints: [],
  goal: {},

  platforms: [],
  movingPlatforms: [],
  hazards: [],
  enemies: [],
  collectibles: [],
  decorations: [],

  difficulty: {
    rating: 1,
    targetCompletionSeconds: 45
  }
};
```

## Platform data

Every platform must explicitly identify behavior.

```js
{
  id: "p-12",
  type: "cake",
  x: 1180,
  y: 485,
  w: 250,
  h: 90,

  collision: {
    mode: "solid",
    offsetX: 0,
    offsetY: 0,
    width: 250,
    height: 90
  },

  sprite: "cake-medium"
}
```

Supported collision modes should be explicit:

```text
solid
one-way
moving-solid
moving-one-way
none
```

Do not infer one-way behavior from sprite type or filename.

## Level difficulty model

Difficulty should grow across five dimensions:

1. timing pressure
2. jump precision
3. moving geometry
4. enemy complexity
5. hazard combinations

Do not increase all five at the same time.

## Difficulty ramp rule

A mechanic follows this sequence:

```text
Introduce → Practice → Combine → Test → Mastery
```

Example:

```text
Level 2A: first bounce pad with no hazard
Level 2B: bounce pad used to reach candy
Level 2C: bounce pad + moving platform
Level 2D: bounce pad + moving platform + enemy
Level 2E: short mastery sequence
```

## Kid-friendly fairness

- First encounter with a mechanic must be low-risk.
- Failure should teach the player what happened.
- Blind hazards are prohibited.
- Avoid precision jumps where the player cannot see the landing target.
- Checkpoints should precede sustained challenge spikes.
- Difficult sections should be short enough to retry quickly.
- New mechanics should have a visual language that remains consistent in later levels.

## Proposed world progression

### World 1 — Candy Meadow
Teach:
- movement
- jump
- simple candy collection
- simple enemy stomp
- checkpoint
- goal

### World 2 — Jelly Springs
Teach:
- bounce pads
- moving platforms
- vertical routing

### World 3 — Chocolate Caverns
Teach:
- tighter timing
- more hazards
- limited safe space
- stronger enemy combinations

### World 4 — Lollipop Heights
Teach:
- vertical platform chains
- directional moving platforms
- moving hazard timing

### World 5 — Candy Castle
Test:
- prior mechanics in combinations
- premium set pieces
- final challenge sequence

## Level acceptance

Every new level must pass:
- reachable goal test
- no impossible jump test
- no required blind jump
- checkpoint reachable
- collectible placement sanity check
- no spawn overlap with hazard/enemy
- timer target achievable by an average successful run
- collision debug visual review
