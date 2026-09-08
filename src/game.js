import { loadAssets, preloadWorld, spriteSheets } from "./assets.js";
import { Input } from "./input.js";
import { Player } from "./entities/player.js";
import { getLevel } from "./level-loader.js";
import { GameSession } from "./session.js";

const GAME_DURATION_SECONDS = 60;

const rectHit = (a,b) =>
  a.x < b.x+b.w && a.x+a.w > b.x &&
  a.y < b.y+b.h && a.y+a.h > b.y;

export class Game {
  constructor(canvas, {level = getLevel(), levelId = "world-1", session = new GameSession()} = {}) {
    this.canvas = canvas;
    this.level = level;
    this.levelId = levelId;
    this.session = session;
    this.ctx = canvas.getContext("2d");
    this.input = new Input();
    this.toast = document.querySelector("#toast");
    this.hud = {
      lives: document.querySelector("#hud-lives"),
      score: document.querySelector("#hud-score"),
      candy: document.querySelector("#hud-candy"),
      stars: document.querySelector("#hud-stars"),
      time: document.querySelector("#hud-time")
    };
    this.hudAnnouncement = document.querySelector("#hud-announcement");
    this.assets = null;
    this.player = null;
    this.last = 0;
    this.toastTimer = null;
    this.checkpointAnimFrame = 0;
    this.checkpointAnimTimer = 0;
    this.debug = false;
    this.respawnTimer = 0;
    this.gameOver = false;
    this.gameOverReason = "";
    this.timeRemaining = GAME_DURATION_SECONDS;
    this.paused = false;
    this.reducedMotion = globalThis.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
    this.motionQuery = globalThis.matchMedia?.("(prefers-reduced-motion: reduce)");
    this.motionQuery?.addEventListener?.("change", event => { this.reducedMotion = event.matches; });
    this.feedbackTimer = 0;
    this.padFeedback = new Map();
    this.resultMode = null;
    this.resultTimer = 0;
    this.newBest = false;
  }

  async start() {
    this.drawLoading({group:"boot", loaded:0, total:0, ratio:0});
    try {
      this.assets = await loadAssets(progress => this.drawLoading(progress));
      this.restart(true);
      this.last = performance.now();
      requestAnimationFrame(t => this.loop(t));
    } catch (error) {
      console.error(error);
      this.drawError(error);
    }
  }

  // Future worlds can be fetched while the current game loop continues running.
  preloadWorld(worldName, onProgress) {
    return preloadWorld(worldName, onProgress);
  }

  restart(full = false) {
    if (!this.assets) return;

    // Keep lightweight engine tests and embedded callers safe when they bypass the constructor.
    this.session ??= new GameSession();

    // Invalidate any death sequence from the previous run before replacing the player.
    this.respawnPending = false;
    this.respawnTimer = 0;

    if (full) {
      this.session.reset(this.activeLevel);
      this.timeRemaining = GAME_DURATION_SECONDS;
    }

    this.elapsed = 0;
    this.completed = false;
    this.gameOver = false;
    this.gameOverReason = "";
    this.cameraX = Math.max(0, this.checkpoint.x - 250);
    this.screenShake = 0;
    this.particles = [];
    this.combo = 0;
    this.comboTimer = 0;
    this.resultMode = null;
    this.resultTimer = 0;
    this.newBest = false;
    this.updateResultOverlay();

    this.candies = this.activeLevel.candies.map(([x,y],i) => ({
      x,y,taken:false,bob:Math.random()*Math.PI*2,
      kind:["pink","lemon","mint"][i%3]
    }));
    this.stars = this.activeLevel.stars.map(s => ({...s,taken:false}));
    this.enemies = this.activeLevel.enemies.map((e,i) => ({
      ...e, alive:true, dir:i%2? -1:1, w:54, h:48
    }));
    this.movingPlatforms = this.activeLevel.movingPlatforms.map(m => ({...m,dir:1}));
    this.checkpointActive = this.checkpoint.x !== this.activeLevel.spawn.x;
    this.checkpointAnimFrame = this.checkpointActive ? 5 : 0;
    this.checkpointAnimTimer = 0;

    this.player = new Player(this.checkpoint.x, this.checkpoint.y, this.assets);
    this.updateHUD();
    this.showToast("Find all 3 stars and reach the Candy Gate!");
  }

