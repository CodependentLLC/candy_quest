import assert from "node:assert/strict";
import { Player } from "../src/entities/player.js";
import { level1 } from "../src/level.js";
import { Game } from "../src/game.js";

function fakeInput({left=false,right=false,jump=false,jumpPressed=false}={}) {
  let jp=jumpPressed;
  return {
    left,right,jump,
    consumeJump(){const v=jp;jp=false;return v;}
  };
}

// Regression: the old build cleared onGround before Player.update,
// which meant coyote time was never armed and jumping effectively failed.
{
  const p = new Player(100, 500, {});
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
