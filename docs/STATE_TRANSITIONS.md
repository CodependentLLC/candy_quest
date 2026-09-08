# Application and Gameplay States

`src/state-machine.js` is the single transition policy for the runtime:

```text
loading -> playing -> paused -> playing
playing -> player-dead -> playing
playing -> game-over -> playing (retry)
playing -> level-complete -> playing (retry) or map
playing -> transitioning -> loading/playing/map
map -> loading/playing
```

`Game.update()` advances player, timer, collision, entities, and collectibles
only in `playing` or the respawn-specific `player-dead` state. Game-over and
level-complete states update only presentation effects. `restart`, `retryLevel`,
and `backToMap` clear respawn and transient presentation state before changing
the active flow. Duplicate transitions are no-ops; illegal transitions are
rejected by the state machine.