  // The engine can start a different data-only level without changing gameplay code.
  setLevel(level, levelId = "custom") {
    if (!level) throw new TypeError("setLevel requires a level definition");
    this.level = level;
    this.levelId = levelId;
    this.restart(true);
  }

  get score() { return this.session.score; }
  set score(value) { this.session.score = value; }
  get lives() { return this.session.lives; }
  set lives(value) { this.session.lives = value; }
  get candyCount() { return this.session.candyCount; }
  set candyCount(value) { this.session.candyCount = value; }
  get starCount() { return this.session.starCount; }
  set starCount(value) { this.session.starCount = value; }
  get checkpoint() { return this.session.checkpoint; }
  set checkpoint(value) { this.session.checkpoint = value; }
  get activeLevel() { return this.level ?? getLevel(); }

  loop(now) {
    const dt = Math.min(0.033, Math.max(0, (now - this.last) / 1000 || 0));
    this.last = now;
    this.update(dt);
    this.draw();
    requestAnimationFrame(t => this.loop(t));
  }

  update(dt) {
    if (this.hud?.lives) this.updateHUD();
    // The input adapter polls devices here; the simulation below consumes only logical actions.
    this.input.update?.();
    if (this.input.consumePause?.()) {
      this.paused = !this.paused;
      this.updatePauseOverlay();
      this.announce(this.paused ? "Game paused." : "Game resumed.");
    }
    if (this.paused) return;
    if (this.input.consumeDebug()) this.debug = !this.debug;
    if (this.input.consumeRestart()) {
      this.restart(true);
      return;
    }

    if (!this.player || this.completed || this.gameOver) {
      this.updateParticles(dt);
      this.updateResultPresentation(dt);
      return;
    }

    // The round clock counts down from one minute during the entire active run,
    // including the short death/respawn delay. Once it reaches zero, gameplay
    // enters a terminal state and cannot continue until a full restart.
    this.elapsed += dt;
    this.timeRemaining = Math.max(0, this.timeRemaining - dt);
    if (this.timeRemaining <= 0) {
      this.endGame("TIME'S UP!");
      this.updateParticles(dt);
      return;
    }

    if (this.player.dead) {
      this.updateRespawn(dt);
      this.updateParticles(dt);
      this.updateCamera(dt);
      return;
    }

    this.comboTimer = Math.max(0, this.comboTimer - dt);
    if (this.comboTimer === 0) this.combo = 0;
    this.screenShake = Math.max(0, this.screenShake - dt * 12);
    this.feedbackTimer = Math.max(0, this.feedbackTimer - dt);
    for (const [pad, timer] of this.padFeedback) {
      if (timer <= dt) this.padFeedback.delete(pad); else this.padFeedback.set(pad, timer - dt);
    }

    this.updateMovingPlatforms(dt);
    this.updateCheckpointAnimation(dt);
    this.updatePlayer(dt);
    this.updateEnemies(dt);
    this.updateCollectibles(dt);
    this.updateHazards();
    this.updateCheckpoint();
    this.updateGoal();
    this.updateParticles(dt);
    this.updateCamera(dt);
  }

  updateMovingPlatforms(dt) {
    for (const m of this.movingPlatforms) {
      const oldX = m.x;
      m.x += m.speed * m.dir * dt;
      if (m.x < m.minX) { m.x = m.minX; m.dir = 1; }
      if (m.x + m.w > m.maxX) { m.x = m.maxX - m.w; m.dir = -1; }
      m.dx = m.x - oldX;
    }
  }

  platformRect(pl) {
    // Rendering may include frosting and decorations; physics uses only this authored box.
    const c = pl.collider;
    return {
      x: pl.x + c.offsetX,
      y: pl.y + c.offsetY,
      w: c.width,
      h: c.height
    };
  }

