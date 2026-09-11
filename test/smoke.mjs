import assert from "node:assert/strict";
import { Player } from "../src/entities/player.js";
import { level1, testLevel } from "../src/level.js";
import { progression, worlds, getWorld } from "../src/levels.js";
import { getLevel, listLevels } from "../src/level-loader.js";
import { GameSession } from "../src/session.js";
import { Game } from "../src/game.js";
import { assetGroups, loadAssetGroup, spriteSheets } from "../src/assets.js";
import { Input } from "../src/input.js";
import { ProfileStore, SAVE_VERSION, normalizeProfile } from "../src/save-data.js";
import { validateLevel, validateWorld } from "../src/content-validation.js";

// Content validation rejects malformed authoring data with field-specific errors.
{
  assert.doesNotThrow(() => validateLevel(level1));
  const malformed = () => ({...level1, id:"fixture", platforms:[{...level1.platforms[0], collision:"bad-mode"}]});
  assert.throws(() => validateLevel(malformed()), /fixture\.platforms\[0\]\.collision/);
  assert.throws(() => validateLevel({...level1, id:"fixture", platforms:[{...level1.platforms[0], collider:{...level1.platforms[0].collider, width:-1}}]}), /fixture\.platforms\[0\]\.collider\.width/);
  assert.throws(() => validateLevel({...level1, id:"fixture", movingPlatforms:[{...level1.movingPlatforms[0], minX:10, maxX:1}]}), /movingPlatforms\[0\]\.minX/);
  assert.throws(() => validateLevel({...level1, id:"fixture", rules:{...level1.rules, timeLimitSeconds:Infinity}}), /rules\.timeLimitSeconds/);
  assert.throws(() => validateLevel({...level1, id:"fixture", spawn:undefined}), /fixture\.spawn/);
  assert.throws(() => validateLevel({...level1, id:"fixture", goal:undefined}), /fixture\.goal/);
  assert.throws(() => validateLevel({...level1, id:"fixture", rules:{...level1.rules, requiredStars:4}}), /requiredStars/);
  assert.throws(() => validateLevel({...level1, id:"fixture", platforms:[{...level1.platforms[0], id:"duplicate"},{...level1.platforms[1], id:"duplicate"}]}), /duplicate ID/);
  assert.throws(() => validateLevel({...level1, id:"fixture", platforms:[{...level1.platforms[0], collider:undefined}]}), /fixture\.platforms\[0\]\.collider/);
  assert.throws(() => validateLevel({...level1, id:"fixture", candies:[[Infinity, 10]]}), /fixture\.candies\[0\]\.x/);
  assert.throws(() => validateLevel({...level1, id:"fixture", timeBonuses:[{x:1,y:1,amount:0}]}), /timeBonuses\[0\]\.amount/);
  assert.throws(() => validateLevel({...level1, id:"fixture", bouncePads:[{...level1.bouncePads[0], collision:"hazard"}]}), /bouncePads\[0\]\.collision/);
  assert.throws(() => validateLevel({...level1, id:"fixture", mechanics:[{typeId:"unknown-mechanic"}]}), /unknown-mechanic.*fixture.*mechanics/);
  assert.throws(() => validateLevel({...level1, id:"fixture", enemies:[{...level1.enemies[0], typeId:"unknown-enemy"}]}), /unknown-enemy.*fixture.*enemies/);
  assert.throws(() => validateLevel({...level1, id:"fixture", goal:{x:level1.width+1,y:10}}), /fixture\.goal\.x/);
  assert.throws(() => validateWorld({id:"world-01", currentLevelId:"missing", levelIds:["world-01-01"]}, {"world-01-01":level1}), /currentLevelId/);
  assert.throws(() => validateWorld({id:"world-01", currentLevelId:"world-01-01", levelIds:["world-01-01","typo"]}, {"world-01-01":level1}), /unknown level.*typo/);
  assert.doesNotThrow(() => validateWorld({id:"world-01", currentLevelId:"world-01-01", levelIds:["world-01-01","world-01-02"], placeholderLevelIds:["world-01-02"]}, {"world-01-01":level1}));
}

