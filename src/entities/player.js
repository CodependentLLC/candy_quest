export class Player {
  constructor(x, y, assets) {
    this.assets = assets;
    this.w = 50;
    this.h = 72;
    this.spawnX = x;
    this.spawnY = y;
    this.facing = 1;
    this.animFrame = 0;
    this.animTimer = 0;
    this.coyote = 0;
    this.jumpBuffer = 0;
    this.reset(x, y);
  }

  reset(x = this.spawnX, y = this.spawnY) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.onGround = false;
    this.dead = false;
    this.coyote = 0;
    this.jumpBuffer = 0;
  }

  update(dt, input, wasGrounded) {
    const acceleration = 2450;
    const friction = 2100;
    const maxSpeed = 365;
    const gravity = 1750;
    const jumpSpeed = 700;

    if (input.left && !input.right) {
      this.vx -= acceleration * dt;
      this.facing = -1;
    } else if (input.right && !input.left) {
      this.vx += acceleration * dt;
      this.facing = 1;
    } else {
      const decel = friction * dt;
      if (Math.abs(this.vx) <= decel) this.vx = 0;
      else this.vx -= Math.sign(this.vx) * decel;
    }

    this.vx = Math.max(-maxSpeed, Math.min(maxSpeed, this.vx));

    // IMPORTANT: coyote time uses last frame's grounded state.
    if (wasGrounded) this.coyote = 0.12;
    else this.coyote = Math.max(0, this.coyote - dt);

    if (input.consumeJump()) this.jumpBuffer = 0.12;
    else this.jumpBuffer = Math.max(0, this.jumpBuffer - dt);

    if (this.jumpBuffer > 0 && this.coyote > 0) {
      this.vy = -jumpSpeed;
      this.coyote = 0;
      this.jumpBuffer = 0;
      this.onGround = false;
    }

    // Releasing jump early gives a shorter hop.
    if (!input.jump && this.vy < -120) {
      this.vy += gravity * 1.45 * dt;
    }

    this.vy += gravity * dt;
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    this.updateAnimation(dt);
  }

  get animation() {
    if (!this.onGround) return this.vy < 0 ? "jump" : "fall";
    if (Math.abs(this.vx) > 35) return "run";
    return "idle";
  }

  updateAnimation(dt) {
    const fps = this.animation === "run" ? 11 : 7;
    this.animTimer += dt;
    if (this.animTimer >= 1 / fps) {
      this.animTimer -= 1 / fps;
      this.animFrame = (this.animFrame + 1) % 4;
    }
  }

  draw(ctx, cameraX) {
    let frames = this.assets.playerIdle;
    if (this.animation === "run") frames = this.assets.playerRun;
    if (this.animation === "jump" || this.animation === "fall") frames = this.assets.playerJumpFall;

    let frameIndex = this.animFrame;
    if (this.animation === "jump") frameIndex = this.vy < -260 ? 0 : 1;
    if (this.animation === "fall") frameIndex = this.vy < 300 ? 2 : 3;

    const sprite = frames[frameIndex % frames.length];

    // All extracted frames are normalized to an identical 384x384 transparent canvas.
    // This eliminates the previous stretching/wobble caused by treating concept-art spacing
    // as a fixed spritesheet grid.
    const drawH = 126;
    const drawW = 126;
    const dx = this.x - cameraX - (drawW - this.w) / 2;
    const dy = this.y - (drawH - this.h) + 5;

    ctx.save();
    if (this.facing < 0) {
      ctx.translate(dx + drawW, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(sprite, 0, dy, drawW, drawH);
    } else {
      ctx.drawImage(sprite, dx, dy, drawW, drawH);
    }
    ctx.restore();
  }
}
