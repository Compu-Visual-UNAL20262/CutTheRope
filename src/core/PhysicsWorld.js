/**
 * src/core/PhysicsWorld.js
 * Wrapper sobre Matter.js Engine y World, coordinador de colisiones y ciclo físico.
 * Responsabilidad: Ángel [BASE]
 */

class PhysicsWorld {
  constructor() {
    if (typeof Matter === 'undefined') {
      throw new Error('PhysicsWorld requiere que Matter.js esté cargado previamente.');
    }

    this.Engine = Matter.Engine;
    this.World = Matter.World;
    this.Composite = Matter.Composite;
    this.Events = Matter.Events;

    // Crear motor de física
    this.engine = this.Engine.create();
    this.world = this.engine.world;

    // Configurar gravedad según CONFIG
    const gravityY = (typeof CONFIG !== 'undefined' && CONFIG.GRAVITY_Y !== undefined)
      ? CONFIG.GRAVITY_Y
      : 1.0;
    this.world.gravity.x = 0;
    this.world.gravity.y = gravityY;

    // Inicializar listener de colisiones
    this.setupCollisionListener();
  }

  /**
   * Configura el despacho automático de colisiones hacia los gameObjects
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
   * Agrega uno o varios cuerpos al mundo físico
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
   * Remueve un cuerpo del mundo físico
   * @param {Matter.Body} body
   */
  removeBody(body) {
    if (body) {
      this.World.remove(this.world, body);
    }
  }

  /**
   * Agrega una restricción (Constraint / Cuerda) al mundo
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
   * Remueve una restricción del mundo físico
   * @param {Matter.Constraint} constraint
   */
  removeConstraint(constraint) {
    if (constraint) {
      this.World.remove(this.world, constraint);
    }
  }

  /**
   * Limpia todos los cuerpos, restricciones y compuestos del mundo
   */
  clearWorld() {
    this.World.clear(this.world, false);
    this.Engine.clear(this.engine);
  }

  /**
   * Avanza un paso en la simulación física
   * @param {number} delta - Tiempo en milisegundos (por defecto 1000/60)
   */
  update(delta = 1000 / 60) {
    this.Engine.update(this.engine, delta);
  }
}

// Exposición global
if (typeof window !== 'undefined') {
  window.PhysicsWorld = PhysicsWorld;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { PhysicsWorld };
}
