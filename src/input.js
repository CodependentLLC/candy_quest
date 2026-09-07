const DEFAULT_BINDINGS = {left:["arrowleft","a"],right:["arrowright","d"],jump:["arrowup","w"," "],restart:["r"],debug:["f2"],pause:["escape","p"]};

export class Input {
  constructor({bindings = DEFAULT_BINDINGS} = {}) {
    this.bindings = Object.fromEntries(Object.entries(bindings).map(([action, keys]) => [action, new Set(keys)]));
    this.down = new Set();
    this.pressed = new Set();
    this.controllerActive = false;

    window.addEventListener("keydown", e => {
      const key = e.key.toLowerCase();
      const action = this.actionForKey(key);
      if (!action) return;
      e.preventDefault();
      this.press(action);
    }, {passive:false});

    window.addEventListener("keyup", e => {
      const key = e.key.toLowerCase();
      const action = this.actionForKey(key);
      if (action) this.release(action);
    });

    window.addEventListener("blur", () => {
      this.press("pause");
      this.down.clear();
    });

    document.querySelectorAll("[data-action], [data-key]").forEach(btn => {
      const key = btn.dataset.action || btn.dataset.key;
      if (!this.bindings[key]) return;
      btn.addEventListener("pointerdown", e => {
        e.preventDefault();
        this.press(key);
      });
      ["pointerup","pointercancel","pointerleave"].forEach(evt => btn.addEventListener(evt, () => this.release(key)));
    });
  }

  // Polling stays in the input adapter so gameplay consumes the same actions for every device.
  update() {
    const pads = globalThis.navigator?.getGamepads?.() || [];
    const pad = [...pads].find(Boolean);
    if (!pad) {
      if (this.controllerActive) {
        ["left", "right", "jump", "pause"].forEach(action => this.release(action));
        this.controllerActive = false;
      }
      return;
    }
    const axis = pad?.axes?.[0] || 0;
    const left = Boolean(pad && (axis < -0.25 || pad.buttons?.[14]?.pressed));
    const right = Boolean(pad && (axis > 0.25 || pad.buttons?.[15]?.pressed));
    const jump = Boolean(pad?.buttons?.[0]?.pressed);
    const pause = Boolean(pad && (pad.buttons?.[9]?.pressed || pad.buttons?.[8]?.pressed));
    left ? this.press("left") : this.release("left");
    right ? this.press("right") : this.release("right");
    jump ? this.press("jump") : this.release("jump");
    pause ? this.press("pause") : this.release("pause");
    this.controllerActive = true;
  }

  actionForKey(key){ return Object.keys(this.bindings).find(action => this.bindings[action].has(key)); }
  setBinding(action, keys){ this.bindings[action] = new Set(keys); }
  press(action){ if (!this.down.has(action)) this.pressed.add(action); this.down.add(action); }
  release(action){ this.down.delete(action); }
  isDown(action){ return this.down.has(action); }
  wasPressed(action){ return this.pressed.has(action); }
  consume(action){ const value=this.wasPressed(action); this.pressed.delete(action); return value; }
  consumeJump(){ return this.consume("jump"); }
  consumeRestart(){ return this.consume("restart"); }
  consumeDebug(){ return this.consume("debug"); }
  consumePause(){ return this.consume("pause"); }
}
