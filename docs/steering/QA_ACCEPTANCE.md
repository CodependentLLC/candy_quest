# QA & Acceptance Steering

## Definition of done

A feature is not done because:
- code compiles
- unit tests pass
- an agent says it looks correct

Interactive features require both deterministic tests and visual/gameplay verification.

## Required test layers

### Unit / logic
Test:
- timers
- state transitions
- scoring
- collider calculations
- enemy state changes
- unlock conditions

### Simulation
Test:
- jump/landing
- one-way platform crossing
- moving platform carry
- hazard contact
- enemy stomp
- checkpoint respawn
- terminal game states

### Browser smoke
Where Playwright is available:
- game boots
- assets load
- no console errors
- player can move/jump
- checkpoint can activate
- game can end
- restart works

### Visual debug review
Enable collision debug mode and inspect:
- player feet on floor
- platform collider surfaces
- spike lethal zones
- enemy stomp/body zones
- moving platform sync

## Required regressions

Protect:
- `VISUAL_GROUNDING_OFFSET = 13`
- 60-second game timer
- final-life game over
- stable player collider across animation states
- one-way platform rules
- player/frame grounding
- restart reset behavior

## Level QA checklist

Every level:
- spawn safe
- goal reachable
- no impossible gaps
- no invisible hazards
- no unavoidable enemy hit immediately after checkpoint
- timer sufficient
- moving platforms return to valid path
- all collectibles reachable if designed to be
- restart fully resets state

## Performance

Set budgets:
- bounded particles
- no per-frame image allocation
- no unbounded arrays
- no repeated image decode during gameplay
- avoid O(N²) entity checks as content counts grow

When entity counts increase materially, introduce simple spatial partitioning.
