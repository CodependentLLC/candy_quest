export class Input {
  constructor() {
    this.left = false;
    this.right = false;
    this.jump = false;
    this.jumpPressed = false;
    this.restartPressed = false;

    window.addEventListener("keydown", e => {
      const key = e.key.toLowerCase();
      if (["arrowleft","arrowright","arrowup"," ","a","d","w","r"].includes(key)) e.preventDefault();
      if ((key === "arrowleft" || key === "a")) this.left = true;
      if ((key === "arrowright" || key === "d")) this.right = true;
      if (key === "arrowup" || key === "w" || key === " ") {
        if (!this.jump) this.jumpPressed = true;
        this.jump = true;
      }
      if (key === "r") this.restartPressed = true;
    }, {passive:false});

    window.addEventListener("keyup", e => {
      const key = e.key.toLowerCase();
      if (key === "arrowleft" || key === "a") this.left = false;
      if (key === "arrowright" || key === "d") this.right = false;
      if (key === "arrowup" || key === "w" || key === " ") this.jump = false;
    });

    document.querySelectorAll("[data-key]").forEach(btn => {
      const key = btn.dataset.key;
      btn.addEventListener("pointerdown", e => {
        e.preventDefault();
        if (key === "jump" && !this.jump) this.jumpPressed = true;
        this[key] = true;
      });
      ["pointerup","pointercancel","pointerleave"].forEach(evt => btn.addEventListener(evt, () => this[key] = false));
    });
  }

  consumeJump(){ const v=this.jumpPressed; this.jumpPressed=false; return v; }
  consumeRestart(){ const v=this.restartPressed; this.restartPressed=false; return v; }
}
