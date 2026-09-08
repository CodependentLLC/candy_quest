import {getLevel} from "./level-loader.js";

// The map owns navigation presentation; Game remains responsible for simulation.
export class WorldMap {
  constructor(root, world, session, {onSelect, onBack} = {}) { this.root=root; this.world=world; this.session=session; this.onSelect=onSelect; this.onBack=onBack; }
  record(id) { return this.session?.profile?.levels?.[id] || this.session?.mapProgress?.[id] || {}; }
  render() {
    this.root.replaceChildren();
    const heading=document.createElement("h2"); heading.id="world-map-title"; heading.textContent=`${this.world.name} Map`; this.root.append(heading);
    const list=document.createElement("div"); list.className="map-nodes";
    for (const [index,id] of this.world.levelIds.entries()) {
      const record=this.record(id); let playable=true;
      try { getLevel(id); } catch { playable=false; }
      const unlocked=Boolean(record.unlocked || id===this.world.currentLevelId) && playable;
      const button=document.createElement("button"); button.type="button"; button.className="map-node";
      button.disabled=!unlocked; button.dataset.levelId=id; button.setAttribute("aria-label",`${id}${unlocked?" unlocked":" locked"}`);
      const label=id.endsWith("boss")?"BOSS":`${index+1}`;
      button.innerHTML=`<strong>${label}</strong><span>${record.completed?"Completed":unlocked?"Play":"Locked"}</span><small>${record.stars?`${record.stars}/3 stars`:""}</small>`;
      if (record.stars >= 3) button.classList.add("mastered"); else if (record.completed) button.classList.add("completed");
      button.addEventListener("click",()=>this.onSelect?.(id)); list.append(button);
    }
    this.root.append(list);
    const back=document.createElement("button"); back.type="button"; back.textContent="Back"; back.addEventListener("click",()=>this.onBack?.()); this.root.append(back);
  }
  show() { this.render(); this.root.hidden=false; this.root.querySelector("button:not([disabled])")?.focus(); }
  hide() { this.root.hidden=true; }
}
