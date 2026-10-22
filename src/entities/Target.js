
/**
 * src/entities/Target.js
 * Monster and winning sensor.
 */

class Target {
  constructor(physicsWorld, x, y, radius = TARGET_RADIUS) {
    this.physicsWorld = physicsWorld;
    this.radius = radius;
    this.type = 'target';
    this.reached = false;
    this.mouthOpen = false;

    this.body = Matter.Bodies.circle(x, y, radius, {
      label: CONFIG.LABELS.TARGET,
    });

    this.support = Matter.Bodies.rectangle(
      x,
      y + radius*1.25,
      radius * 3,
      5,
      { isStatic: true }
    );

    this.body.gameObject = this;
    this.support.gameObject = this;
    this.physicsWorld.addBody(this.support);
    this.physicsWorld.addBody(this.body);
  }

  update(candy) {
    if (!candy || this.reached) return;

    const dx = candy.body.position.x - this.body.position.x;
    const dy = candy.body.position.y - this.body.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < DETECTION_RADIUS) {
      this.mouthOpen = true;
    } else {
      this.mouthOpen = false;
    }
  }

  render() {
    const { x, y } = this.body.position;
    const { x: supX, y: supY } = this.support.position;

    push();
    noStroke();

    // Soporte provisional.
    imageMode(CENTER);
    image(supportSprite[0], supX, supY, supportSprite[0].width, supportSprite[0].height);

    // Cuerpo provisional del monstruo
    fill(100, 205, 75);
    circle(x, y, this.radius * 2);

    // Ojos
    fill(255);
    circle(x - 13, y - 8, 15);
    circle(x + 13, y - 8, 15);

    fill(25);
    circle(x - 12, y - 7, 6);
    circle(x + 14, y - 7, 6);

    // Boca
    fill(35);
    if (this.mouthOpen) {
      ellipse(x, y + 13, 25, 23);
    } else {
      ellipse(x, y + 14, 20, 5);
    }

    pop();
  }

  onCollide(other) {
    if (this.reached || !other || other.type !== 'candy') return;

    this.reached = true;
    this.mouthOpen = true;
  }
}