  updatePlayer(dt) {
    const p = this.player;
    const wasGrounded = p.onGround;
    const startX = p.x;
    const startY = p.y;

    // Player.update computes velocity and the intended displacement. Collision
    // resolution below then applies X and Y independently, which avoids corner
    // tunneling and side-snags caused by resolving both axes from one overlap.
    p.update(dt, this.input, wasGrounded);
    const fallingSpeed = Math.max(0, p.vy);
    const targetX = p.x;
    const targetY = p.y;
    p.x = startX;
    p.y = startY;
    p.onGround = false;

    // Horizontal resolution: only fully solid terrain blocks the player's sides.
    p.x = targetX;
    let current = p.colliderRect;
    const previousX = {
      x: startX + p.collider.offsetX,
      y: current.y,
      w: p.collider.width,
      h: p.collider.height
    };
    for (const pl of [...this.activeLevel.platforms, ...this.movingPlatforms]) {
      if (pl.collision !== "solid") continue;
      const surface = this.platformRect(pl);
      const verticalOverlap = current.y < surface.y + surface.h && current.y + current.h > surface.y;
      if (!verticalOverlap) continue;

      if (p.vx > 0 && previousX.x + previousX.w <= surface.x && current.x + current.w > surface.x) {
        p.x = surface.x - p.collider.offsetX - p.collider.width;
        p.vx = 0;
        current = p.colliderRect;
      } else if (p.vx < 0 && previousX.x >= surface.x + surface.w && current.x < surface.x + surface.w) {
        p.x = surface.x + surface.w - p.collider.offsetX;
        p.vx = 0;
        current = p.colliderRect;
      }
    }

    // Vertical resolution uses the already-resolved horizontal position. Pick
    // the nearest crossed surface so stacked/adjacent platforms are stable.
    const resolvedX = p.x;
    p.y = targetY;
    current = p.colliderRect;
    const previousY = {
      x: current.x,
      y: startY + p.collider.offsetY,
      w: current.w,
      h: current.h
    };

    let landing = null;
    let ceiling = null;
    if (p.vy >= 0) {
      for (const pl of [...this.activeLevel.platforms, ...this.movingPlatforms]) {
        if (!(["solid", "oneWay"].includes(pl.collision))) continue;
        const surface = this.platformRect(pl);
        const horizontalOverlap = current.x < surface.x + surface.w && current.x + current.w > surface.x;
        if (!horizontalOverlap) continue;
        const crossedTop = previousY.y + previousY.h <= surface.y && current.y + current.h >= surface.y;
        if (crossedTop && (!landing || surface.y < landing.surface.y)) landing = {pl, surface};
      }
      if (landing) {
        p.y = landing.surface.y - p.collider.offsetY - p.collider.height;
        p.vy = 0;
        p.onGround = true;
      }
    } else {
      for (const pl of [...this.activeLevel.platforms, ...this.movingPlatforms]) {
        if (pl.collision !== "solid") continue;
        const surface = this.platformRect(pl);
        const horizontalOverlap = current.x < surface.x + surface.w && current.x + current.w > surface.x;
        if (!horizontalOverlap) continue;
        const crossedBottom = previousY.y >= surface.y + surface.h && current.y <= surface.y + surface.h;
        if (crossedBottom && (!ceiling || surface.y + surface.h > ceiling.surface.y + ceiling.surface.h)) {
          ceiling = {pl, surface};
        }
      }
      if (ceiling) {
        p.y = ceiling.surface.y + ceiling.surface.h - p.collider.offsetY;
        p.vy = 0;
      }
    }

    if (landing && "dx" in landing.pl) {
      p.x += landing.pl.dx || 0;
    }
    if (landing) {
      const impact = fallingSpeed;
      p.triggerLandingFeedback(impact);
      if (!this.reducedMotion && impact > 500) this.screenShake = Math.min(.22, impact / 3000);
      this.burst(p.feetX, p.feetY, impact > 500 ? 8 : 4, "#fff0b8");
    }
    if (Math.abs(p.vx) > 280 && this.feedbackTimer <= 0) {
      this.burst(p.feetX, p.feetY, 2, "#ffd84d");
      this.feedbackTimer = .09;
    }

    // Clamp using the collider, not the decorative sprite.
    const minX = -p.collider.offsetX;
    const maxX = this.activeLevel.width - p.collider.offsetX - p.collider.width;
    p.x = Math.max(minX, Math.min(maxX, p.x));

    if (p.colliderRect.y > 800) this.killPlayer("Into the syrup!");
  }

