// CQ-83: this manifest intentionally lists runtime-ready assets only.
// Editable source sheets and intermediate exports live in ../art-source/.
const paths = {
  background: "./assets/backgrounds/candy-world.png",

  playerIdle: [
    "./assets/player/frames/idle-0.png",
    "./assets/player/frames/idle-1.png",
    "./assets/player/frames/idle-2.png",
    "./assets/player/frames/idle-3.png"
  ],
  playerRun: [
    // The run sheet is prepared into normalized frames before runtime loading.
    "./assets/player/frames/run-0.png",
    "./assets/player/frames/run-1.png",
    "./assets/player/frames/run-2.png",
    "./assets/player/frames/run-3.png",
    "./assets/player/frames/run-4.png",
    "./assets/player/frames/run-5.png"
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
    cupcake: "./assets/enemies/individual/cupcake.png"
  },

  collectibles: {
    pink: "./assets/collectibles/individual/pink.png",
    lemon: "./assets/collectibles/individual/lemon.png",
    mint: "./assets/collectibles/individual/mint.png",
    star: "./assets/collectibles/individual/star.png"
  },

  platforms: {
    candyAtlas: "./assets/platforms/candy-platforms.png"
  },

  hazards: {
    spikes: "./assets/hazards/individual/spikes.png",
    spring: "./assets/hazards/individual/spring.png"
  },

  goals: {
    checkpoint: "./assets/goals/checkpoint-flag.png",
    goal: "./assets/goals/individual/goal.png"
  }
};

export const spriteSheets = {
  // Kept here with the checkpoint sheet metadata so frame counts do not live in render code.
  playerRun: {frames: 6},
  checkpoint: {frames: 6}
};

async function loadImage(src) {
  const image = new Image();
  image.src = src;
  try {
    await image.decode();
  } catch (error) {
    throw new Error(`Failed to load asset ${src}`, {cause:error});
  }
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
