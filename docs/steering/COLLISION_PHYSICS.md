# Collision & Physics Steering

## Authoritative principle

Physics geometry is authored independently from visual assets.

Never use:
```js
image.width
image.height
alphaBounds
```
as automatic gameplay collision dimensions.

## Player

World contract:
- `x` = collider/world origin as currently implemented
- `y` = collider/world origin
- `colliderRect` = authoritative physics rectangle
- `feetX` / `feetY` derive from `colliderRect`
- artwork is rendered relative to feet
- `VISUAL_GROUNDING_OFFSET = 13`

## Collision phases

Resolve horizontal and vertical movement separately.

Recommended flow:

```text
move X
resolve X against solid geometry

move Y
resolve Y against:
  solid geometry
  one-way surfaces if falling from above
```

Do not resolve both axes from a single post-movement overlap without previous-position context.

## One-way rule

A one-way surface catches a player only when:
- player is descending
- player's previous bottom was at or above platform top, within tolerance
- new bottom crosses platform top
- horizontal ranges overlap

It does not:
- block side movement
- block upward movement from below

## High-speed protection

Any entity that can move far enough in one frame to cross a collider must use:
- substeps, or
- swept collision

Never rely on frame rate to prevent tunneling.

## Moving platforms

Required:
- sprite and collider use identical world transform
- standing player receives platform displacement
- platform must not teleport player through solids
- riding remains stable during direction reversal

## Debug mode

F2 debug view should show:
- player body
- feet anchor
- platform colliders
- one-way surface line
- enemy body/stomp zones
- hazard lethal zones
- checkpoint/goal triggers

Debug colors may differ, but meaning must be documented.

## Physics tuning policy

Physics constants should eventually move out of `Player.update()` into character config.

Do not tune:
- gravity
- jump speed
- collider size
- visual offset

to fix an unrelated asset or level-layout problem.

## Regression rule

Whenever a collision bug is fixed, add a test that reproduces the exact previous failure.
