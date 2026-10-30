/**
 * src/core/PhysicsWorld.js
 * Wrapper around Matter.js Engine & World, collision coordinator, and physics stepping.
 * Responsibility: Ángel [BASE]
 */

class PhysicsWorld {
  constructor() {
    if (typeof Matter === 'undefined') {
      throw new Error('PhysicsWorld requires Matter.js to be loaded beforehand.');
    }

    this.Engine = Matter.Engine;
    this.World = Matter.World;
    this.Composite = Matter.Composite;
    this.Events = Matter.Events;

    // Create the physics engine
    this.engine = this.Engine.create();
    this.world = this.engine.world;

    // Configure gravity based on CONFIG
    const gravityY = (typeof CONFIG !== 'undefined' && CONFIG.GRAVITY_Y !== undefined)
      ? CONFIG.GRAVITY_Y
      : 1.0;
    this.world.gravity.x = 0;
    this.world.gravity.y = gravityY;

    // Set up collision event listener
    this.setupCollisionListener();
  }

  /**
   * Sets up automatic collision dispatching to gameObjects via onCollide()
   */
  setupCollisionListener() {
    this.Events.on(this.engine, 'collisionStart', (event) => {
      const pairs = event.pairs;
      for (let i = 0; i < pairs.length; i++) {
        const { bodyA, bodyB } = pairs[i];
        const objA = bodyA.gameObject;
        const objB = bodyB.gameObject;

        if (objA && typeof objA.onCollide === 'function') {
          objA.onCollide(objB || bodyB, bodyB);
        }

        if (objB && typeof objB.onCollide === 'function') {
          objB.onCollide(objA || bodyA, bodyA);
        }
      }
    });
  }

  /**
   * Adds one or multiple bodies to the physics world
   * @param {Matter.Body|Matter.Body[]} body
   */
  addBody(body) {
    if (Array.isArray(body)) {
      this.Composite.add(this.world, body);
    } else if (body) {
      this.World.add(this.world, body);
    }
  }

  /**
   * Removes a body from the physics world
   * @param {Matter.Body} body
   */
  removeBody(body) {
    if (body) {
      this.World.remove(this.world, body);
    }
  }

  /**
   * Adds a constraint (rope link/pin) to the physics world
   * @param {Matter.Constraint|Matter.Constraint[]} constraint
   */
  addConstraint(constraint) {
    if (Array.isArray(constraint)) {
      this.Composite.add(this.world, constraint);
    } else if (constraint) {
      this.World.add(this.world, constraint);
    }
  }

  /**
   * Removes a constraint from the physics world
   * @param {Matter.Constraint} constraint
   */
  removeConstraint(constraint) {
    if (constraint) {
      this.World.remove(this.world, constraint);
    }
  }

  /**
   * Clears all bodies, constraints, and composites from the world
   */
  clearWorld() {
    this.Composite.clear(this.world, false);
    this.Engine.clear(this.engine);
  }

  /**
   * Resets the physics world for a new level or restart, removing dynamic bodies
   * and constraints while preserving registered collision listeners.
   */
  resetForNewLevel() {
    this.Composite.clear(this.world, false);
    this.Engine.clear(this.engine);
  }

  /**
   * Advances the physics simulation by delta milliseconds
   * @param {number} delta - Elapsed time in ms (defaults to 1000/60)
   */
  update(delta = 1000 / 60) {
    this.Engine.update(this.engine, delta);
  }
}

// Global scope export
if (typeof window !== 'undefined') {
  window.PhysicsWorld = PhysicsWorld;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { PhysicsWorld };
}
