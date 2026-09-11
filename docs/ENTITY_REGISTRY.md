# Entity Registry

Level data selects reusable definitions with `typeId`; it does not contain
callbacks. `EntityRegistry.register(id, definition)` rejects duplicate IDs and
requires `create`, `update`, `render`, `getCollider`, `reset`, and `teardown`.
Unknown IDs throw during level loading with the level and type ID in the error.

Definitions receive configuration and a context from the engine. Rendering is
delegated through the registry, while `getCollider` remains the authoritative
physics shape. `reset` and `teardown` are lifecycle hooks for future entities.
Enemy walkers and bounce pads are migrated categories. `mechanicRegistry` uses
the same contract, so adding a mechanic requires a registration and level data,
not a level-specific branch in `Game`. `Game.restart()` resets newly-created
instances and tears down the previous instances before replacement; `dispose()`
tears down the active set when the game is shut down.

Level validation checks each registered category (`enemies`, `mechanics`, and
`bouncePads`) and reports the level ID, category field, and unknown type ID.
`typeId` is the canonical authored field; legacy `type` remains only as a
temporary read fallback for migration content.
