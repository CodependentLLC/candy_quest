import assert from "node:assert/strict";
import { Player } from "../src/entities/player.js";
import { level1, testLevel } from "../src/level.js";
import { getLevel, listLevels } from "../src/level-loader.js";
import { GameSession } from "../src/session.js";
import { Game } from "../src/game.js";
import { assetGroups, loadAssetGroup, spriteSheets } from "../src/assets.js";

assert.deepEqual(Object.keys(assetGroups), ["boot", "ui", "world-1", "world-2", "audio"],
  "runtime assets should be organized into named groups");
assert.equal(typeof loadAssetGroup, "function", "asset groups should be loadable independently");

// Asset failures must identify the path and retain the browser's underlying exception.
{
  const originalImage = globalThis.Image;
  class FakeImage {
    set src(value) {
      this.path = value;
      if (value.includes("constructor")) throw new TypeError("invalid image source");
    }
    async decode() { throw new SyntaxError(`decode failed for ${this.path}`); }
  }
  globalThis.Image = FakeImage;
  try {
    assetGroups["error-test"] = {broken: "./assets/missing.png"};
    await assert.rejects(
      loadAssetGroup("error-test"),
      error => error.name === "AssetLoadError" &&
        error.assetPath === "./assets/missing.png" &&
        error.message.includes("./assets/missing.png") &&
        error.cause instanceof SyntaxError
    );
    assetGroups["constructor-test"] = {broken: "./assets/constructor-failure.png"};
    await assert.rejects(
      loadAssetGroup("constructor-test"),
      error => error.assetPath === "./assets/constructor-failure.png" &&
        error.cause instanceof TypeError
    );
  } finally {
    delete assetGroups["error-test"];
    delete assetGroups["constructor-test"];
    globalThis.Image = originalImage;
  }
}

function fakeInput({left=false,right=false,jump=false,jumpPressed=false}={}) {
  let jp=jumpPressed;
  return {
    left,right,jump,
    consumeJump(){const v=jp;jp=false;return v;}
  };
}

assert.equal(getLevel("world-1"), level1, "World 1 should be supplied by the level loader");
assert.equal(getLevel("test"), testLevel, "the trivial level should use the same loader API");
assert.ok(listLevels().includes("test"), "the test level should be registered");
const session = new GameSession();
session.score = 250;
session.reset(testLevel);
assert.equal(session.score, 0, "reset should clear cross-level run state");
assert.deepEqual(session.checkpoint, testLevel.spawn, "session checkpoint should follow the selected level spawn");

// Regression: the old build cleared onGround before Player.update,
// which meant coyote time was never armed and jumping effectively failed.
{
  const p = new Player(100, 500, {playerRun:[{}, {}, {}, {}, {}, {}]});
  p.onGround = true;
  p.update(1/60, fakeInput({jump:true,jumpPressed:true}), true);
  assert.ok(p.vy < -500, "grounded jump should launch upward");
}

// Airborne player should not be able to jump without coyote time.
{
  const p = new Player(100, 300, {});
  p.onGround = false;
  p.update(1/60, fakeInput({jump:true,jumpPressed:true}), false);
  assert.ok(p.vy > -100, "airborne jump should not reset vertical velocity");
}

// Running should select the run set and advance its frames after movement physics.
{
  const p = new Player(100, 500, {playerRun:[{}, {}, {}, {}, {}, {}]});
  p.vx = 200;
  p.onGround = true;
  const firstFrame = p.animFrame;
  p.updateAnimation(1 / 11);
  assert.equal(p.animation, "run");
  assert.notEqual(p.animFrame, firstFrame, "run animation should advance while moving");
}

// Main progression gaps must fit inside a conservative jump envelope.
{
  const ground = level1.platforms.filter(p => p.h >= 80).sort((a,b)=>a.x-b.x);
  const maxGap = 330;
  for (let i=0;i<ground.length-1;i++) {
    const gap = ground[i+1].x - (ground[i].x + ground[i].w);
    assert.ok(gap <= maxGap, `gap ${i} too large: ${gap}`);
  }
}

// Required star content exists and goal lies inside level.
assert.equal(level1.stars.length, 3);
assert.ok(level1.goal.x < level1.width);
assert.equal(spriteSheets.playerRun.frames, 6);
assert.equal(spriteSheets.checkpoint.frames, 6);
for (const platform of [...level1.platforms, ...level1.movingPlatforms]) {
  assert.ok(platform.collider, "platform collider must be explicit");
  assert.equal(platform.collider.width, platform.w);
  assert.equal(platform.collider.height, platform.h);
}
assert.ok(level1.platforms.filter(platform => platform.solid).length >= 10,
  "all ground platforms must participate in solid collision");