  updateEnemies(dt) {
    const p = this.player;
    const pr = p.colliderRect;

    for (const e of this.enemies) {
      if (!e.alive) continue;
      e.x += e.speed * e.dir * dt;
      if (e.x < e.minX) { e.x = e.minX; e.dir = 1; }
      if (e.x > e.maxX) { e.x = e.maxX; e.dir = -1; }

      if (!rectHit(pr,e)) continue;

      if (p.vy > 100 && p.feetY - e.y < 30) {
        e.alive = false;
        p.vy = -430;
        this.score += 250;
        this.combo++;
        this.comboTimer = 2.2;
        this.burst(e.x+e.w/2,e.y+10,14,"#ffe36a");
        this.screenShake = 0.18;
        this.showToast(this.combo > 1 ? `Sweet stomp ×${this.combo}!` : "Sweet stomp!");
      } else {
        this.killPlayer("Candy critter collision!");
      }
    }
  }

  updateCollectibles(dt) {
    const pr = this.player.colliderRect;
    const cx = pr.x + pr.w / 2;
    const cy = pr.y + pr.h / 2;

    for (const candy of this.candies) {
      if (!this.reducedMotion) candy.bob += dt*4;
      if (!candy.taken && Math.hypot(cx-candy.x,cy-candy.y) < 48) {
        candy.taken = true;
        this.candyCount++;
        this.score += 100;
        this.burst(candy.x,candy.y,9,"#ff78b4");
      }
    }

    for (const star of this.stars) {
      if (!star.taken && Math.hypot(cx-star.x,cy-star.y) < 58) {
        star.taken = true;
        this.starCount++;
        this.score += 1000;
        this.burst(star.x,star.y,24,"#ffd84d");
        this.screenShake = 0.22;
        this.showToast(`Secret star ${this.starCount}/3!`);
      }
    }
  }

  updateHazards() {
    const p = this.player;
    const pr = p.colliderRect;

    for (const h of this.activeLevel.hazards) {
      if (rectHit(pr,h)) {
        this.killPlayer("Candy-cane spikes!");
        return;
      }
    }

    for (const b of this.activeLevel.bouncePads) {
      if (rectHit(pr,b) && p.vy >= 0) {
        p.y = b.y - p.collider.offsetY - p.collider.height;
        p.vy = -930;
        p.onGround = false;
        this.burst(b.x+b.w/2,b.y,16,"#77ddff");
        this.padFeedback.set(b, this.reducedMotion ? .08 : .24);
        this.showToast("SUPER BOUNCE!");
        break;
      }
    }
  }

  updateCheckpoint() {
    const cp = this.activeLevel.checkpoint;
    if (!this.checkpointActive &&
        Math.abs(this.player.feetX - cp.x) < 80 &&
        Math.abs(this.player.feetY - cp.y) < 160) {
      this.checkpointActive = true;
      this.checkpointAnimFrame = this.reducedMotion ? 5 : 0;
      this.checkpointAnimTimer = 0;
      this.checkpoint = {x:cp.x,y:cp.y-100};
      this.score += 500;
      this.burst(cp.x,cp.y,18,"#88efae");
      this.showToast("Checkpoint saved!");
      this.announce("Checkpoint saved. Respawn point updated.");
    }
  }

  updateCheckpointAnimation(dt) {
    if (this.reducedMotion) {
      this.checkpointAnimFrame = 5;
      return;
    }
    if (!this.checkpointActive || this.checkpointAnimFrame >= 5) return;
    this.checkpointAnimTimer += dt;
    if (this.checkpointAnimTimer >= 1 / 12) {
      this.checkpointAnimTimer -= 1 / 12;
      this.checkpointAnimFrame = Math.min(5, this.checkpointAnimFrame + 1);
    }
  }