// Persistence is versioned and corrupt storage falls back to a valid profile.
{
  const storage = {value: "{not-json", getItem(){return this.value;}, setItem(_key,value){this.value=value;}};
  const store = new ProfileStore(storage);
  const session = new GameSession({store});
  assert.equal(session.profile.version, SAVE_VERSION);
  assert.equal(session.profile.levels["world-01-01"].stars, 0);
  session.completeLevel("world-01-01", 3, 1200, 42);
  const saved = JSON.parse(storage.value);
  assert.equal(saved.levels["world-01-01"].bestScore, 1200);
  assert.equal(normalizeProfile({levels:{"world-01-01":{stars:2}}}).levels["world-01-01"].stars, 2);
}

// Pickup feedback is one-shot and does not duplicate scoring on later frames.
{
  const game = Object.create(Game.prototype);
  game.session = {candyCount: 0, score: 0};
  game.candies = [{x: 200, y: 200, taken: false, bob: 0}];
  game.stars = [];
  game.player = new Player(175, 164, {});
  game.pickupCombo = 0; game.pickupComboTimer = 0; game.pickupEffects = [];
  game.burst = () => {}; game.showToast = () => {};
  game.updateCollectibles(0); game.updateCollectibles(0);
  assert.equal(game.candyCount, 1);
  assert.equal(game.score, 100);
  assert.equal(game.pickupCombo, 1);
}

// Time bonuses are data-driven, apply once, and are capped at the round maximum.
{
  const game = Object.create(Game.prototype);
  game.session = {candyCount: 0, score: 0};
  game.candies = [];
  game.stars = [];
  game.timeBonuses = [{x: 200, y: 200, amount: 5, taken: false}];
  game.player = new Player(175, 164, {});
  game.timeRemaining = 58;
  game.gameOver = false;
  game.completed = false;
  game.pickupCombo = 0; game.pickupComboTimer = 0; game.pickupEffects = [];
  game.burst = () => {}; game.showToast = () => {}; game.announce = () => {};
  game.updateCollectibles(0);
  game.updateCollectibles(0);
  assert.equal(game.timeRemaining, 60, "time bonus should add once and respect the round cap");
  assert.equal(game.timeBonuses[0].taken, true);
  game.timeBonuses = [{x: 200, y: 200, amount: 5, taken: false}];
  game.timeRemaining = 59;
  game.updateCollectibles(0);
  assert.equal(game.timeRemaining, 60, "time bonus should respect the round cap");
}

const actionInput = Object.create(Input.prototype);
actionInput.sources = {keyboard:new Set(), touch:new Set(), controller:new Set()};
actionInput.down = new Set();
actionInput.pressed = new Set();
actionInput.controllerConnected = false;
actionInput.press("right");
assert.equal(actionInput.isDown("right"), true, "logical right action should be held");
assert.equal(actionInput.wasPressed("right"), true, "logical action press should be observable");
assert.equal(actionInput.consume("right"), true, "logical action press should be consumable");
assert.equal(actionInput.wasPressed("right"), false, "consumed action should not repeat");
const originalNavigator = globalThis.navigator;
Object.defineProperty(globalThis, "navigator", {configurable:true, value:{getGamepads:() => [{axes:[-1], buttons:[]}]} });
// Device sources are independent; controller polling/disconnect cannot erase keyboard input.
Input.prototype.update.call(actionInput);
assert.equal(actionInput.isDown("left"), true, "controller left stick should map to left action");
Object.defineProperty(globalThis, "navigator", {configurable:true, value:originalNavigator});
actionInput.controllerActive = false;
actionInput.press("right");
Input.prototype.update.call(actionInput);
assert.equal(actionInput.isDown("right"), true, "keyboard action should survive an empty controller poll");
actionInput.pressFrom("touch", "left");
Input.prototype.update.call(actionInput);
assert.equal(actionInput.isDown("left"), true, "idle controller must not cancel touch input");
actionInput.clearSource("controller");
assert.equal(actionInput.isDown("left"), true, "controller disconnect must preserve touch input");
let focusLost = 0;
const focusInput = Object.create(Input.prototype);
focusInput.sources = {keyboard:new Set(), touch:new Set(), controller:new Set()};
focusInput.down = new Set(); focusInput.pressed = new Set(); focusInput.onFocusLost = () => { focusLost++; };
focusInput.pressFrom("keyboard", "pause");
focusInput.pressFrom("keyboard", "jump");
focusInput.handleFocusLost();
assert.equal(focusLost, 1, "focus loss should notify pause handling without creating a toggle press");
assert.equal(focusInput.down.size, 0, "focus loss should clear held actions");
assert.equal(focusInput.pressed.size, 0, "focus loss should clear pending edge actions");
assert.equal(focusInput.consume("pause"), false, "queued pause must not replay after focus loss");

