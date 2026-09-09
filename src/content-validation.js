// Keep validation usable on the foundation branch before the optional runtime
// registries are introduced. These IDs mirror the registered content types.
const knownTypes = {enemy:new Set(["gummy","choco","cupcake"]), mechanic:new Set(["bounce-pad"])};

const COLLISION_MODES = new Set(["solid", "oneWay", "moving-solid", "moving-one-way", "none"]);
const fail = (id, field, message) => { throw new Error(`Invalid content ${id}.${field}: ${message}`); };
function finite(value, id, field, {min = 0, max = Infinity, integer = false} = {}) { if (!Number.isFinite(value) || value < min || value > max || (integer && !Number.isInteger(value))) fail(id, field, `expected a finite ${integer ? "integer" : "number"} from ${min} to ${max}`); }
function point(value, id, field, width, height) { if (!value || typeof value !== "object") fail(id, field, "expected x/y coordinates"); finite(value.x, id, `${field}.x`, {max:width}); finite(value.y, id, `${field}.y`, {max:height}); }
function rect(value, id, field, width, height) { if (!value || typeof value !== "object") fail(id, field, "expected x/y/w/h"); finite(value.x, id, `${field}.x`, {max:width}); finite(value.y, id, `${field}.y`, {max:height}); finite(value.w, id, `${field}.w`, {min:.001}); finite(value.h, id, `${field}.h`, {min:.001}); if (value.x + value.w > width || value.y + value.h > height) fail(id, field, "extends outside level bounds"); }
function collider(value, id, field) { if (!value || typeof value !== "object") fail(id, field, "missing collider metadata"); finite(value.offsetX, id, `${field}.offsetX`, {min:-Infinity}); finite(value.offsetY, id, `${field}.offsetY`, {min:-Infinity}); finite(value.width, id, `${field}.width`, {min:.001}); finite(value.height, id, `${field}.height`, {min:.001}); }
function uniqueIds(items, id, field) { const seen = new Set(); items.forEach((item, index) => { if (item?.id == null) return; if (typeof item.id !== "string" || !item.id) fail(id, `${field}[${index}].id`, "must be a non-empty string"); if (seen.has(item.id)) fail(id, `${field}[${index}].id`, `duplicate ID "${item.id}"`); seen.add(item.id); }); }
function typeRef(item, id, field, category, fallback) { const typeId = item.typeId ?? (fallback ?? item.type); if (typeof typeId !== "string" || !typeId) fail(id, `${field}.typeId`, `missing ${category} type ID`); if (!knownTypes[category]?.has(typeId)) throw new Error(`Invalid ${category} type ID "${typeId}" in level ${id} at ${field}.typeId`); }

export function validateWorld(world, levels = {}) {
  if (!world || typeof world.id !== "string" || !world.id) throw new Error("Invalid world.id: expected a non-empty string");
  if (!Array.isArray(world.levelIds) || !world.levelIds.length) throw new Error(`Invalid world ${world.id}.levelIds: expected a non-empty array`);
  if (!world.levelIds.includes(world.currentLevelId)) throw new Error(`Invalid world ${world.id}.currentLevelId: not listed in levelIds`);
  const placeholders = new Set(world.placeholderLevelIds ?? []), seen = new Set();
  for (const levelId of world.levelIds) { if (seen.has(levelId)) throw new Error(`Invalid world ${world.id}.levelIds: duplicate ID "${levelId}"`); seen.add(levelId); if (!levels[levelId] && !placeholders.has(levelId)) throw new Error(`Invalid world ${world.id}.levelIds: unknown level "${levelId}" must be an explicit placeholder`); if (levels[levelId] && levels[levelId].worldId !== world.id) throw new Error(`Invalid world ${world.id}.levelIds: ${levelId}.worldId does not match`); }
  return world;
}

