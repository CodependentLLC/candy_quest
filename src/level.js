export const level1 = {
  id: "world-01-01",
  worldId: "world-01",
  levelNumber: 1,
  name: "Candy Meadow",
  theme: "meadow",
  duration: 60,
  width: 5200,
  spawn: { x: 120, y: 470 },

  platforms: [
    {x:0,y:600,w:730,h:120,kind:"cake",solid:true,collider:{offsetX:0,offsetY:0,width:730,height:120}},
    {x:830,y:555,w:260,h:90,kind:"cookie"},
    {x:1180,y:485,w:250,h:90,kind:"cake"},
    {x:1520,y:585,w:370,h:90,kind:"cake"},
    {x:2010,y:525,w:300,h:90,kind:"cookie"},
    {x:2440,y:445,w:270,h:90,kind:"cake"},
    {x:2810,y:585,w:370,h:90,kind:"cake"},
    {x:3300,y:505,w:300,h:90,kind:"cookie"},
    {x:3730,y:430,w:280,h:90,kind:"cake"},
    {x:4140,y:560,w:420,h:100,kind:"cake"},
    {x:4690,y:480,w:510,h:160,kind:"final"},
    {x:520,y:390,w:170,h:34,kind:"floating"},
    {x:1010,y:335,w:160,h:34,kind:"floating"},
    {x:1760,y:365,w:170,h:34,kind:"floating"},
    {x:2240,y:305,w:170,h:34,kind:"floating"},
    {x:3040,y:350,w:160,h:34,kind:"floating"},
    {x:3500,y:300,w:165,h:34,kind:"floating"},
    {x:4380,y:315,w:180,h:34,kind:"floating"}
  ],

  movingPlatforms: [
    {x:1460,y:410,w:140,h:28,minX:1450,maxX:1830,speed:110},
    {x:2700,y:345,w:140,h:28,minX:2670,maxX:3070,speed:125}
  ],

  candies: [
    [240,525],[330,490],[420,455],[575,335],[655,335],
    [900,480],[1020,280],[1100,280],[1250,425],[1360,425],
    [1600,520],[1760,310],[1860,310],[2080,465],[2200,430],
    [2490,385],[2600,350],[2710,315],[2880,520],[3000,490],
    [3120,295],[3370,445],[3500,245],[3610,245],[3780,370],
    [3920,340],[4200,500],[4380,260],[4490,260],[4770,420],
    [4890,390],[5010,360]
  ],

  stars: [
    {x:1110,y:225},
    {x:2790,y:250},
    {x:4460,y:200}
  ],

  timeBonuses: [
    {x: 700, y: 300, amount: 5},
    {x: 2320, y: 250, amount: 5},
    {x: 4050, y: 350, amount: 5}
  ],

  hazards: [
    {x:730,y:575,w:100,h:25},
    {x:1090,y:575,w:90,h:25},
    {x:1890,y:575,w:120,h:25},
    {x:2310,y:575,w:130,h:25},
    {x:3180,y:575,w:120,h:25},
    {x:4010,y:575,w:130,h:25},
    {x:4560,y:575,w:130,h:25}
  ],

  bouncePads: [
    {typeId:"bounce-pad",x:930,y:545,w:70,h:28},
    {typeId:"bounce-pad",x:2935,y:567,w:70,h:28},
    {typeId:"bounce-pad",x:4260,y:552,w:70,h:28}
  ],

  enemies: [
    {x:930,y:515,minX:860,maxX:1040,speed:70,typeId:"gummy"},
    {x:1600,y:545,minX:1540,maxX:1825,speed:75,typeId:"choco"},
    {x:2100,y:485,minX:2040,maxX:2250,speed:82,typeId:"gummy"},
    {x:3350,y:465,minX:3320,maxX:3540,speed:90,typeId:"cupcake"},
    {x:4200,y:520,minX:4180,maxX:4470,speed:95,typeId:"gummy"}
  ],

  checkpoint: {x:2600,y:345},
  goal: {x:5020,y:270}
};

// A small data-only level exercises the same engine boundary without duplicating game logic.
export const testLevel = {
  width: 900,
  spawn: {x: 120, y: 470},
  platforms: [
    {x: 0, y: 600, w: 900, h: 120, kind: "cake"},
    {x: 360, y: 460, w: 150, h: 34, kind: "floating"}
  ],
  movingPlatforms: [],
  candies: [],
  stars: [],
  timeBonuses: [],
  hazards: [],
  bouncePads: [],
  enemies: [],
  checkpoint: {x: 120, y: 470},
  goal: {x: 780, y: 350}
};

export function normalizeLevel(level) {
  // Collision geometry is authored independently from the decorative atlas.
  for (const platform of level.platforms) {
  // Existing world coordinates are preserved; only their collision semantics are explicit.
  platform.oneWay = platform.kind === "floating";
  platform.solid = !platform.oneWay;
  platform.collision = platform.oneWay ? "oneWay" : "solid";
  platform.collider ??= {
    offsetX: 0, offsetY: 0, width: platform.w, height: platform.h
  };
  }
  for (const platform of level.movingPlatforms) {
  platform.oneWay = true;
  platform.solid = false;
  platform.collision = "oneWay";
  platform.collider = {offsetX:0, offsetY:0, width:platform.w, height:platform.h};
  }

  for (const hazard of level.hazards) hazard.collision = "hazard";
  for (const pad of level.bouncePads) pad.collision = "hazard";
  return level;
}

normalizeLevel(level1);
normalizeLevel(testLevel);
