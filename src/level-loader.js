import {testLevel} from "./level.js";
import {levels as progressionLevels} from "./levels.js";
import {validateLevel} from "./content-validation.js";

const levels = new Map([
  ...Object.entries(progressionLevels),
  ["test-level", testLevel]
]);

export function getLevel(levelId = "world-01-01") {
  const level = levels.get(levelId);
  if (!level) throw new Error(`Unknown level: ${levelId}`);
  return validateLevel(level);
}

export function registerLevel(levelId, level) {
  if (!level || !level.spawn || !Array.isArray(level.platforms)) {
    throw new TypeError("A level requires spawn and platforms data");
  }
  validateLevel(level);
  levels.set(levelId, level);
}

export function listLevels() {
  return [...levels.keys()];
}
