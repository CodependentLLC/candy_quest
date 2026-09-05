# Assets & Animation Steering

## Runtime asset rule

Runtime art should be production-ready individual frames or verified atlases.

Do not ship:
- concept sheets as runtime sprites
- giant unused source sheets
- inconsistent transparent margins
- frames with different apparent character scale

## Player assets

Current normalized player frames:
- use a common transparent canvas
- use a shared feet baseline
- render at a shared destination size
- use `VISUAL_GROUNDING_OFFSET = 13`

All future player animation states must preserve that same grounding contract.

## Animation metadata

Frame timing belongs in metadata:

```js
animations: {
  idle: { frames: 4, fps: 7, loop: true },
  run: { frames: 6, fps: 11, loop: true },
  hurt: { frames: 4, fps: 10, loop: false },
  victory: { frames: 6, fps: 9, loop: false }
}
```

Avoid hard-coded frame counts across multiple files.

## Atlas metadata

Platform/enemy/hazard source rectangles belong in an asset manifest, not in gameplay methods.

Example:

```js
platformSprites = {
  cakeMedium: {
    source: { x, y, w, h },
    anchor: { x: 0, y: 0 }
  }
}
```

## Visual collision relationship

Decorative overhangs are allowed.

Example:

```text
     frosting drip
       ↓
  ┌────────────── visual sprite ──────────────┐
  ═══════════ walkable surface ═══════════════
  ┌──────── gameplay collider ────────────────┐
```

The collision surface must align with what the player reads as walkable.

## Animation state rules

- state changes reset frame index unless explicitly designed otherwise
- non-looping animations stop on final frame or transition deterministically
- terminal animations cannot accidentally re-enable gameplay
- VFX animations never modify collision
- reduced-motion mode may simplify or disable decorative animation

## New asset acceptance

Every interactive asset must be reviewed at native runtime scale, not only at source resolution.
