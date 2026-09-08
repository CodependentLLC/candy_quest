// State that survives level changes belongs to the session, not to a level definition.
export class GameSession {
  constructor({lives = 3} = {}) {
    this.defaultLives = lives;
    this.reset({spawn: {x: 0, y: 0}});
  }

  reset(level) {
    this.score = 0;
    this.lives = this.defaultLives;
    this.candyCount = 0;
    this.starCount = 0;
    this.checkpoint = {...level.spawn};
  }
}
