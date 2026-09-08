# Entity Registry

Level data selects reusable definitions with `typeId`; it does not contain
callbacks. `EntityRegistry.register(id, definition)` rejects duplicate IDs and
requires `create`, `update`, `render`, `getCollider`, `reset`, and `teardown`.
Unknown IDs throw during level loading with the level and type ID in the error.

Definitions receive configuration and a context from the engine. Rendering is
delegated through the registry, while `getCollider` remains the authoritative
physics shape. `reset` and `teardown` are lifecycle hooks for future entities.
Enemy walkers are the first migrated category; adding another enemy requires a
registration and level data, not a level-specific branch in `Game`.