assert.ok(level1.platforms.filter(platform => platform.oneWay).length > 0,
  "floating platforms must remain one-way");
assert.ok(level1.platforms.every(platform => ["solid", "oneWay"].includes(platform.collision)),
  "platforms must declare a collision type");
assert.ok(level1.hazards.every(hazard => hazard.collision === "hazard"),
  "hazards must declare hazard collision type");

// Solid terrain must stop upward movement at its underside.
{
  const game = Object.create(Game.prototype);
  game.player = new Player(200, 730, {});
  game.player.vx = 0; game.player.vy = -500; game.player.onGround = false;
  game.input = {left:false,right:false,jump:false,consumeJump(){return false;}};
  game.movingPlatforms = [];
  game.updatePlayer(1 / 30);
  assert.equal(game.player.colliderRect.y, 720,
    "solid underside should stop the player at the platform bottom");
  assert.equal(game.player.vy, 0);
}

// One-way terrain must catch a descending player from above.
{
  const platform = level1.platforms.find(item => item.collision === "oneWay");
  const game = Object.create(Game.prototype);
  game.player = new Player(platform.x + 40, platform.y - 80, {});
  game.player.vx = 0; game.player.vy = 200; game.player.onGround = false;
  game.input = {left:false,right:false,jump:false,consumeJump(){return false;}};
  game.movingPlatforms = [];
  game.updatePlayer(1 / 30);
  assert.equal(game.player.colliderRect.y + game.player.colliderRect.h, platform.y,
    "one-way platform should catch the player from above");
  assert.equal(game.player.onGround, true);
}

// The live resolver must land against the authored collider, not artwork dimensions.
{
  const game = Object.create(Game.prototype);
  game.player = new Player(200, 527, {});
  game.player.onGround = false;
  game.input = {left:false,right:false,jump:false,consumeJump(){return false;}};
  game.movingPlatforms = [];
  game.updatePlayer(1 / 30);
  assert.equal(game.player.y + game.player.h, level1.platforms[0].collider.offsetY + level1.platforms[0].y,
    "player collider bottom should equal platform collider top after landing");
  assert.equal(game.player.onGround, true);
}

// A delayed respawn must not mutate a run created by manual restart.
{
  globalThis.document = { querySelector(){ return null; } };
  const canvas = {
    width: 1280,
    height: 720,
    getContext(){ return {}; }
  };
  const game = Object.create(Game.prototype);
  game.canvas = canvas;
  game.assets = {};
  game.toast = null;
  game.toastTimer = null;
  game.input = {
    consumeRestart(){ return false; },
    consumeJump(){ return false; },
    left:false,
    right:false,
    jump:false
  };
  game.restart(true);

  game.killPlayer("test death");
  assert.equal(game.respawnPending, true);
  game.restart(true);
  const spawn = {x: game.player.x, y: game.player.y};

  game.updateRespawn(0.7);
  assert.equal(game.respawnPending, false);
  assert.deepEqual({x: game.player.x, y: game.player.y}, spawn,
    "old respawn must not move the restarted player");
  assert.equal(game.cameraX, Math.max(0, level1.spawn.x - 250),
    "manual restart should reset camera to the new-run spawn");
}

console.log("Smoke tests passed.");

// Runtime player frames must all use the same normalized canvas size so idle/run
// cannot change apparent scale merely because source assets differ.
{
  const { readFile } = await import("node:fs/promises");
  const { fileURLToPath } = await import("node:url");
  const { dirname, resolve } = await import("node:path");
  const here = dirname(fileURLToPath(import.meta.url));
  const frameFiles = [
    ...Array.from({length:4},(_,i)=>`idle-${i}.png`),
    ...Array.from({length:6},(_,i)=>`run-${i}.png`),
    ...Array.from({length:4},(_,i)=>`jumpfall-${i}.png`)
  ];
  for (const name of frameFiles) {
    const buf = await readFile(resolve(here, "../assets/player/frames", name));
    assert.equal(buf.toString("ascii", 1, 4), "PNG", `${name} must be a PNG`);
    assert.equal(buf.readUInt32BE(16), 384, `${name} width must be normalized`);
    assert.equal(buf.readUInt32BE(20), 384, `${name} height must be normalized`);
  }
}

