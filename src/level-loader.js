import {level1, testLevel} from "./level.js";

const levels = new Map([
  ["world-1", level1],
  ["test", testLevel]
]);

export function getLevel(levelId = "world-1") {
  const level = levels.get(levelId);
  if (!level) throw new Error(`Unknown level: ${levelId}`);
  return level;
}

export function registerLevel(levelId, level) {
  if (!level || !level.spawn || !Array.isArray(level.platforms)) {
    throw new TypeError("A level requires spawn and platforms data");
  }
  levels.set(levelId, level);
}

export function listLevels() {
  return [...levels.keys()];
}