  updateGoal() {
    const g = this.activeLevel.goal;
    if (Math.abs(this.player.feetX - g.x) >= 90 || this.player.colliderRect.y >= g.y+220) return;

    if (this.starCount < 3) {
      this.showToast(`Find ${3-this.starCount} more secret star${3-this.starCount===1?"":"s"}!`);
      return;
    }

    this.completed = true;
    this.score += Math.max(0, 3000-Math.floor(this.elapsed)*10);
    try {
      const previousBest = Number(localStorage.getItem("candy-quest-best-score") || 0);
      this.newBest = this.score > previousBest;
      if (this.newBest) localStorage.setItem("candy-quest-best-score", String(this.score));
    } catch {
      this.newBest = false;
    }
    this.burst(g.x,g.y+100,60,"#ffe26d");
    this.showToast("WORLD COMPLETE!");
    this.announce("World complete.");
    this.beginResult("complete");
  }

  killPlayer(message) {
    if (this.player.dead || this.completed || this.gameOver) return;

    this.player.dead = true;
    this.lives = Math.max(0, this.lives - 1);
    this.screenShake = 0.45;

    const pr = this.player.colliderRect;
    this.burst(pr.x+pr.w/2,pr.y+pr.h/2,20,"#ff6d9f");
    this.showToast(message);
    this.announce(message);

    if (this.lives <= 0) {
      this.respawnPending = false;
      this.respawnTimer = 0;
      this.endGame("OUT OF LIVES!");
      return;
    }

    this.respawnPending = true;
    this.respawnTimer = 0.6;
  }

  endGame(reason) {
    if (this.completed || this.gameOver) return;
    this.gameOver = true;
    this.gameOverReason = reason;
    this.respawnPending = false;
    this.respawnTimer = 0;

    if (this.player) {
      this.player.vx = 0;
      this.player.vy = 0;
    }

    this.showToast(reason);
    this.announce(reason);
    this.beginResult("game-over");
  }

  beginResult(mode) {
    this.resultMode = mode;
    this.resultTimer = 0;
    this.updateResultOverlay();
  }

  updateResultPresentation(dt) {
    if (!this.resultMode) return;
    this.resultTimer = Math.min(1.2, this.resultTimer + dt);
    this.updateResultOverlay();
  }

  updateResultOverlay() {
    const overlay = document.querySelector("#result-overlay");
    if (!overlay || !this.resultMode) {
      if (overlay) overlay.hidden = true;
      return;
    }
    overlay.hidden = false;
    overlay.querySelector("[data-result-title]").textContent = this.resultMode === "complete" ? "LEVEL COMPLETE!" : "GAME OVER";
    overlay.querySelector("[data-result-reason]").textContent = this.resultMode === "complete" ? "Sweet victory!" : this.gameOverReason;
    overlay.querySelector("[data-result-score]").textContent = String(Math.floor(this.score * Math.min(1, this.resultTimer / .7))).padStart(6, "0");
    overlay.querySelector("[data-result-candy]").textContent = String(this.candyCount);
    overlay.querySelector("[data-result-stars]").textContent = `${this.starCount}/3`;
    overlay.querySelector("[data-result-time]").textContent = this.resultMode === "complete" ? `${this.elapsed.toFixed(1)}s` : `${Math.ceil(this.timeRemaining)}s remaining`;
    overlay.querySelector("[data-result-rating]").textContent = this.resultMode === "complete" ? `${"★".repeat(Math.min(3, this.starCount))}${"☆".repeat(Math.max(0, 3 - this.starCount))}` : "Keep practicing!";
    overlay.querySelector("[data-result-best]").hidden = !this.newBest;
  }

  updateRespawn(dt) {
    if (!this.respawnPending || this.gameOver) return;
    this.respawnTimer -= dt;
    if (this.respawnTimer > 0) return;

    this.respawnPending = false;
    this.respawnTimer = 0;

    // Defensive fallback: a zero-life player must never re-enter gameplay.
    if (this.lives <= 0) {
      this.endGame("OUT OF LIVES!");
      return;
    }

    this.player.reset(this.checkpoint.x,this.checkpoint.y);
    this.cameraX = Math.max(0,this.checkpoint.x-this.canvas.width*.35);
  }

  updateCamera(dt) {
    const target = Math.max(
      0,
      Math.min(this.activeLevel.width-this.canvas.width, this.player.feetX-this.canvas.width*.36)
    );
    this.cameraX += (target-this.cameraX) * Math.min(1,dt*6);
  }

