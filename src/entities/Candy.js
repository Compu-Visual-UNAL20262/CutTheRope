
/**
 * src/entities/Candy.js
 * physical candy in the game
 */

class Candy {
  constructor(physicsWorld, x, y, radius = CANDY_RADIUS) {
    this.physicsWorld = physicsWorld;
    this.radius = radius;
    this.type = 'candy';

    this.body = Matter.Bodies.circle(x, y, radius, {
      label: CONFIG.LABELS.CANDY,
      restitution: 0.25,
      friction: 0.1,
      frictionAir: 0.005,
      density: 0.002,
      collisionFilter: {
        category: CONFIG.COLLISION_CATEGORIES.CANDY,
        mask: 0xFFFF
      }
    });

    this.body.gameObject = this;

    this.physicsWorld.addBody(this.body);
  }

  render() {
    const { x, y } = this.body.position;

    push();
    translate(x, y);
    rotate(this.body.angle);

    noStroke();
    fill(225, 65, 65);
    circle(0, 0, this.radius * 2);

    fill(255, 180, 180);
    circle(-5, -5, 7);

    pop();
  }

  onCollide(other) {
    // Concrete reactions are managed internally
    // from the object the collision took place with.
  }
}