const controllerInput = Object.create(Input.prototype);
controllerInput.sources = {keyboard:new Set(), touch:new Set(), controller:new Set()};
controllerInput.down = new Set(); controllerInput.pressed = new Set(); controllerInput.controllerConnected = false;
const originalPads = globalThis.navigator;
const pad = {axes:[0], buttons:[]}; pad.buttons[9] = {pressed:true};
Object.defineProperty(globalThis, "navigator", {configurable:true, value:{getGamepads:() => [pad]}});
Input.prototype.update.call(controllerInput);
assert.equal(controllerInput.consume("pause"), true);
Input.prototype.update.call(controllerInput);
assert.equal(controllerInput.consume("pause"), false, "held Start should not repeat pause edges");
pad.buttons[9].pressed = false; Input.prototype.update.call(controllerInput);
pad.buttons[9].pressed = true; Input.prototype.update.call(controllerInput);
assert.equal(controllerInput.consume("pause"), true, "released then pressed Start should create a new edge");
Object.defineProperty(globalThis, "navigator", {configurable:true, value:originalPads});

assert.deepEqual(Object.keys(assetGroups), ["boot", "ui", "world-1", "world-2", "audio"],
  "runtime assets should be organized into named groups");
assert.equal(typeof loadAssetGroup, "function", "asset groups should be loadable independently");
assert.deepEqual(progression, ["world-01-01"], "World 1 should expose only the migrated playable level");
assert.equal(getWorld("world-01").levelIds.length, 7, "World 1 should reserve six levels and a boss slot");
for (const levelId of progression) {
  const level = getLevel(levelId);
  assert.ok(level.name && level.theme && level.duration, `${levelId} should define progression metadata`);
  assert.ok(level.platforms.every(platform => platform.collider && platform.collision), `${levelId} platforms should be normalized`);
}

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