  burst(x,y,count,color) {
    this.particles ??= [];
    if (this.reducedMotion) count = Math.ceil(count * .3);
    for(let i=0;i<count;i++) {
      const a=Math.random()*Math.PI*2, speed=70+Math.random()*230;
      this.particles.push({
        x,y,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed-100,
        life:.45+Math.random()*.5,color,r:2+Math.random()*5
      });
    }
  }

  updateParticles(dt) {
    for (const p of this.particles) {
      p.life -= dt;
      p.x += p.vx*dt;
      p.y += p.vy*dt;
      p.vy += 700*dt;
    }
    this.particles = this.particles.filter(p=>p.life>0);
  }

  showToast(text) {
    if (!this.toast) return;
    this.toast.textContent = text;
    this.toast.classList.add("show");
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(()=>this.toast.classList.remove("show"),1200);
  }

  announce(text) {
    if (this.hudAnnouncement) this.hudAnnouncement.textContent = text;
  }

  updatePauseOverlay() {
    const overlay = document.querySelector("#pause-overlay");
    if (!overlay) return;
    overlay.hidden = !this.paused;
    if (this.paused) overlay.querySelector("button")?.focus();
  }

  draw() {
    const ctx=this.ctx;
    const shake=this.reducedMotion ? 0 : this.screenShake>0?(Math.random()-.5)*this.screenShake*18:0;
    ctx.save();
    ctx.translate(shake,shake*.5);
    this.drawBackground();
    this.drawWorld();
    this.drawParticles();
    if (!this.player.dead) this.player.draw(ctx,this.cameraX);
    ctx.restore();
    // Result presentation is a responsive DOM overlay; the canvas remains available for VFX.
    if (this.debug) this.drawDebug();
  }

  drawBackground() {
    const ctx=this.ctx;
    ctx.drawImage(this.assets.background,0,0,this.canvas.width,this.canvas.height);
    const haze=ctx.createLinearGradient(0,380,0,720);
    haze.addColorStop(0,"rgba(255,255,255,0)");
    haze.addColorStop(1,"rgba(255,225,242,.18)");
    ctx.fillStyle=haze;
    ctx.fillRect(0,0,this.canvas.width,this.canvas.height);
  }

  drawWorld() {
    for(const pl of this.activeLevel.platforms) this.drawCakePlatform(pl);
    for(const pl of this.movingPlatforms) this.drawMovingPlatform(pl);
    for(const h of level1.hazards) this.drawImageAsset(this.assets.hazards.spikes,h.x-this.cameraX,h.y,h.w,60);
    for(const b of level1.bouncePads) {
      const compression = this.padFeedback.get(b) || 0;
      // The second half of the timer is a gentle visual recovery from compression.
      const scaleY = compression > .12 ? .82 : compression > 0 ? .94 : 1;
      const h = 74 * scaleY;
      this.drawImageAsset(this.assets.hazards.spring,b.x-this.cameraX,b.y+74-h,b.w,h);
    }

    for(const candy of this.candies) {
      if (!candy.taken) {
        const img=this.assets.collectibles[candy.kind];
        const bob = this.reducedMotion ? 0 : Math.sin(candy.bob)*5;
        this.drawImageAsset(img,candy.x-this.cameraX-22,candy.y+bob-22,44,44);
      }
    }
    for(const star of this.stars) {
      if (!star.taken) this.drawImageAsset(this.assets.collectibles.star,star.x-this.cameraX-30,star.y-30,60,60);
    }

    for(const e of this.enemies) if(e.alive) this.drawEnemy(e);

    this.drawCheckpointFlag();
    this.drawImageAsset(
      this.assets.goals.goal,
      this.activeLevel.goal.x-this.cameraX-90,
      this.activeLevel.goal.y-35,190,250
    );
  }

  drawCheckpointFlag() {
    const img = this.assets.goals.checkpoint;
    const frameW = img.width / spriteSheets.checkpoint.frames;
    const w = 105, h = 210;
    this.drawSprite(img, this.checkpointAnimFrame * frameW, 0, frameW, img.height,
      this.activeLevel.checkpoint.x-this.cameraX-38, this.activeLevel.checkpoint.y-h, w, h,
      this.checkpointActive ? 1 : .82);
  }

