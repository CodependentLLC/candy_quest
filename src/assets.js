// CQ-83: this manifest intentionally lists runtime-ready assets only.
// Editable source sheets and intermediate exports live in ../art-source/.
const coreAssets = {

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
};

const world01Assets = {
  background: "./assets/backgrounds/candy-world.png",

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

  hazards: {spikes: "./assets/hazards/individual/spikes.png", spring: "./assets/hazards/individual/spring.png"}
};

const world0101Assets = {

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

// Groups let the boot screen and current world load independently from future content.
export const assetGroups = {
  boot: {}, ui: {}, core: coreAssets, "world-01": world01Assets, "world-01-01": world0101Assets,
  "world-02": {},
  audio: {}
};

async function loadImage(src, group) {
  try {
    const image = new Image();
    image.src = src;
    await image.decode();
    return image;
  } catch (error) {
    // Include the path even for constructor/decode failures while retaining the original error.
    const assetError = new Error(`Failed to load asset ${src} in group ${group}`, {cause: error});
    assetError.name = "AssetLoadError";
    assetError.assetPath = src;
    assetError.assetGroup = group;
    throw assetError;
  }
}

async function loadValue(value, progress, state) {
  if (typeof value === "string") {
    const result = await loadImage(value, state.group);
    state.loaded++;
    progress?.({group: state.group, loaded: state.loaded, total: state.total, ratio: state.total ? state.loaded / state.total : 1});
    return result;
  }
  if (Array.isArray(value)) return Promise.all(value.map(item => loadValue(item, progress, state)));
  const entries = await Promise.all(
    Object.entries(value).map(async ([key, child]) => [key, await loadValue(child, progress, state)])
  );
  return Object.fromEntries(entries);
}

function countPaths(value) {
  if (typeof value === "string") return 1;
  if (Array.isArray(value)) return value.reduce((count, item) => count + countPaths(item), 0);
  return Object.values(value).reduce((count, item) => count + countPaths(item), 0);
}

const loadedGroups = new Map();
const loadingGroups = new Map();

export async function loadAssetGroup(group, progress) {
  if (!(group in assetGroups)) throw new Error(`Unknown asset group: ${group}`);
  if (loadedGroups.has(group)) {
    const value = loadedGroups.get(group);
    const total = countPaths(assetGroups[group]);
    progress?.({group, loaded: total, total, ratio: 1, cached: true});
    return value;
  }
  if (loadingGroups.has(group)) return loadingGroups.get(group);

  const state = {group, loaded: 0, total: countPaths(assetGroups[group])};
  progress?.({group, loaded: 0, total: state.total, ratio: state.total ? 0 : 1});
  const loading = loadValue(assetGroups[group], progress, state)
    .then(value => {
      loadedGroups.set(group, value);
      return value;
    })
    .finally(() => loadingGroups.delete(group));
  loadingGroups.set(group, loading);
  return loading;
}

export async function loadAssets(progress) {
  await loadAssetGroup("boot", progress);
  await loadAssetGroup("ui", progress);
  const [core, world] = await Promise.all([loadAssetGroup("core", progress), loadAssetGroup("world-01", progress)]);
  const level = await loadAssetGroup("world-01-01", progress);
  return { ...core, ...world, ...level };
}

export function preloadWorld(group, progress) {
  return loadAssetGroup(group, progress);
}

export function preloadLevel(levelId, progress) { return loadAssetGroup(levelId, progress); }

export function assetPaths(value) {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(assetPaths);
  return Object.values(value).flatMap(assetPaths);
}
