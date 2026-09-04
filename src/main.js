import { Game } from "./game.js";
const canvas=document.querySelector("#game");
const game=new Game(canvas);
document.querySelector("#restart").addEventListener("click",()=>game.restart(true));
game.start();
