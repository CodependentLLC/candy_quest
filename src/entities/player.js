const FRAME_SIZE = 384;
const FEET_BASELINE_Y = 360;
const RENDER_SIZE = 126;
// Visual-only grounding correction in rendered pixels. Physics stays unchanged.
const VISUAL_GROUNDING_OFFSET = 13;

export class Player {
  constructor(x, y, assets) {
    this.assets = assets;
    // x/y are the collider's top-left; visuals derive their position from feetX/feetY.
    this.collider = { offsetX: 0, offsetY: 0, width: 50, height: 72 };
    this.spawnX = x;
    this.spawnY = y;
    this.facing = 1;
    this.animFrame = 0;
    this.animTimer = 0;
    this.animState = "idle";
    this.coyote = 0;
    this.jumpBuffer = 0;
    this.celebrationTimer = 0;
    this.feedback = {squash: 0, stretch: 0};
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
    this.celebrationTimer = 0;
    this.feedback = {squash: 0, stretch: 0};
  }

  update(dt, input, wasGrounded) {
    const acceleration = 2450;
    const friction = 2100;
    const maxSpeed = 365;
    const gravity = 1750;
    const jumpSpeed = 700;

    const left = input.isDown ? input.isDown("left") : input.left;
    const right = input.isDown ? input.isDown("right") : input.right;
    const jump = input.isDown ? input.isDown("jump") : input.jump;
    if (left && !right) {
      this.vx -= acceleration * dt;
      this.facing = -1;
    } else if (right && !left) {
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

    const jumpPressed = input.consume ? input.consume("jump") : input.consumeJump();
    if (jumpPressed) this.jumpBuffer = 0.12;
    else this.jumpBuffer = Math.max(0, this.jumpBuffer - dt);

    if (this.jumpBuffer > 0 && this.coyote > 0) {
      this.vy = -jumpSpeed;
      this.coyote = 0;
      this.jumpBuffer = 0;
      this.onGround = false;
      this.triggerJumpFeedback();
    }

    if (!jump && this.vy < -120) {
      this.vy += gravity * 1.45 * dt;
    }

    this.vy += gravity * dt;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.updateAnimation(dt);
    this.celebrationTimer = Math.max(0, this.celebrationTimer - dt);
  }

  triggerCelebration() { this.celebrationTimer = .7; }
    this.feedback.squash = Math.max(0, this.feedback.squash - dt * 5);
    this.feedback.stretch = Math.max(0, this.feedback.stretch - dt * 5);
  }

  triggerJumpFeedback() { this.feedback.stretch = 1; }
  triggerLandingFeedback(impact = 0) { this.feedback.squash = Math.min(1, Math.max(.35, impact / 900)); }

  get animation() {
    if (!this.onGround) return this.vy < 0 ? "jump" : "fall";
    if (Math.abs(this.vx) > 35) return "run";
    return "idle";
  }

  updateAnimation(dt) {
    // Resetting on state changes prevents a stale run frame from leaking into jump/fall.
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
    const squash = this.feedback.squash * .10;
    const stretch = this.feedback.stretch * .12;
    const scaleX = 1 + squash - stretch;
    const scaleY = 1 - squash + stretch;
    const visualW = drawW * scaleX;
    const visualH = drawH * scaleY;
    const dx = this.feetX - cameraX - visualW / 2;
    const dy = this.feetY - feetOffsetY * scaleY + VISUAL_GROUNDING_OFFSET;

    ctx.save();
    if (this.celebrationTimer > 0) ctx.translate(0, -Math.sin(this.celebrationTimer * 18) * 3);
    if (this.facing < 0) {
      ctx.translate(dx + visualW, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(sprite, 0, dy, visualW, visualH);
    } else {
      ctx.drawImage(sprite, dx, dy, visualW, visualH);
    }
    ctx.restore();
  }
}
