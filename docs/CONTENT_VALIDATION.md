# Content Validation

`src/content-validation.js` validates world metadata and level data at content
load boundaries, not every frame. It checks identifiers and world membership,
dimensions, required points, rules, star requirements, every supported authored
collection (platforms, moving platforms, hazards, enemies, stars, candies,
time bonuses, bounce pads, and mechanics), collision modes, collider dimensions,
moving-platform ranges, bounds, registry type references, and duplicate IDs.

Errors include the level/world ID and field path, for example
`world-01-01.platforms[2].collider.width`. Built-in content is validated when
levels are imported, registered levels are validated by `level-loader.js`, and
Future world nodes must be listed in `placeholderLevelIds`; arbitrary missing
world references are rejected. `npm run validate:assets` validates the shipped
content as part of the release gate, while runtime normalization is reserved
for the loader boundary rather than being part of per-frame gameplay.
