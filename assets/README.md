# Candy Quest runtime assets

Only files used by the active game belong in this directory. Original source sheets and intermediate preparation files belong in `art-source/` and must not be copied into a production deployment.

CQ-83 moved superseded large sheets, duplicate frame exports, and unused individual art out of the runtime tree. The runtime manifest is `src/assets.js`; when adding art, add only the prepared file needed by gameplay and keep the editable source in `art-source/`.

All runtime player frames now use the same transparent canvas:

- Frame size: 384×384
- Visible character height: 320px
- Feet baseline: y=360
- Horizontal anchor: center of frame

Included:
- 4 idle frames
- 6 run frames
- 4 jump/fall frames
- normalized horizontal strips
- individual frame PNGs
- `player-sprite-manifest.json`

The character width naturally changes with pose, but every frame canvas, visual height,
center anchor, and feet baseline are consistent. Do not rescale run/idle differently at runtime.
Render all states using the same destination width/height or draw the normalized frame at native aspect ratio.

## Foot-contact normalization

All active player frames use a 384×384 canvas and now place the lowest visible
(non-transparent) shoe pixel exactly at source y=360. This matches the runtime
`FEET_BASELINE_Y = 360`.

This change is visual only. Player collider dimensions, physics coordinates,
platform collision surfaces, and collision resolution were not moved.
