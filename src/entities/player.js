const FRAME_SIZE = 384;
const FEET_BASELINE_Y = 360;
const RENDER_SIZE = 126;
// Visual-only grounding correction in rendered pixels. Physics stays unchanged.
const VISUAL_GROUNDING_OFFSET = 13;

export class Player {
  constructor(x, y, assets) {
    this.assets = assets;
    this.collider = { offsetX: 0, offsetY: 0, width: 50, height: 72 };
    this.spawnX = x;
    this.spawnY = y;
    this.facing = 1;
    this.animFrame = 0;
    this.animTimer = 0;
    this.animState = "idle";
    this.coyote = 0;
    this.jumpBuffer = 0;
    this.reset(x, y);
  }

  get w() { return this.collider.width; }
  get h() { return this.collider.height; }

  get colliderRect() {
    return {
      x: this.x + this.collider.offsetX,
      y: this.y + this.collider.offsetY,
      w: this.collider.width,
      h: this.collider.height
    };
  }

  get feetX() {
    const c = this.colliderRect;
    return c.x + c.w / 2;
  }

  get feetY() {
    const c = this.colliderRect;
    return c.y + c.h;
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
    this.animFrame = 0;
    this.animTimer = 0;
    this.animState = "idle";
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
    const nextState = this.animation;
    if (nextState !== this.animState) {
      this.animState = nextState;
      this.animFrame = 0;
      this.animTimer = 0;
    }

    const fps = nextState === "run" ? 11 : 7;
    const frameCount = nextState === "run"
      ? (this.assets.playerRun?.length || 6)
      : nextState === "idle"
        ? (this.assets.playerIdle?.length || 4)
        : (this.assets.playerJumpFall?.length || 4);

    this.animTimer += dt;
    while (this.animTimer >= 1 / fps) {
      this.animTimer -= 1 / fps;
      this.animFrame = (this.animFrame + 1) % frameCount;
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
    const drawW = RENDER_SIZE;
    const drawH = RENDER_SIZE;
    const feetOffsetY = drawH * (FEET_BASELINE_Y / FRAME_SIZE);
    const dx = this.feetX - cameraX - drawW / 2;
    const dy = this.feetY - feetOffsetY + VISUAL_GROUNDING_OFFSET;

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
