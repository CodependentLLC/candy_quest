# Enemy Steering

## Design goals

Enemies should be:
- visually readable
- predictable enough for kids to learn
- reusable across levels
- configurable through data
- dangerous because of behavior, not collision ambiguity

## Enemy data model

```js
{
  id: "gummy-walker-01",
  type: "gummy-walker",

  x: 930,
  y: 515,

  patrol: {
    minX: 860,
    maxX: 1040,
    speed: 70
  },

  collision: {
    body: { width: 48, height: 42 },
    stompZoneHeight: 14
  }
}
```

Type definitions should live separately:

```js
enemyTypes["gummy-walker"] = {
  behavior: "patrol",
  contactDamage: 1,
  stompable: true,
  scoreValue: 100
};
```

## Enemy families

Use increasing behavioral complexity:

### Tier 1 — Walkers
- horizontal patrol
- turn at bounds
- stompable

### Tier 2 — Hoppers
- predictable jump intervals
- clear anticipation animation

### Tier 3 — Chargers
- detect player in a limited range
- telegraph before charging

### Tier 4 — Flyers
- simple path or sine movement
- never spawn directly on top of player

### Tier 5 — Specialists
- shields
- ranged candy projectiles
- temporary invulnerability
- multi-step defeat conditions

## Fairness rules

- Every harmful action needs readable anticipation where practical.
- Enemy collision must be intentionally authored.
- Stomp zones should be more forgiving than harmful side/body zones.
- Never kill the player because decorative pixels overlap.
- Enemy movement must not tunnel through solid level geometry.
- Enemy spawn positions must not overlap checkpoints or player spawn.
- Off-screen enemies must not attack before the player has a fair chance to see them.

## Difficulty growth

Increase enemy challenge by:
- pairing different behaviors
- changing placement
- shortening safe timing windows
- combining enemies with platforms/hazards

Avoid simply doubling movement speed.

## Acceptance

Every enemy type needs tests for:
- patrol bounds
- wall interaction
- stomp success
- side collision damage
- dead/inactive state
- reset on restart
- interaction with game-over state
