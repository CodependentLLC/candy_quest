import {level1, normalizeLevel} from "./level.js";

// World metadata describes structure; playable content remains level data.
export const worlds = {
  "world-01": {
    id: "world-01", name: "Candy Meadow", currentLevelId: "world-01-01",
    assetGroup: "world-01",
    levelIds: ["world-01-01", "world-01-02", "world-01-03", "world-01-04", "world-01-05", "world-01-06", "world-01-boss"]
  }
};

export const levels = {"world-01-01": level1};
export const progression = ["world-01-01"];
for (const level of Object.values(levels)) normalizeLevel(level);

export function getWorld(worldId = "world-01") {
  const world = worlds[worldId];
  if (!world) throw new Error(`Unknown world: ${worldId}`);
  return world;
}