  drawCakePlatform(pl) {
    const x=pl.x-this.cameraX;
    if(x+pl.w<-100||x>this.canvas.width+100)return;

    // These source rectangles deliberately begin at the *walkable visual surface*.
    // The previous atlas crops included candy/lollipop decoration above the frosting,
    // while collision started at pl.y. That made the player collide with an invisible
    // surface and appear to float above the platform. Keeping the crop's top edge and
    // collider top on the same world Y gives us a single contact-line contract.
    let source;
    if (pl.kind === "floating") {
      source = {sx:45,sy:685,sw:430,sh:155};
    } else if (pl.kind === "cookie") {
      source = {sx:540,sy:415,sw:440,sh:210};
    } else {
      source = {sx:370,sy:135,sw:760,sh:205};
    }

    this.drawTiledSprite(
      this.assets.platforms.candyAtlas,
      source,
      x,
      pl.y,
      pl.w,
      Math.min(pl.h,120)
    );
  }

  drawMovingPlatform(pl) {
    // The moving-platform crop also begins at the visible wafer deck, so its one-way
    // collision surface (pl.y) is exactly where the player's feet are rendered.
    this.drawTiledSprite(this.assets.platforms.candyAtlas,
      {sx:500,sy:690,sw:540,sh:140}, pl.x-this.cameraX, pl.y, pl.w, 48);
  }

  drawTiledSprite(img, source, x, y, width, height) {
    const tileWidth = height * source.sw / source.sh;
    for (let dx = 0; dx < width; dx += tileWidth) {
      const drawWidth = Math.min(tileWidth, width - dx);
      const sourceWidth = source.sw * drawWidth / tileWidth;
      this.drawSprite(img, source.sx, source.sy, sourceWidth, source.sh,
        x + dx, y, drawWidth, height);
    }
  }

  drawEnemy(e) {
    const key=e.type==="gummy"?"gummy":e.type==="cupcake"?"cupcake":"chocolate";
    this.drawImageAsset(this.assets.enemies[key],e.x-this.cameraX-10,e.y-25,e.w+20,e.h+30);
  }

  drawImageAsset(img,x,y,w,h,alpha=1) {
    const ctx=this.ctx;
    if(x+w<-100||x>this.canvas.width+100)return;
    ctx.save();
    ctx.globalAlpha=alpha;
    ctx.drawImage(img,x,y,w,h);
    ctx.restore();
  }

  drawSprite(img,sx,sy,sw,sh,x,y,w,h,alpha=1) {
    const ctx=this.ctx;
    if(x+w<-100||x>this.canvas.width+100)return;
    ctx.save(); ctx.globalAlpha=alpha;
    ctx.drawImage(img,sx,sy,sw,sh,x,y,w,h);
    ctx.restore();
  }

  drawDebug() {
    const ctx=this.ctx;
    ctx.save();
    ctx.lineWidth=2;
    const player = this.player.colliderRect;
    ctx.fillStyle="rgba(255,40,60,.18)";
    ctx.strokeStyle="#ff304f";
    ctx.fillRect(player.x-this.cameraX,player.y,player.w,player.h);
    ctx.strokeRect(player.x-this.cameraX,player.y,player.w,player.h);
    ctx.fillStyle="#fff200";
    ctx.beginPath();
    ctx.arc(this.player.feetX-this.cameraX,this.player.feetY,5,0,Math.PI*2);
    ctx.fill();

    for (const platform of [...this.activeLevel.platforms,...this.movingPlatforms]) {
      const c = platform.collider || {offsetX:0,offsetY:0,width:platform.w,height:platform.h};
      const x=platform.x+c.offsetX-this.cameraX, y=platform.y+c.offsetY;
      ctx.fillStyle=platform.oneWay ? "rgba(255,220,0,.2)" : "rgba(40,220,100,.2)";
      ctx.strokeStyle=platform.oneWay ? "#ffe000" : "#28dc64";
      ctx.fillRect(x,y,c.width,c.height); ctx.strokeRect(x,y,c.width,c.height);
    }
    for (const enemy of this.enemies) if (enemy.alive) {
      ctx.strokeStyle="#55c8ff";
      ctx.strokeRect(enemy.x-this.cameraX,enemy.y,enemy.w,enemy.h);
    }
    ctx.restore();
  }

