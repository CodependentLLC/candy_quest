import {level1, normalizeLevel} from "./level.js";

// These levels intentionally share the engine's data contract. Content can grow
// independently without adding level-specific branches to Game.
const copy = value => JSON.parse(JSON.stringify(value));
const makeLevel = (id, name, theme, changes = {}) => ({
  ...copy(level1), id, name, theme, duration: 60, ...changes
});

export const levels = {
  "world-1": level1,
  "world-2": makeLevel("world-2", "Jelly Springs", "jelly", {
    duration: 60,
    hazards: [],
    bouncePads: [{x: 930,y:525,w:70,h:28},{x: 2050,y:455,w:70,h:28},{x: 3500,y:405,w:70,h:28}],
    movingPlatforms: [{x:1460,y:410,w:140,h:28,minX:1450,maxX:1830,speed:110},{x:2700,y:345,w:140,h:28,minX:2670,maxX:3070,speed:125}]
  }),
  "world-3": makeLevel("world-3", "Chocolate Caverns", "chocolate", {
    duration: 55,
    hazards: [{x:730,y:575,w:100,h:25},{x:1090,y:575,w:90,h:25},{x:1890,y:575,w:120,h:25},{x:3180,y:575,w:120,h:25},{x:4010,y:575,w:130,h:25},{x:4560,y:575,w:130,h:25}],
    bouncePads: []
  }),
  "world-4": makeLevel("world-4", "Lollipop Heights", "lollipop", {
    duration: 55,
    platforms: [
      {x:0,y:600,w:730,h:120,kind:"cake"},{x:520,y:430,w:170,h:34,kind:"floating"},{x:1010,y:335,w:160,h:34,kind:"floating"},{x:1520,y:250,w:220,h:34,kind:"floating"},{x:2100,y:180,w:220,h:34,kind:"floating"},{x:2700,y:260,w:260,h:34,kind:"floating"},{x:3400,y:150,w:300,h:34,kind:"floating"},{x:4200,y:240,w:500,h:120,kind:"final"}
    ],
    movingPlatforms: [{x:1200,y:470,w:140,h:28,minX:1100,maxX:1900,speed:100},{x:3000,y:380,w:140,h:28,minX:2800,maxX:3800,speed:120}],
    goal: {x:4500,y:30}, checkpoint: {x:2700,y:260}
  }),
  "world-5": makeLevel("world-5", "Candy Castle", "castle", {duration: 60})
};

export const progression = ["world-1", "world-2", "world-3", "world-4", "world-5"];

for (const [id, level] of Object.entries(levels)) {
  if (id !== "world-1") normalizeLevel(level);
}
