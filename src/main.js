import { Game } from "./game.js";
import { getWorld } from "./levels.js";
import { getLevel } from "./level-loader.js";
import { WorldMap } from "./world-map.js";
const canvas=document.querySelector("#game");
const game=new Game(canvas);
const map = new WorldMap(document.querySelector("#world-map"), getWorld("world-01"), game.session, {
  onSelect: levelId => { game.setLevel(getLevel(levelId), levelId); map.hide(); game.closeMap(); },
  onBack: () => { if (game.closeMap()) map.hide(); else map.show(); }
});
const openMap = () => { game.openMap(); map.show(); };
// Expose the live game only for explicit E2E runs; Game remains the owner of state.
if (new URLSearchParams(location.search).has("e2e")) globalThis.__candyQuestGame = game;
document.querySelector("#restart").addEventListener("click",()=>game.restart(true));
document.querySelector("#result-restart")?.addEventListener("click",()=>game.restart(true));
document.querySelector("#result-map")?.addEventListener("click",()=>{ game.resultMode=null; game.updateResultOverlay(); game.openMap("terminal"); map.show(); });
document.querySelector("#open-map")?.addEventListener("click", openMap);
document.querySelector("#resume")?.addEventListener("click", () => {
  game.closeMap();
  game.announce("Game resumed.");
  game.setPaused(false);
});
game.start();
