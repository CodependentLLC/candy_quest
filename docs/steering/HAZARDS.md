# Hazard Steering

## Core rule

Hazards must be visually fair. Collision should correspond to the dangerous portion of the artwork, not to the entire PNG or decorative base.

## Hazard schema

```js
{
  id: "spikes-03",
  type: "spikes",
  x: 730,
  y: 575,
  w: 100,
  h: 25,

  collision: {
    offsetX: 6,
    offsetY: 5,
    width: 88,
    height: 18
  }
}
```

## Required separation

Every hazard has:
- visual bounds
- lethal collider
- optional trigger collider
- behavior data

These are not interchangeable.

## Spikes

Spike lethal collision should:
- cover the pointed dangerous zone
- be narrower than decorative base where appropriate
- reliably kill the player when body overlap is meaningful
- not kill on visual near-misses

## Future hazard types

### Chocolate pools
Continuous area damage or instant failure depending on level rule.

### Peppermint crushers
Timed moving hazards with visible warning phase.

### Falling gumdrops
Trigger → warning → fall → recovery.

### Candy lasers
Clear pre-fire telegraph and fixed active interval.

### Crumbling platforms
Safe first contact, visible shake, delayed collapse.

## Hazard state machine

Complex hazards should use explicit states:

```text
idle
warning
active
recovery
```

## No invisible danger

Prohibited:
- hidden lethal colliders outside artwork
- lethal contact before warning animation
- collision based on full source-image alpha bounds
- hazards that continue killing after terminal game state