  drawParticles() {
    const ctx=this.ctx;
    for(const p of this.particles) {
      ctx.globalAlpha=Math.max(0,p.life);
      ctx.fillStyle=p.color;
      ctx.beginPath();
      ctx.arc(p.x-this.cameraX,p.y,p.r,0,Math.PI*2);
      ctx.fill();
    }
    ctx.globalAlpha=1;
  }

  updateHUD() {
    if (!this.hud?.lives) return;
    const secondsLeft = Math.max(0, Math.ceil(this.timeRemaining));
    const minutes = Math.floor(secondsLeft / 60);
    const seconds = String(secondsLeft % 60).padStart(2,"0");
    this.hud.lives.textContent = String(this.lives);
    this.hud.score.textContent = String(this.score).padStart(6,"0");
    this.hud.candy.textContent = String(this.candyCount);
    this.hud.stars.textContent = `${this.starCount}/3`;
    this.hud.time.textContent = `${minutes}:${seconds}`;
  }

  drawGameOver() {
    const ctx=this.ctx;
    ctx.fillStyle="rgba(48,20,57,.76)";
    ctx.fillRect(0,0,this.canvas.width,this.canvas.height);
    ctx.textAlign="center";
    ctx.fillStyle="#fff";
    ctx.font="900 64px system-ui";
    ctx.fillText("GAME OVER",this.canvas.width/2,270);
    ctx.font="900 28px system-ui";
    ctx.fillText(this.gameOverReason || "RUN ENDED",this.canvas.width/2,320);
    ctx.font="800 22px system-ui";
    ctx.fillText(`Score ${this.score} · Candy ${this.candyCount} · Stars ${this.starCount}/3`,this.canvas.width/2,365);
    ctx.font="700 18px system-ui";
    ctx.fillText("Press R or Restart to try again",this.canvas.width/2,410);
    ctx.textAlign="left";
  }

  drawComplete() {
    const ctx=this.ctx;
    ctx.fillStyle="rgba(48,20,57,.68)";
    ctx.fillRect(0,0,this.canvas.width,this.canvas.height);
    ctx.textAlign="center";
    ctx.fillStyle="#fff";
    ctx.font="900 56px system-ui";
    ctx.fillText("CANDY KINGDOM CLEARED!",this.canvas.width/2,280);
    ctx.font="800 25px system-ui";
    ctx.fillText(`Score ${this.score} · ${this.candyCount} candy · ${this.elapsed.toFixed(1)}s`,this.canvas.width/2,330);
    ctx.font="700 18px system-ui";
    ctx.fillText("Press R or Restart to play again",this.canvas.width/2,375);
    ctx.textAlign="left";
  }

  drawLoading(progress = {}) {
    const ctx=this.ctx;
    const g=ctx.createLinearGradient(0,0,0,this.canvas.height);
    g.addColorStop(0,"#79ddff");g.addColorStop(1,"#ffc7e5");
    ctx.fillStyle=g;ctx.fillRect(0,0,this.canvas.width,this.canvas.height);
    ctx.fillStyle="#632654";
    ctx.font="900 42px system-ui";
    ctx.textAlign="center";
    ctx.fillText("Loading Candy Quest…",this.canvas.width/2,340);
    if (progress.group) {
      const percent = Math.round((progress.ratio || 0) * 100);
      ctx.font="700 18px system-ui";
      ctx.fillText(`Loading ${progress.group} · ${percent}%`,this.canvas.width/2,380);
    }
  }

  drawError(error) {
    const ctx=this.ctx;
    ctx.fillStyle="#ffe4f0";ctx.fillRect(0,0,this.canvas.width,this.canvas.height);
    ctx.fillStyle="#692b58";ctx.textAlign="center";
    ctx.font="900 36px system-ui";ctx.fillText("Could not load Candy Quest",this.canvas.width/2,300);
    ctx.font="20px system-ui";ctx.fillText("Run: npm start",this.canvas.width/2,350);
    ctx.fillText(String(error?.message||error),this.canvas.width/2,395);
  }
}
