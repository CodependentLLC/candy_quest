// Device adapters maintain independent state; gameplay only sees the resolved
// union of logical actions. This prevents one device from releasing another.
const DEFAULT_BINDINGS = {left:["arrowleft","a"],right:["arrowright","d"],jump:["arrowup","w"," "],restart:["r"],debug:["f2"],pause:["escape","p"]};

export class Input {
  constructor({bindings = DEFAULT_BINDINGS, onFocusLost = () => {}} = {}) {
    this.bindings = Object.fromEntries(Object.entries(bindings).map(([action, keys]) => [action, new Set(keys)]));
    this.sources = {keyboard:new Set(), touch:new Set(), controller:new Set()};
    this.down = new Set();
    this.pressed = new Set();
    this.controllerConnected = false;
    this.onFocusLost = onFocusLost;
    window.addEventListener("keydown", event => { const action = this.actionForKey(event.key.toLowerCase()); if (!action) return; event.preventDefault(); this.pressFrom("keyboard", action); }, {passive:false});
    window.addEventListener("keyup", event => { const action = this.actionForKey(event.key.toLowerCase()); if (action) this.releaseFrom("keyboard", action); });
    window.addEventListener("blur", () => this.handleFocusLost());
    document.querySelectorAll("[data-action], [data-key]").forEach(button => {
      const action = button.dataset.action || button.dataset.key;
      if (!this.bindings[action]) return;
      button.addEventListener("pointerdown", event => { event.preventDefault(); this.pressFrom("touch", action); });
      ["pointerup","pointercancel","pointerleave"].forEach(type => button.addEventListener(type, () => this.releaseFrom("touch", action)));
    });
  }
  pressFrom(source, action) { if (!this.sources[source].has(action) && !this.down.has(action)) this.pressed.add(action); this.sources[source].add(action); this.resolve(action); }
  releaseFrom(source, action) { this.sources[source].delete(action); this.resolve(action); }
  clearSource(source) { for (const action of [...this.sources[source]]) this.releaseFrom(source, action); }
  handleFocusLost() {
    this.clearSource("keyboard");
    this.clearSource("touch");
    this.clearSource("controller");
    // Blur invalidates queued edges as well as held actions, preventing a
    // pre-blur pause/jump/restart from replaying after focus returns.
    this.pressed.clear();
    this.onFocusLost();
  }
  resolve(action) { if (Object.values(this.sources).some(source => source.has(action))) this.down.add(action); else this.down.delete(action); }
  // Polling only updates controller-owned actions and never touches other sources.
  update() {
    const pad = [...(globalThis.navigator?.getGamepads?.() || [])].find(Boolean);
    if (!pad) { if (this.controllerConnected) this.clearSource("controller"); this.controllerConnected = false; return; }
    const axis = pad.axes?.[0] || 0;
    const actions = {left:axis < -0.25 || Boolean(pad.buttons?.[14]?.pressed), right:axis > 0.25 || Boolean(pad.buttons?.[15]?.pressed), jump:Boolean(pad.buttons?.[0]?.pressed), pause:Boolean(pad.buttons?.[9]?.pressed || pad.buttons?.[8]?.pressed)};
    for (const [action, active] of Object.entries(actions)) active ? this.pressFrom("controller", action) : this.releaseFrom("controller", action);
    this.controllerConnected = true;
  }
  actionForKey(key) { return Object.keys(this.bindings).find(action => this.bindings[action].has(key)); }
  setBinding(action, keys) { this.bindings[action] = new Set(keys); }
  press(action) { this.pressFrom("keyboard", action); }
  release(action) { this.releaseFrom("keyboard", action); }
  isDown(action) { return this.down.has(action); }
  wasPressed(action) { return this.pressed.has(action); }
  consume(action) { const value = this.wasPressed(action); this.pressed.delete(action); return value; }
  consumeJump() { return this.consume("jump"); }
  consumeRestart() { return this.consume("restart"); }
  consumeDebug() { return this.consume("debug"); }
  consumePause() { return this.consume("pause"); }
}