// Solid terrain must stop horizontal motion at the collider edge.
{
  const game = Object.create(Game.prototype);
  game.player = new Player(770, 520, {});
  game.player.vx = 365;
  game.player.vy = 0;
  game.player.onGround = false;
  game.input = {left:false,right:true,jump:false,consumeJump(){return false;}};
  game.movingPlatforms = [];
  game.updatePlayer(1 / 30);
  const nextSolid = level1.platforms.find(pl => pl.x === 830);
  assert.ok(game.player.colliderRect.x + game.player.colliderRect.w <= nextSolid.x + 0.001,
    "solid platform side should stop the player before overlap");
}

// One-way platforms must allow the player to rise through them from below.
{
  const floating = level1.platforms.find(pl => pl.oneWay);
  const game = Object.create(Game.prototype);
  game.player = new Player(floating.x + 40, floating.y + 40, {});
  game.player.vx = 0;
  game.player.vy = -500;
  game.player.onGround = false;
  game.input = {left:false,right:false,jump:true,consumeJump(){return false;}};
  game.movingPlatforms = [];
  const beforeY = game.player.y;
  game.updatePlayer(1 / 30);
  assert.ok(game.player.y < beforeY, "one-way platform should not block upward movement");
}

// Player collision geometry must not depend on animation state.
{
  const p = new Player(100, 100, {playerIdle:[1,2,3,4],playerRun:[1,2,3,4,5,6],playerJumpFall:[1,2,3,4]});
  const base = {...p.colliderRect};
  p.vx = 200; p.onGround = true;
  p.updateAnimation(1/11);
  assert.deepEqual(p.colliderRect, base, "run animation must not change collider geometry");
  p.vy = -300; p.onGround = false;
  p.updateAnimation(1/7);
  assert.deepEqual(p.colliderRect, base, "jump animation must not change collider geometry");
}

// Full restart must begin a fresh one-minute round.
{
  globalThis.document = globalThis.document || { querySelector(){ return null; } };
  const game = Object.create(Game.prototype);
  game.canvas = { width:1280, height:720 };
  game.assets = {};
  game.toast = null;
  game.toastTimer = null;
  game.input = {
    consumeRestart(){ return false; },
    consumeDebug(){ return false; },
    consumeJump(){ return false; },
    left:false, right:false, jump:false
  };
  game.restart(true);
  assert.equal(game.timeRemaining, 60, "full restart should reset timer to 60 seconds");
  assert.equal(game.lives, 3, "full restart should reset lives");
  assert.equal(game.gameOver, false, "full restart should clear game-over state");
}

// Running out of time must freeze gameplay in a terminal game-over state.
{
  const game = Object.create(Game.prototype);
  game.canvas = { width:1280, height:720 };
  game.assets = {};
  game.toast = null;
  game.toastTimer = null;
  game.input = {
    consumeRestart(){ return false; },
    consumeDebug(){ return false; },
    consumeJump(){ return false; },
    left:false, right:false, jump:false
  };
  game.restart(true);
  const startX = game.player.x;
  game.player.vx = 300;
  game.timeRemaining = 0.01;
  game.update(0.02);
  assert.equal(game.timeRemaining, 0);
  assert.equal(game.gameOver, true);
  assert.equal(game.gameOverReason, "TIME'S UP!");
  assert.equal(game.player.x, startX, "player should not continue moving after time expires");

  const frozenTime = game.timeRemaining;
  game.update(1);
  assert.equal(game.timeRemaining, frozenTime, "terminal game-over state should freeze the round timer");
}

// Losing the final life must end the run and must not schedule a respawn/restart.
{
  const game = Object.create(Game.prototype);
  game.canvas = { width:1280, height:720 };
  game.assets = {};
  game.toast = null;
  game.toastTimer = null;
  game.input = {
    consumeRestart(){ return false; },
    consumeDebug(){ return false; },
    consumeJump(){ return false; },
    left:false, right:false, jump:false
  };
  game.restart(true);
  game.lives = 1;
  game.killPlayer("test final death");
  assert.equal(game.lives, 0);
  assert.equal(game.gameOver, true);
  assert.equal(game.gameOverReason, "OUT OF LIVES!");
  assert.equal(game.respawnPending, false, "final death must not schedule a respawn");

  game.updateRespawn(10);
  assert.equal(game.lives, 0, "respawn update must not restart a zero-life game");
  assert.equal(game.gameOver, true);
}

// User-validated sprite grounding offset is a protected visual contract.
{
  const { readFile } = await import("node:fs/promises");
  const { fileURLToPath } = await import("node:url");
  const { dirname, resolve } = await import("node:path");
  const here = dirname(fileURLToPath(import.meta.url));
  const source = await readFile(resolve(here, "../src/entities/player.js"), "utf8");
  assert.match(source, /const VISUAL_GROUNDING_OFFSET = 13;/,
    "VISUAL_GROUNDING_OFFSET must remain exactly 13");
}
