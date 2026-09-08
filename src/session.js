import {ProfileStore} from "./save-data.js";

// Profile is durable progression; worldProgress is campaign position; levelRun
// is disposable state for one attempt and is never used as saved progression.
export class GameSession {
  constructor({lives=3,store=new ProfileStore()}={}) { this.defaultLives=lives; this.store=store; this.profile=store.load(); this.worldProgress={worldId:"world-01",currentLevelId:"world-01-01"}; this.levelRun={}; this.reset({id:"world-01-01",spawn:{x:0,y:0}}); }
  reset(level) { this.worldProgress.currentLevelId=level.id||this.worldProgress.currentLevelId; this.levelRun={levelId:this.worldProgress.currentLevelId,score:0,lives:level.rules?.startingLives??this.defaultLives,candyCount:0,starCount:0,checkpoint:{...level.spawn},timeRemaining:level.rules?.timeLimitSeconds??60}; }
  newGame(level) { this.profile=this.store.load(); this.worldProgress={worldId:level.worldId||"world-01",currentLevelId:level.id}; this.reset(level); }
  get score(){return this.levelRun.score;} set score(value){this.levelRun.score=value;}
  get lives(){return this.levelRun.lives;} set lives(value){this.levelRun.lives=value;}
  get candyCount(){return this.levelRun.candyCount;} set candyCount(value){this.levelRun.candyCount=value;}
  get starCount(){return this.levelRun.starCount;} set starCount(value){this.levelRun.starCount=value;}
  get checkpoint(){return this.levelRun.checkpoint;} set checkpoint(value){this.levelRun.checkpoint=value;}
  completeLevel(levelId,stars,score,time) { const old=this.profile.levels[levelId]||{stars:0,bestScore:0,bestTime:null,completed:false,unlocked:true}; this.profile.levels[levelId]={stars:Math.max(old.stars,Math.min(3,stars)),bestScore:Math.max(old.bestScore,score),bestTime:old.bestTime===null?time:Math.min(old.bestTime,time),completed:true,unlocked:true}; this.profile.lifetimeStars=Object.values(this.profile.levels).reduce((sum,item)=>sum+item.stars,0); this.store.save(this.profile); }
}
