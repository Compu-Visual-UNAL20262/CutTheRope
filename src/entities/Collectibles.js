
/**
 * src/entities/Collectibles.js
 * Collectible stars.
 */

class Star {
  constructor(physicsWorld, x, y, onCollect = null, radius = STAR_RADIUS, ) {
    this.physicsWorld = physicsWorld;
    this.radius = radius;
    this.type = 'star';
    this.collected = false;
    this.onCollectCallback = onCollect;
    this.BGsprite = starBgSprite;

    this.body = Matter.Bodies.circle(x, y, radius, {
      label: CONFIG.LABELS.STAR,
      isStatic: true,
      isSensor: true
    });

    this.body.gameObject = this;
    this.physicsWorld.addBody(this.body);
  }

  render() {
    if (this.collected) return;

    const { x, y } = this.body.position;
    push();
    translate(x, y);
    rotate(this.body.angle);

    imageMode(CENTER);
    image(this.BGsprite, 0, 0, this.radius*STAR_BG_RATIO, this.radius*STAR_BG_RATIO);

    pop();

    push();
    translate(x, y);
    rotate(frameCount * 0.015);

    fill(255, 210, 35);
    stroke(255, 245, 150);
    strokeWeight(2);

    // Estrella de cinco puntas
    beginShape();
    for (let i = 0; i < 10; i++) {
      const angle = -HALF_PI + i * PI / 5;
      const r = i % 2 === 0
        ? this.radius
        : this.radius * 0.45;

      vertex(
        cos(angle) * r,
        sin(angle) * r
      );
    }
    endShape(CLOSE);

    pop();
  }

  onCollide(other) {
    if (!other || other.type !== 'candy') return;
    if (this.collected) return;

    this.collected = true;

    this.physicsWorld.removeBody(this.body);

    if (typeof this.onCollectCallback === 'function') {
      this.onCollectCallback(this);
    }

    if (
      typeof particleSystem !== 'undefined' &&
      particleSystem &&
      typeof particleSystem.emitStarBurst === 'function'
    ) {
      particleSystem.emitStarBurst(
        this.body.position.x,
        this.body.position.y
      );
    }
  }
}
