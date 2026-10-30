
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
    this.lost = false;
    this.mouthOpen = false;

    this.body = Matter.Bodies.circle(x, y, radius, {
      label: CONFIG.LABELS.TARGET,
      isStatic:true,
    });

    this.support = Matter.Bodies.rectangle(
      x,
      y + radius,
      radius,
      5,
      { isStatic: true }
    );

    this.body.gameObject = this;
    this.physicsWorld.addBody(this.support);
    this.physicsWorld.addBody(this.body);
  }

  update(candy) {
    if (this.lost) {
      sadAnimation.update();
      return;
    }

    if (this.reached) {
      eatingAnimation.update();
      return;
    }

    if (!candy) return;

    const dx = candy.body.position.x - this.body.position.x;
    const dy = candy.body.position.y - this.body.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < DETECTION_RADIUS) {
      if (!this.mouthOpen) {
        openMouthAnimation.reset();
      }
      this.mouthOpen = true;
      openMouthAnimation.update();
    } else {
      this.mouthOpen = false;
      openMouthAnimation.reset();
      idleAnimation.update();
    }
  }

  render() {
    const { x, y } = this.body.position;
    const { x: supX, y: supY } = this.support.position;

    push();
    noStroke();

    // Support
    imageMode(CENTER);
    image(supportSprite, supX, supY-this.radius/4, supportSprite.width, supportSprite.height);

    // OmNom
    if (this.lost) {
      sadAnimation.draw(x, y, this.radius*2, this.radius*2);
    } else if (this.mouthOpen && !this.reached) {
      openMouthAnimation.draw(x, y, this.radius*2, this.radius*2);
    } else if (this.reached) {
      eatingAnimation.draw(x, y, this.radius*2, this.radius*2);
    } else {
      idleAnimation.draw(x, y, this.radius*2, this.radius*2);
    }

    pop();
  }

  onCollide(other) {
    if (this.reached || !other || other.type !== 'candy') return;

    this.reached = true;
    this.mouthOpen = true;
    eatingAnimation.reset();
  }

  onLost() {
    if (this.reached || this.lost) return;

    this.lost = true;
    this.mouthOpen = false;
    sadAnimation.reset();
  }
}
