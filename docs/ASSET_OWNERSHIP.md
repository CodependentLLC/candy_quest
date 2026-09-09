# Runtime Asset Ownership

Runtime assets are loaded in this order: `boot`, `ui`, `core`, the active
world group, and the active level group. The active level metadata selects the
last two groups; the loader does not contain level-specific conditionals.

- `core`: persistent player art and shared UI/VFX used across worlds.
- `world-XX`: art shared by levels in that world, such as backgrounds,
  platforms, enemies, collectibles, and hazards.
- `world-XX-YY`: art unique to one level, such as a special goal or mechanic.

`loadAssets()` creates a fresh merged asset view for each activation. This is
important: cached images may be reused, but absent keys from a previous level
must not remain available accidentally. A future level only needs to declare an
asset group and reference it in its level metadata.
