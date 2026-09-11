# Timing Model

The active level rules define the base countdown (`timeLimitSeconds`). During
play, `timeRemaining` is the authoritative countdown: it decreases with
simulation time and reaching zero ends the run.

`elapsed` is real gameplay time spent in the run. It starts at zero on restart
and does not include bonus seconds as fake elapsed time. Each collected time
bonus is recorded in `timeBonusSeconds` and also increases `timeRemaining`, up
to the configured runtime cap.

Completion results freeze `{ finishTime, timeLeft, timeBonusSeconds }` at the
completion event. The UI labels elapsed time as **Finish Time**, countdown time
as **Time Left**, and displays bonus seconds separately. Result presentation
animation cannot change these values. Restart resets all three run-local
values. Completion score uses the elapsed finish time, so bonus seconds affect
the available play window but do not silently change score calculation.
