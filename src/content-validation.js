const COLLISION_MODES = new Set(["solid", "oneWay", "moving-solid", "moving-one-way", "none", "hazard"]);
const fail = (id, field, message) => { throw new Error(`Invalid content ${id}.${field}: ${message}`); };
function finite(value, id, field, {min = 0, max = Infinity, integer = false} = {}) { if (!Number.isFinite(value) || value < min || value > max || (integer && !Number.isInteger(value))) fail(id, field, `expected a finite ${integer ? "integer" : "number"} from ${min} to ${max}`); }
function point(value, id, field) { if (!value || typeof value !== "object") fail(id, field, "expected x/y coordinates"); finite(value.x, id, `${field}.x`); finite(value.y, id, `${field}.y`); }
function rect(value, id, field) { if (!value || typeof value !== "object") fail(id, field, "expected x/y/w/h"); finite(value.x, id, `${field}.x`, {min:-Infinity}); finite(value.y, id, `${field}.y`, {min:-Infinity}); finite(value.w, id, `${field}.w`, {min:.001}); finite(value.h, id, `${field}.h`, {min:.001}); }
function collider(value, id, field) { if (!value || typeof value !== "object") fail(id, field, "missing collider metadata"); finite(value.offsetX, id, `${field}.offsetX`, {min:-Infinity}); finite(value.offsetY, id, `${field}.offsetY`, {min:-Infinity}); finite(value.width, id, `${field}.width`, {min:.001}); finite(value.height, id, `${field}.height`, {min:.001}); }
function uniqueIds(items, id, field) { const seen = new Set(); items.forEach((item, index) => { if (!item.id) return; if (seen.has(item.id)) fail(id, `${field}[${index}].id`, `duplicate ID "${item.id}"`); seen.add(item.id); }); }

export function validateWorld(world, levels = {}) {
  if (!world || typeof world.id !== "string" || !world.id) throw new Error("Invalid world.id: expected a non-empty string");
  if (!Array.isArray(world.levelIds) || !world.levelIds.length) throw new Error(`Invalid world ${world.id}.levelIds: expected a non-empty array`);
  if (!world.levelIds.includes(world.currentLevelId)) throw new Error(`Invalid world ${world.id}.currentLevelId: not listed in levelIds`);
  const seen = new Set(); for (const levelId of world.levelIds) { if (seen.has(levelId)) throw new Error(`Invalid world ${world.id}.levelIds: duplicate ID "${levelId}"`); seen.add(levelId); if (levels[levelId] && levels[levelId].worldId !== world.id) throw new Error(`Invalid world ${world.id}.levelIds: ${levelId}.worldId does not match`); }
  return world;
}

export function validateLevel(level) {
  const id = level?.id ?? "<unnamed>";
  if (!level || typeof level !== "object") throw new Error(`Invalid content ${id}: expected an object`);
  if (typeof level.id !== "string" || !level.id) fail(id, "id", "expected a non-empty string");
  if (typeof level.worldId !== "string" || !level.worldId) fail(id, "worldId", "expected a non-empty string");
  finite(level.width, id, "width", {min:1}); finite(level.height ?? 720, id, "height", {min:1});
  if (!level.spawn) fail(id, "spawn", "is required"); point(level.spawn, id, "spawn");
  if (!level.goal) fail(id, "goal", "is required"); point(level.goal, id, "goal");
  if (!level.checkpoint) fail(id, "checkpoint", "is required"); point(level.checkpoint, id, "checkpoint");
  if (!level.rules) fail(id, "rules", "is required");
  finite(level.rules.timeLimitSeconds, id, "rules.timeLimitSeconds", {min:1, max:3600}); finite(level.rules.startingLives, id, "rules.startingLives", {min:1, max:99, integer:true}); finite(level.rules.requiredStars, id, "rules.requiredStars", {min:0, max:999, integer:true});
  if (!Array.isArray(level.stars)) fail(id, "stars", "expected an array"); if (level.rules.requiredStars > level.stars.length) fail(id, "rules.requiredStars", `cannot exceed stars.length (${level.stars.length})`);
  for (const [field, items] of [["platforms",level.platforms],["movingPlatforms",level.movingPlatforms],["hazards",level.hazards],["enemies",level.enemies]]) { if (!Array.isArray(items)) fail(id, field, "expected an array"); uniqueIds(items, id, field); }
  level.platforms.forEach((item, i) => { rect(item,id,`platforms[${i}]`); if (!COLLISION_MODES.has(item.collision)) fail(id,`platforms[${i}].collision`,`unknown mode "${item.collision}"`); collider(item.collider,id,`platforms[${i}].collider`); });
  level.movingPlatforms.forEach((item, i) => { rect(item,id,`movingPlatforms[${i}]`); collider(item.collider,id,`movingPlatforms[${i}].collider`); finite(item.minX,id,`movingPlatforms[${i}].minX`,{min:-Infinity}); finite(item.maxX,id,`movingPlatforms[${i}].maxX`,{min:-Infinity}); finite(item.speed,id,`movingPlatforms[${i}].speed`,{min:.001}); if (item.minX > item.maxX) fail(id,`movingPlatforms[${i}].minX`,"must be <= maxX"); });
  level.hazards.forEach((item, i) => { rect(item,id,`hazards[${i}]`); collider(item.collider,id,`hazards[${i}].collider`); });
  level.enemies.forEach((item, i) => { point(item,id,`enemies[${i}]`); if (typeof (item.typeId ?? item.type) !== "string") fail(id,`enemies[${i}].typeId`,"is required"); });
  level.stars.forEach((item, i) => point(item,id,`stars[${i}]`));
  return level;
}

export function validateContent(worlds, levels) { Object.values(levels).forEach(validateLevel); Object.values(worlds).forEach(world => validateWorld(world, levels)); return true; }
