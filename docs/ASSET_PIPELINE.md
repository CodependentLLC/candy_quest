# Runtime Asset Pipeline

Editable source sheets and intermediate exports belong in `art-source/`. Only optimized files referenced by `src/assets.js` belong in `assets/`; do not ship source art or test output.

## Player frames

1. Keep the original sheet in `art-source/player/`.
2. Verify pose count and transparent boundaries before extraction; do not assume equal columns from image width.
3. Crop each pose to alpha bounds, then place it on a transparent `384x384` canvas.
4. Scale uniformly so the lowest visible shoe pixel is `y=360` and center the pose at `x=192`; never stretch or skew.
5. Export zero-based files as `assets/player/frames/{idle,run,jumpfall}-{index}.png`.

Runtime draws complete normalized frames and must not crop or rescale poses differently per frame.

## Naming and formats

Use lowercase kebab-case names, stable category directories, and zero-based animation indices. Runtime sprites are non-interlaced RGBA PNGs when transparency is required. Player frames are `384x384`; the flag sheet is `2172x724`; the platform atlas is `1536x1024`; the background is RGB PNG `1672x941`. Other art keeps authored dimensions and aspect ratio.

## Validation

Run `npm run validate:assets` before release. It verifies referenced runtime files, player canvas dimensions/transparency, and the `y=360` feet baseline. Review art at native runtime scale too; automated validation cannot detect visual wobble or an incorrect walkable surface.
