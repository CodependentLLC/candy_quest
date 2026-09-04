import assert from "node:assert/strict";
import { Player } from "../src/entities/player.js";
import { level1 } from "../src/level.js";

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

console.log("Smoke tests passed.");
