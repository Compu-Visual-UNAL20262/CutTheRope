
/**
 * src/entities/Candy.js
 * physical candy in the game
 */

class Candy {
  constructor(physicsWorld, x, y, sprites, radius = CANDY_RADIUS) {
    this.physicsWorld = physicsWorld;
    this.radius = radius;
    this.type = 'candy';
    this.sprites = sprites;

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
    
    this.mascara = createGraphics(radius, radius);
    this.mascara.fill(0);  
    this.mascara.noStroke();
    this.mascara.circle(radius/ 2, radius / 2, radius);
  }

  render() {
    const { x, y } = this.body.position;

    push();
    translate(x, y);
    rotate(this.body.angle);

    imageMode(CENTER);
    for (let i = 0; i < CANDY_SPRITES.length; i++){
      this.sprites[i].mask(this.mascara.get());
      image(this.sprites[i], 0, 0, this.radius, this.radius);
    }

    pop();
  }

  onCollide(other) {
    // Concrete reactions are managed internally
    // from the object the collision took place with.
  }
}
