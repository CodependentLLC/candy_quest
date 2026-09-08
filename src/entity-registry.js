// Entity definitions are deliberately data-free contracts. Level data selects a
// type ID and supplies placement/configuration; Game only orchestrates them.
export class EntityRegistry {
  constructor(kind = "entity") {
    this.kind = kind;
    this.definitions = new Map();
  }

  register(id, definition) {
    if (typeof id !== "string" || !id.trim()) throw new TypeError(`${this.kind} type ID must be a non-empty string`);
    if (this.definitions.has(id)) throw new Error(`Duplicate ${this.kind} type ID: ${id}`);
    if (!definition || typeof definition.create !== "function" || typeof definition.update !== "function" ||
        typeof definition.render !== "function" || typeof definition.getCollider !== "function" ||
        typeof definition.reset !== "function" || typeof definition.teardown !== "function") {
      throw new TypeError(`${this.kind} type "${id}" must define create, update, render, getCollider, reset, and teardown`);
    }
    this.definitions.set(id, Object.freeze({...definition}));
    return this;
  }

  has(id) { return this.definitions.has(id); }

  get(id) {
    const definition = this.definitions.get(id);
    if (!definition) throw new Error(`Unknown ${this.kind} type ID: ${id}`);
    return definition;
  }

  create(id, config = {}, context = {}) {
    // The selected ID is canonical even when older content used a `type` field.
    return this.get(id).create({...config, typeId: config.typeId ?? id}, context);
  }
  update(id, instance, dt, context = {}) { return this.get(id).update(instance, dt, context); }
  render(id, instance, context = {}) { return this.get(id).render(instance, context); }
  getCollider(id, instance, context = {}) { return this.get(id).getCollider(instance, context); }
  reset(id, instance, context = {}) { return this.get(id).reset(instance, context); }
  teardown(id, instance, context = {}) { return this.get(id).teardown(instance, context); }
}

const enemyDefinition = (renderKey) => ({
  create(config, {index = 0} = {}) {
    return {...config, typeId: config.typeId ?? config.type, type: config.typeId ?? config.type,
      alive: true, dir: index % 2 ? -1 : 1, w: 54, h: 48};
  },
  update(enemy, dt) {
    if (!enemy.alive) return;
    enemy.x += enemy.speed * enemy.dir * dt;
    if (enemy.x < enemy.minX) { enemy.x = enemy.minX; enemy.dir = 1; }
    if (enemy.x > enemy.maxX) { enemy.x = enemy.maxX; enemy.dir = -1; }
  },
  render(enemy, {game}) { game.drawEnemy(enemy, renderKey); },
  getCollider(enemy) { return {x: enemy.x, y: enemy.y, w: enemy.w, h: enemy.h}; },
  reset(enemy) { enemy.alive = true; },
  teardown() {}
});

export const enemyRegistry = new EntityRegistry("enemy");
enemyRegistry.register("gummy", enemyDefinition("gummy"));
enemyRegistry.register("choco", enemyDefinition("chocolate"));
enemyRegistry.register("cupcake", enemyDefinition("cupcake"));

export function validateLevelTypes(level) {
  for (const enemy of level.enemies ?? []) {
    const typeId = enemy.typeId ?? enemy.type;
    try { enemyRegistry.get(typeId); }
    catch (error) { throw new Error(`Invalid enemy type ID "${typeId}" in level ${level.id ?? "<unnamed>"}`, {cause: error}); }
  }
  return level;
}
