# Premium Game Feel Steering

## Goal

Premium polish should reinforce gameplay state rather than cover it.

## Feedback hierarchy

### Critical
Must always be readable:
- damage
- death
- checkpoint
- game over
- level complete
- timer danger

### Reward
Should feel delightful:
- candy pickup
- star pickup
- combos
- Sugar Rush
- extra time
- victory

### Ambient
May be reduced:
- background particles
- swaying decorations
- parallax
- shine effects

## Movement feedback

Use restrained:
- landing squash
- jump anticipation
- sprinkle/dust burst
- bounce compression
- enemy stomp bump
- directional sparkle trails

None may change collider geometry.

## Collectibles

Candy:
- quick pickup burst
- immediate HUD response
- slight sound pitch variation

Stars:
- stronger burst
- distinct sound
- brief celebration
- clearly differentiated score feedback

## Sugar Rush

Recommended:
- meter fills from candy
- 5–8 second active state
- modest speed increase
- candy magnet
- score multiplier
- aura/sparkle treatment

Must not:
- invalidate collision
- permit uncontrolled tunneling
- obscure hazards
- continue after terminal state

## Timer feedback

60-second base rule remains authoritative.

Suggested escalation:
- 30 seconds: subtle reminder
- 15 seconds: stronger HUD pulse
- 10 seconds: warning cadence
- 5–1 seconds: clear countdown
- 0: terminal TIME'S UP state

## Results

Game-over and level-complete screens should freeze gameplay state while presentation animation continues.

Show:
- reason
- score
- candy
- stars
- time
- best/new-best where available
- obvious retry/continue action
