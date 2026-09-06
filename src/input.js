export class Input {
  constructor() {
    this.left = false;
    this.right = false;
    this.jump = false;
    this.jumpPressed = false;
    this.restartPressed = false;
    this.debugPressed = false;
    this.pausePressed = false;

    window.addEventListener("keydown", e => {
      const key = e.key.toLowerCase();
      if (["arrowleft","arrowright","arrowup"," ","a","d","w","r","escape","p"].includes(key)) e.preventDefault();
      if ((key === "arrowleft" || key === "a")) this.left = true;
      if ((key === "arrowright" || key === "d")) this.right = true;
      if (key === "arrowup" || key === "w" || key === " ") {
        if (!this.jump) this.jumpPressed = true;
        this.jump = true;
      }
      if (key === "r") this.restartPressed = true;
      if (key === "f2") this.debugPressed = true;
      if (key === "escape" || key === "p") this.pausePressed = true;
    }, {passive:false});

    window.addEventListener("keyup", e => {
      const key = e.key.toLowerCase();
      if (key === "arrowleft" || key === "a") this.left = false;
      if (key === "arrowright" || key === "d") this.right = false;
      if (key === "arrowup" || key === "w" || key === " ") this.jump = false;
    });

    window.addEventListener("blur", () => {
      this.left = false;
      this.right = false;
      this.jump = false;
      this.jumpPressed = false;
      this.pausePressed = true;
    });

    document.querySelectorAll("[data-key]").forEach(btn => {
      const key = btn.dataset.key;
      btn.addEventListener("pointerdown", e => {
        e.preventDefault();
        if (key === "jump" && !this.jump) this.jumpPressed = true;
        if (key === "pause") this.pausePressed = true;
        this[key] = true;
      });
      ["pointerup","pointercancel","pointerleave"].forEach(evt => btn.addEventListener(evt, () => this[key] = false));
    });
  }

  consumeJump(){ const v=this.jumpPressed; this.jumpPressed=false; return v; }
  consumeRestart(){ const v=this.restartPressed; this.restartPressed=false; return v; }
  consumeDebug(){ const v=this.debugPressed; this.debugPressed=false; return v; }
  consumePause(){ const v=this.pausePressed; this.pausePressed=false; return v; }
}