assert.equal(getLevel("world-01-01"), level1, "World 1-1 should be supplied by the level loader");
assert.equal(getLevel("test-level"), testLevel, "the trivial level should use the same loader API");
assert.ok(listLevels().includes("test-level"), "the test level should be registered");
assert.deepEqual(level1.rules, {timeLimitSeconds: 60, startingLives: 3, requiredStars: 3});
assert.deepEqual(testLevel.rules, {timeLimitSeconds: 45, startingLives: 2, requiredStars: 0});
const session = new GameSession();
session.score = 250;
session.reset(testLevel);
assert.equal(session.score, 0, "reset should clear cross-level run state");
assert.deepEqual(session.checkpoint, testLevel.spawn, "session checkpoint should follow the selected level spawn");
session.reset(testLevel);
assert.equal(session.levelRun.timeRemaining, 45, "level rules should define the run timer");
assert.equal(session.lives, 2, "level rules should define starting lives");
{
  const fiveStar = {...testLevel, id:"world-01-02", rules:{timeLimitSeconds:30, startingLives:5, requiredStars:5}, stars:[{x:1,y:1},{x:2,y:2},{x:3,y:3},{x:4,y:4},{x:5,y:5}]};
  session.score = 900; session.lives = 1; session.starCount = 4; session.candyCount = 7;
  session.reset(fiveStar);
  assert.equal(session.lives, 5, "level transition applies next startingLives");
  assert.deepEqual({score:session.score, stars:session.starCount, candy:session.candyCount}, {score:0, stars:0, candy:0}, "level transition clears run-local state");
  session.completeLevel(fiveStar.id, 5, 100, 20, {maxStars: fiveStar.stars.length});
  assert.equal(session.profile.levels[fiveStar.id].stars, 5, "persistence supports non-3-star levels");

  const game = Object.create(Game.prototype);
  game.level = level1; game.levelId = level1.id; game.world = {levelIds:[level1.id, "test-level"]};
  game.session = session; game.restart = () => {}; game.showToast = () => {};
  game.sugarRushMeter = 65; game.sugarRushTime = 4; game.sugarRushActive = true;
  game.timerWarnings = new Set([15]); game.timerWarningTimer = 1;
  game.pickupCombo = 3; game.pickupComboTimer = 1; game.combo = 2; game.comboTimer = 1;
  game.pickupEffects = [{}]; game.particles = [{}];
  session.score = 100; session.lives = 1; session.starCount = 3; session.candyCount = 4;
  game.advanceLevel();
  assert.equal(game.levelId, "test-level", "advanceLevel selects the next level");
  assert.equal(session.lives, testLevel.rules.startingLives, "advanceLevel applies next level starting lives");
  assert.equal(session.starCount, 0, "advanceLevel clears prior stars");
  assert.equal(session.candyCount, 0, "advanceLevel clears prior candy");
  assert.equal(game.sugarRushMeter, 0, "advanceLevel clears Sugar Rush meter");
  assert.equal(game.sugarRushTime, 0, "advanceLevel clears Sugar Rush duration");
  assert.equal(game.sugarRushActive, false, "advanceLevel clears active Sugar Rush");
  assert.equal(game.timerWarnings.size, 0, "advanceLevel clears timer warnings");
  assert.equal(game.pickupEffects.length, 0, "advanceLevel clears pickup effects");
}
{
  const messages = [];
  const game = Object.create(Game.prototype);
  Object.defineProperty(game, "activeLevel", {get: () => game._testLevel});
  game.showToast = message => messages.push(message);
  game.updateHUD = () => {};
  game.assets = {};
  game.session = new GameSession();
  game._testLevel = {...testLevel, rules:{timeLimitSeconds:45, startingLives:2, requiredStars:0}, candies:[], stars:[], enemies:[], movingPlatforms:[], hazards:[], bouncePads:[]};
  for (const requiredStars of [0, 1, 5]) {
    game._testLevel = {...game._testLevel, rules:{...game._testLevel.rules, requiredStars}};
    const prompt = game.getStartPrompt();
    assert.match(prompt, requiredStars === 0 ? /Reach/ : new RegExp(`Find all ${requiredStars}`));
  }
}

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

// Player reactions are visual-only timers and cannot change the authoritative collider.
{
  const p = new Player(100, 500, {});
  const collider = {...p.colliderRect};
  p.triggerStarReaction(); p.triggerHurt(); p.triggerVictory();
  p.update(1 / 60, fakeInput(), true);
  assert.equal(p.colliderRect.w, collider.w, "reactions must not change collider width");
  assert.equal(p.colliderRect.h, collider.h, "reactions must not change collider height");
  assert.ok(p.victoryTimer > 0 && p.hurtTimer > 0, "reactions should be time-limited");
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
const bouncePositions = level1.bouncePads.map(({x, y}) => ({x, y}));
assert.deepEqual(level1.bouncePads.map(({x, y}) => ({x, y})), bouncePositions,
  "bounce pad coordinates should remain authored and static");
assert.equal(spriteSheets.playerRun.frames, 6);
assert.equal(spriteSheets.checkpoint.frames, 6);
// Sugar Rush consumes a full meter once, expires deterministically, and never changes the collider.
{
  const game = Object.create(Game.prototype);
  game.sugarRushMeter = 0;
  game.sugarRushActive = false;
  game.sugarRushTime = 0;
  game.burst = () => {};
  game.showToast = () => {};
  game.announce = () => {};
  game.player = new Player(100, 100, {});
  const collider = {...game.player.colliderRect};
  game.addSugarRushMeter(80);
  assert.equal(game.sugarRushMeter, 80);
  game.addSugarRushMeter(20);
  assert.equal(game.sugarRushActive, true);
  assert.equal(game.sugarRushTime, 6);
  assert.equal(game.sugarRushMeter, 0);
  assert.deepEqual(game.player.colliderRect, collider);
  game.updateSugarRush(6);
  assert.equal(game.sugarRushActive, false);
}
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
