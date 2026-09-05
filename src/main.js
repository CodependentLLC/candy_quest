import { Game } from "./game.js";
const canvas=document.querySelector("#game");
const game=new Game(canvas);
// Exposes the live game only for browser-level validation; Game remains the owner of state.
globalThis.__candyQuestGame = game;
document.querySelector("#restart").addEventListener("click",()=>game.restart(true));
game.start();
