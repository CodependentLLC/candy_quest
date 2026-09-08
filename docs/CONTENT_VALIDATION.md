# Content Validation

`src/content-validation.js` validates world metadata and level data at content
load boundaries, not every frame. It checks identifiers and world membership,
dimensions, required points, rules, star requirements, authored arrays,
collision modes, collider dimensions, moving-platform ranges, hazard collider
metadata, enemy type references, and duplicate authored IDs.

Errors include the level/world ID and field path, for example
`world-01-01.platforms[2].collider.width`. Built-in content is validated when
levels are imported, registered levels are validated by `level-loader.js`, and
`npm run validate:assets` validates the shipped content as part of the release
gate.
