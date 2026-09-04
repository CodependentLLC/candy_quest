# Candy Quest — Reviewed Build

This build was produced after reviewing the previous game code and isolating the actual failures.

## Run

```bash
npm start
```

Open `http://127.0.0.1:3000`.

No npm dependencies are required.

## Test

```bash
npm test
```

## Fixed regressions

1. **Jumping was broken.** The previous game cleared `player.onGround` before the player's input/physics update. Coyote time therefore never saw the grounded state, so a normal grounded jump often could not fire.
2. **The player art was not a real 4-column spritesheet.** The generated concept sheet placed four characters with unequal spacing. Dividing the 1536px image into four equal 384px cells sliced characters at the wrong boundaries. This build detects each character by alpha-connected component, extracts it, and normalizes every frame to an identical transparent canvas.
3. **Generated art was largely unused.** Enemies, candy, spring hazards, moving platforms, checkpoint, and goal now use extracted art assets instead of placeholder geometry.
4. **Death-state updates continued.** The new loop freezes player gameplay updates during the respawn delay.
5. **Moving platforms did not carry the player.** They now apply their horizontal delta to a player standing on them.
6. **There were no regression tests.** `npm test` now checks jumping and basic level reachability.

## Controls

- A / Left Arrow
- D / Right Arrow
- W / Up Arrow / Space
- R restart
