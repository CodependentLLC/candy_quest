const DEFAULT_BINDINGS = {left:["arrowleft","a"],right:["arrowright","d"],jump:["arrowup","w"," "],restart:["r"],debug:["f2"],pause:["escape","p"]};

export class Input {
  constructor({bindings = DEFAULT_BINDINGS} = {}) {
    this.bindings = Object.fromEntries(Object.entries(bindings).map(([action, keys]) => [action, new Set(keys)]));
    this.down = new Set();
    this.pressed = new Set();

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
