export const GAME_STATES = Object.freeze({MAP:"map", LOADING:"loading", PLAYING:"playing", PAUSED:"paused", PLAYER_DEAD:"player-dead", GAME_OVER:"game-over", LEVEL_COMPLETE:"level-complete", TRANSITIONING:"transitioning"});
const transitions = {map:new Set(["loading","playing"]), loading:new Set(["map","playing"]), playing:new Set(["paused","player-dead","game-over","level-complete","transitioning","map"]), paused:new Set(["playing","game-over","level-complete","transitioning","map"]), "player-dead":new Set(["playing","game-over","transitioning","map"]), "game-over":new Set(["playing","transitioning","map"]), "level-complete":new Set(["playing","transitioning","map"]), transitioning:new Set(["loading","playing","map"])};
export class GameStateMachine {
  constructor(initial = GAME_STATES.LOADING) { this.state = initial; this.listeners = new Set(); }
  canTransition(next) { return next === this.state || Boolean(transitions[this.state]?.has(next)); }
  transition(next) { if (!transitions[next]) throw new Error(`Unknown game state: ${next}`); if (next === this.state) return false; if (!this.canTransition(next)) throw new Error(`Illegal game state transition: ${this.state} -> ${next}`); const previous=this.state; this.state=next; for (const listener of this.listeners) listener(next,previous); return true; }
  onTransition(listener) { this.listeners.add(listener); return () => this.listeners.delete(listener); }
}