export function validateLevel(level) {
  const id = level?.id ?? "<unnamed>";
  if (!level || typeof level !== "object") throw new Error(`Invalid content ${id}: expected an object`);
  if (typeof level.id !== "string" || !level.id) fail(id, "id", "expected a non-empty string");
  if (typeof level.worldId !== "string" || !level.worldId) fail(id, "worldId", "expected a non-empty string");
  finite(level.width, id, "width", {min:1}); finite(level.height, id, "height", {min:1});
  if (!level.spawn) fail(id, "spawn", "is required"); point(level.spawn, id, "spawn", level.width, level.height); if (!level.goal) fail(id, "goal", "is required"); point(level.goal, id, "goal", level.width, level.height); if (!level.checkpoint) fail(id, "checkpoint", "is required"); point(level.checkpoint, id, "checkpoint", level.width, level.height);
  if (!level.rules) fail(id, "rules", "is required"); finite(level.rules.timeLimitSeconds, id, "rules.timeLimitSeconds", {min:1,max:3600}); finite(level.rules.startingLives, id, "rules.startingLives", {min:1,max:99,integer:true}); finite(level.rules.requiredStars, id, "rules.requiredStars", {min:0,max:999,integer:true});
  const collections = ["platforms","movingPlatforms","hazards","enemies","stars","candies","timeBonuses","bouncePads","mechanics"]; for (const field of collections) { if (!Array.isArray(level[field])) fail(id, field, "expected an array"); uniqueIds(level[field], id, field); } if (level.rules.requiredStars > level.stars.length) fail(id,"rules.requiredStars",`cannot exceed stars.length (${level.stars.length})`);
  level.platforms.forEach((item,i) => { const field=`platforms[${i}]`; rect(item,id,field,level.width,level.height); if (!COLLISION_MODES.has(item.collision)) fail(id,`${field}.collision`,`unknown mode "${item.collision}"`); collider(item.collider,id,`${field}.collider`); });
  level.movingPlatforms.forEach((item,i) => { const field=`movingPlatforms[${i}]`; rect(item,id,field,level.width,level.height); if (!["moving-solid","moving-one-way"].includes(item.collision)) fail(id,`${field}.collision`,"must be moving-solid or moving-one-way"); collider(item.collider,id,`${field}.collider`); finite(item.minX,id,`${field}.minX`,{min:0,max:level.width}); finite(item.maxX,id,`${field}.maxX`,{min:0,max:level.width}); finite(item.speed,id,`${field}.speed`,{min:.001}); if (item.minX > item.maxX) fail(id,`${field}.minX`,"must be <= maxX"); });
  level.hazards.forEach((item,i) => { const field=`hazards[${i}]`; rect(item,id,field,level.width,level.height); if (item.collision !== "hazard") fail(id,`${field}.collision`,"must be hazard"); collider(item.collider,id,`${field}.collider`); });
  level.bouncePads.forEach((item,i) => { const field=`bouncePads[${i}]`; rect(item,id,field,level.width,level.height); if (item.collision !== "bounce") fail(id,`${field}.collision`,"must be bounce, not lethal hazard"); collider(item.collider,id,`${field}.collider`); typeRef(item,id,field,"mechanic","bounce-pad"); });
  level.enemies.forEach((item,i) => { const field=`enemies[${i}]`; point(item,id,field,level.width,level.height); typeRef(item,id,field,"enemy"); finite(item.minX,id,`${field}.minX`,{min:0,max:level.width}); finite(item.maxX,id,`${field}.maxX`,{min:0,max:level.width}); if (item.minX > item.maxX) fail(id,`${field}.minX`,"must be <= maxX"); });
  level.mechanics.forEach((item,i) => typeRef(item,id,`mechanics[${i}]`,"mechanic")); level.stars.forEach((item,i) => point(item,id,`stars[${i}]`,level.width,level.height));
  level.candies.forEach((item,i) => { if (!Array.isArray(item) || item.length < 2) fail(id,`candies[${i}]`,"expected [x, y]"); point({x:item[0],y:item[1]},id,`candies[${i}]`,level.width,level.height); });
  level.timeBonuses.forEach((item,i) => { const field=`timeBonuses[${i}]`; point(item,id,field,level.width,level.height); finite(item.amount,id,`${field}.amount`,{min:.001,max:3600}); }); return level;
}

export function validateContent(worlds, levels) { Object.values(levels).forEach(validateLevel); Object.values(worlds).forEach(world => validateWorld(world, levels)); return true; }
