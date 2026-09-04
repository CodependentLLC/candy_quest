const paths = {
  background: "./assets/backgrounds/candy-world.png",

  playerIdle: [
    "./assets/player/frames/idle-0.png",
    "./assets/player/frames/idle-1.png",
    "./assets/player/frames/idle-2.png",
    "./assets/player/frames/idle-3.png"
  ],
  playerRun: [
    "./assets/player/frames/run-0.png",
    "./assets/player/frames/run-1.png",
    "./assets/player/frames/run-2.png",
    "./assets/player/frames/run-3.png"
  ],
  playerJumpFall: [
    "./assets/player/frames/jumpfall-0.png",
    "./assets/player/frames/jumpfall-1.png",
    "./assets/player/frames/jumpfall-2.png",
    "./assets/player/frames/jumpfall-3.png"
  ],

  enemies: {
    gummy: "./assets/enemies/individual/gummy.png",
    chocolate: "./assets/enemies/individual/chocolate.png",
    cupcake: "./assets/enemies/individual/cupcake.png",
    bluebug: "./assets/enemies/individual/bluebug.png"
  },

  collectibles: {
    pink: "./assets/collectibles/individual/pink.png",
    lemon: "./assets/collectibles/individual/lemon.png",
    mint: "./assets/collectibles/individual/mint.png",
    heart: "./assets/collectibles/individual/heart.png",
    star: "./assets/collectibles/individual/star.png",
    lollipop: "./assets/collectibles/individual/lollipop.png"
  },

  platforms: {
    donut: "./assets/platforms/individual/donut.png",
    wafer: "./assets/platforms/individual/wafer.png",
    moving: "./assets/platforms/individual/moving.png",
    cupcake: "./assets/platforms/individual/cupcake.png"
  },

  hazards: {
    spikes: "./assets/hazards/individual/spikes.png",
    chocolate: "./assets/hazards/individual/chocolate.png",
    peppermint: "./assets/hazards/individual/peppermint.png",
    spring: "./assets/hazards/individual/spring.png"
  },

  goals: {
    checkpoint: "./assets/goals/individual/checkpoint.png",
    goal: "./assets/goals/individual/goal.png",
    sign: "./assets/goals/individual/sign.png"
  }
};

async function loadImage(src) {
  const image = new Image();
  image.src = src;
  await image.decode();
  return image;
}

async function loadValue(value) {
  if (typeof value === "string") return loadImage(value);
  if (Array.isArray(value)) return Promise.all(value.map(loadImage));
  const entries = await Promise.all(
    Object.entries(value).map(async ([key, child]) => [key, await loadValue(child)])
  );
  return Object.fromEntries(entries);
}

export async function loadAssets() {
  return loadValue(paths);
}
