import { Game } from "./game.js";
const canvas=document.querySelector("#game");
const game=new Game(canvas);
// Expose the live game only for explicit E2E runs; Game remains the owner of state.
if (new URLSearchParams(location.search).has("e2e")) globalThis.__candyQuestGame = game;
document.querySelector("#restart").addEventListener("click",()=>game.restart(true));
document.querySelector("#result-restart")?.addEventListener("click",()=>game.restart(true));
document.querySelector("#resume")?.addEventListener("click", () => {
  game.paused = false;
  game.updatePauseOverlay();
  game.announce("Game resumed.");
});
game.start();
