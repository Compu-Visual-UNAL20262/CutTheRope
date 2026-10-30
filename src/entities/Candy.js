
/**
 * src/entities/Candy.js
 * physical candy in the game
 */

class Candy {
  constructor(physicsWorld, x, y, sprites) {
    this.physicsWorld = physicsWorld;
    this.radius = CANDY_RADIUS;
    this.type = 'candy';
    this.sprites = sprites;
    this.eaten = false;

    this.body = Matter.Bodies.circle(x, y, this.radius, {
      label: CONFIG.LABELS.CANDY,
      restitution: 0.25,
      friction: 0.1,
      frictionAir: 0.001,
      density: 0.02,
      collisionFilter: {
        category: CONFIG.COLLISION_CATEGORIES.CANDY,
        mask: 0xFFFF
      }
    });

    this.body.gameObject = this;

    this.physicsWorld.addBody(this.body);
  }

  render() {
    if (this.eaten) { return };
    const { x, y } = this.body.position;

    push();
    translate(x, y);
    rotate(this.body.angle);

    imageMode(CENTER);
    for (let i = 0; i < CANDY_SPRITES.length; i++){
      image(this.sprites[i], 0, 0, this.radius*2, this.radius*2);
    }

    pop();
  }

  delete(){
    this.physicsWorld.removeBody(this.body);
    this.eaten = true;
  }

  onCollide(other) {
    // Concrete reactions are managed internally
    // from the object the collision took place with.
  }
}
