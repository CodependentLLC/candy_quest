# Candy Quest code / physics / asset audit

## Fixed

- Replaced the runtime player frames with the normalized 384x384 frame set. The previous runtime folder contained idle/jump frames around full character height while run frames had much smaller visible bounds, which made the character visibly shrink when running.
- Player rendering now uses one render size for idle/run/jump/fall and anchors the sprite to the normalized feet baseline (y=360 of a 384px frame) rather than the bottom of transparent padding.
- Player feet and collision accessors are derived from `colliderRect` so future collider offsets remain coherent.
- Animation state now resets its frame/timer when changing states and advances with a bounded while-loop. Runtime frame count comes from loaded arrays.
- Reworked platform collision resolution to resolve horizontal and vertical movement independently. Solid platforms block sides/undersides; one-way platforms only catch descending players from above.
- Collision clamping now uses the player collider rather than decorative sprite dimensions.
- Enemy, hazard, collectible, checkpoint, goal, and death-center calculations now use the player collider/feet instead of parallel x/y/w/h assumptions where appropriate.
- Moving-platform art top now aligns with the moving-platform collider top instead of being drawn 20px above it.
- Spike and bounce-pad artwork now begins at the authored collision surface instead of being drawn substantially above the collider.
- Window blur clears held input so alt-tab/focus loss cannot leave movement stuck.
- Static server now returns HTTP 400 for malformed URL escapes instead of falling into a 500.

## Tests performed

- `npm test` passes after the changes.
- Added regression coverage for normalized 384x384 player frame dimensions, solid side collision, one-way upward passage, and collider stability across animation states.
- Existing tests cover jump/coyote behavior, landing alignment, platform metadata, level gaps, checkpoint/goal frame metadata, and respawn/restart race behavior.
- Verified every path referenced by `src/assets.js` exists in the extracted project.
- Verified malformed encoded URL returns 400 and normal root request returns 200 using the Node server.

## Browser preview limitation

A headless Chromium binary exists in the execution environment, but navigation to localhost and file URLs is administratively blocked, so an actual browser screenshot/playthrough could not be executed here. The ZIP remains runnable with `npm start` in a normal local environment.

## Recommended manual verification

Run the game, press F2 to enable collision debug view, then verify the player feet marker sits on platform collider tops; test walking against solid sides, jumping through floating one-way platforms, landing on them, riding both moving platforms, bounce pads, spikes, enemy stomps, checkpoint respawn, and full restart.

## Platform contact-line correction

A follow-up visual review showed that player physics were correct but the platform atlas crops were not authored from the walkable surface. The old cake crop began above the frosting and included tall candy/lollipop decoration. Because platform collision begins at `platform.y`, the player could land on the collider while still appearing visibly above the frosting.

The platform renderer now uses source rectangles whose **top edge is the intended walkable visual surface**:

- cake/final terrain: atlas `(370,135,760,205)`
- cookie terrain: atlas `(540,415,440,210)`
- floating cake: atlas `(45,685,430,155)`
- moving wafer: atlas `(500,690,540,140)`

The render Y and collider top now share the same world coordinate (`platform.y`). This preserves simple rectangular physics while making the player's normalized feet baseline meet the visible platform surface.

## Visible foot-contact correction

The physics body was already touching the platform surface, but the normalized player
frames contained a few transparent pixels between the lowest visible shoe pixel and the
logical y=360 feet baseline. At the game's 126px render size this produced a visible
roughly 1–2px gap.

Each active idle, run, and jump/fall frame has now been shifted inside its existing
384×384 transparent canvas until the lowest visible shoe pixel lands exactly on y=360.
No collider, player world position, platform position, or collision resolver values were
changed.

## Runtime grounding correction

The previous asset-only adjustment moved the character by only 1 pixel on a 384px source
canvas. Because the game renders that canvas at 126px, the visible change was only about
0.33 screen pixels and was effectively imperceptible.

The player renderer now applies a deliberate `VISUAL_GROUNDING_OFFSET = 3` rendered pixels.
This moves only the artwork downward by 3 screen pixels. The player collider, feet world
position, platform collider, and collision resolution are unchanged.

## Lives and one-minute game-over rules

The round now has two terminal failure conditions:

- Lives start at 3. Losing the final life sets `gameOver = true`; the game no longer auto-restarts or respawns.
- Time starts at 60 seconds. The HUD counts down from `TIME 1:00`; reaching zero sets `gameOver = true`.

While game over is active, player/enemy/world simulation no longer advances. Particles may finish visually, and the player can start a new round only with `R` or the Restart button.

The user-validated `VISUAL_GROUNDING_OFFSET = 13` is preserved exactly.
