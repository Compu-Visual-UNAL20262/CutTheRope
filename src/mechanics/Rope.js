/**
 * src/mechanics/Rope.js
 */

class Rope {
  /**
   * Creates a segmented physical rope anchored at (pinX, pinY) and attached to candyBody.
   * @param {number} pinX - X coordinate of the static anchor pin
   * @param {number} pinY - Y coordinate of the static anchor pin
   * @param {number} [segments=8] - Number of constraint links in the rope
   * @param {Matter.Body|Object|null} [candyBody=null] - Target candy Matter.Body (or Candy entity)
   * @param {PhysicsWorld|null} [world=null] - Optional PhysicsWorld instance (defaults to global physicsWorld)
   */
  constructor(pinX, pinY, segments, candyBody = null, world = null) {
    this.pinX = pinX;
    this.pinY = pinY;
    const defaultSegs = typeof ROPE_DEFAULT_SEGMENTS !== 'undefined' ? ROPE_DEFAULT_SEGMENTS : 8;
    this.segments = Math.max(2, segments || defaultSegs);

    // Resolve PhysicsWorld wrapper
    this.physicsWorld = world || (typeof physicsWorld !== 'undefined' ? physicsWorld : null);

    // Resolve Matter.Body if a Candy wrapper instance was passed instead of raw body
    this.candyBody = (candyBody && candyBody.body) ? candyBody.body : candyBody;

    this.pinBody = null;
    this.nodes = [];
    this.constraints = [];
    this._beforeUpdateHandler = null;

    // Cut & visual fade state
    this.isCut = false;
    this.alpha = 255;
    this.destroyed = false;

    this.buildRope();
  }

  /**
   * Builds the static pin body, intermediate node bodies, and Matter.Constraint links.
   */
  buildRope() {
    if (typeof Matter === 'undefined') {
      console.warn('Rope requires Matter.js to be loaded.');
      return;
    }

    const { Bodies, Body, Constraint } = Matter;

    const nodeLabel = (typeof CONFIG !== 'undefined' && CONFIG.LABELS)
      ? CONFIG.LABELS.ROPE_NODE
      : 'ROPE_NODE';
    const ropeCategory = (typeof CONFIG !== 'undefined' && CONFIG.COLLISION_CATEGORIES)
      ? CONFIG.COLLISION_CATEGORIES.ROPE
      : 0x0004;

    const pinRadius = typeof ROPE_PIN_RADIUS !== 'undefined' ? ROPE_PIN_RADIUS : 10;
    const nodeRadius = typeof ROPE_NODE_RADIUS !== 'undefined' ? ROPE_NODE_RADIUS : 4;
    const defaultSegLen = typeof ROPE_SEGMENT_LENGTH !== 'undefined' ? ROPE_SEGMENT_LENGTH : 28.5;
    const stiffness = typeof ROPE_STIFFNESS !== 'undefined' ? ROPE_STIFFNESS : 1.0;
    const damping = typeof ROPE_DAMPING !== 'undefined' ? ROPE_DAMPING : 0.0;

    // Ensure high constraint solver iterations on the engine once for taut multi-segment ropes
    if (this.physicsWorld && this.physicsWorld.engine) {
      if ((this.physicsWorld.engine.constraintIterations || 0) < 20) {
        this.physicsWorld.engine.constraintIterations = 20;
      }
      if ((this.physicsWorld.engine.positionIterations || 0) < 20) {
        this.physicsWorld.engine.positionIterations = 20;
      }
    }

    // 1. Create static anchor Pin body (sensor/non-colliding so it never blocks entities)
    this.pinBody = Bodies.circle(this.pinX, this.pinY, pinRadius, {
      label: nodeLabel,
      isStatic: true,
      isSensor: true,
      collisionFilter: {
        category: ropeCategory,
        mask: 0
      }
    });
    this.pinBody.gameObject = this;

    if (this.physicsWorld) {
      this.physicsWorld.addBody(this.pinBody);
    }

    // 2. Determine target endpoint and segment length
    const physSegments = Math.max(5, Math.min(this.segments, 14));
    let endX = this.pinX;
    let endY = this.pinY + this.segments * defaultSegLen;
    let totalRopeLength = this.segments * defaultSegLen;

    if (this.candyBody && this.candyBody.position) {
      const dx = this.candyBody.position.x - this.pinX;
      const dy = this.candyBody.position.y - this.pinY;
      const initialDist = Math.hypot(dx, dy);
      const targetTotalLength = this.segments * defaultSegLen;

      if (!this.candyBody._hasPrimaryRope) {
        // First rope attached to this candy: align candy at full rope length along its initial angle
        // so the pendulum swings cleanly through level stars.
        this.candyBody._hasPrimaryRope = true;
        const ux = initialDist > 1 ? dx / initialDist : 0;
        const uy = initialDist > 1 ? dy / initialDist : 1;
        totalRopeLength = Math.max(initialDist, targetTotalLength);
        endX = this.pinX + ux * totalRopeLength;
        endY = this.pinY + uy * totalRopeLength;
        Body.setPosition(this.candyBody, { x: endX, y: endY });
        Body.setVelocity(this.candyBody, { x: 0, y: 0 });
      } else {
        // Secondary rope attached to the same candy: adapt segment length to current distance
        endX = this.candyBody.position.x;
        endY = this.candyBody.position.y;
        totalRopeLength = Math.max(initialDist, this.segments * 10.0);
      }
    }

    const segLen = totalRopeLength / physSegments;

    // 3. Create intermediate rope nodes interpolated between Pin and endpoint
    const nodeDensity = 0.006;
    const numNodes = physSegments - 1;
    for (let i = 1; i <= numNodes; i++) {
      const t = i / physSegments;
      const nx = this.pinX + (endX - this.pinX) * t;
      const ny = this.pinY + (endY - this.pinY) * t;

      const node = Bodies.circle(nx, ny, nodeRadius, {
        label: nodeLabel,
        density: nodeDensity,
        friction: 0.05,
        frictionAir: 0.005,
        restitution: 0.0,
        collisionFilter: {
          category: ropeCategory,
          mask: 0
        }
      });

      node.gameObject = this;
      this.nodes.push(node);
    }

    if (this.physicsWorld && this.nodes.length > 0) {
      this.physicsWorld.addBody(this.nodes);
    }

    const chainBodies = [this.pinBody, ...this.nodes];
    if (this.candyBody) {
      chainBodies.push(this.candyBody);
    }

    for (let i = 0; i < chainBodies.length - 1; i++) {
      const bodyA = chainBodies[i];
      const bodyB = chainBodies[i + 1];

      const constraint = Constraint.create({
        bodyA: bodyA,
        bodyB: bodyB,
        pointA: { x: 0, y: 0 },
        pointB: { x: 0, y: 0 },
        length: segLen,
        stiffness: stiffness,
        damping: damping
      });

      constraint.rope = this;
      this.constraints.push(constraint);
    }

    if (this.physicsWorld && this.constraints.length > 0) {
      this.physicsWorld.addConstraint(this.constraints);
    }

    if (this.physicsWorld && this.physicsWorld.Events && this.physicsWorld.engine && this.candyBody) {
      this._beforeUpdateHandler = () => {
        if (this.isCut || this.destroyed || !this.candyBody || !this.candyBody.position) return;
        const rx = this.candyBody.position.x - this.pinX;
        const ry = this.candyBody.position.y - this.pinY;
        const d = Math.hypot(rx, ry);
        if (d > totalRopeLength) {
          const ux = rx / d;
          const uy = ry / d;
          const tx = -uy;
          const ty = ux;
          const targetLen = Math.min(totalRopeLength * 1.08, totalRopeLength + (d - totalRopeLength) * 0.75);
          const nx = this.pinX + ux * targetLen;
          const ny = this.pinY + uy * targetLen;
          const vx = this.candyBody.velocity ? this.candyBody.velocity.x : 0;
          const vy = this.candyBody.velocity ? this.candyBody.velocity.y : 0;
          const vr = vx * ux + vy * uy;
          let vt = vx * tx + vy * ty;

          Body.setPosition(this.candyBody, { x: nx, y: ny });
          if (vr > 0) {
            if (Math.abs(vt) > 0.1) {
              const sign = vt >= 0 ? 1 : -1;
              vt = sign * Math.hypot(vt, vr * 0.85);
            }
            const nextVr = vr * 0.38;
            Body.setVelocity(this.candyBody, { x: vt * tx + nextVr * ux, y: vt * ty + nextVr * uy });
          }

          const blend = 0.08;
          for (let i = 0; i < this.nodes.length; i++) {
            const t = (i + 1) / physSegments;
            const targetX = this.pinX + ux * (targetLen * t);
            const targetY = this.pinY + uy * (targetLen * t);
            Body.setPosition(this.nodes[i], {
              x: this.nodes[i].position.x + (targetX - this.nodes[i].position.x) * blend,
              y: this.nodes[i].position.y + (targetY - this.nodes[i].position.y) * blend
            });
          }
        }
      };
      this.physicsWorld.Events.on(this.physicsWorld.engine, 'afterUpdate', this._beforeUpdateHandler);
    }
  }

  /**
   * Returns all active constraint segments with their current world endpoints.
   * Used by Cutter.js for swipe raycast / line-segment intersection checks.
   * @returns {Array<{constraint: Matter.Constraint, index: number, p1: {x: number, y: number}, p2: {x: number, y: number}}>}
   */
  getActiveSegments() {
    if (this.destroyed) return [];

    const active = [];
    for (let i = 0; i < this.constraints.length; i++) {
      const c = this.constraints[i];
      if (!c || !c.bodyA || !c.bodyB) continue;

      const p1 = {
        x: c.bodyA.position.x + (c.pointA ? c.pointA.x : 0),
        y: c.bodyA.position.y + (c.pointA ? c.pointA.y : 0)
      };
      const p2 = {
        x: c.bodyB.position.x + (c.pointB ? c.pointB.x : 0),
        y: c.bodyB.position.y + (c.pointB ? c.pointB.y : 0)
      };

      active.push({
        constraint: c,
        index: i,
        p1: p1,
        p2: p2
      });
    }
    return active;
  }

  /**
   * Severs a specific Matter.Constraint from this rope and removes it from PhysicsWorld.
   * @param {Matter.Constraint} constraint - The constraint link to sever
   * @returns {{x: number, y: number}|null} Midpoint coordinates of the severed link for particle effects
   */
  removeConstraint(constraint) {
    const idx = this.constraints.indexOf(constraint);
    if (idx === -1) return null;

    const c = this.constraints[idx];
    let cutPoint = null;

    if (c && c.bodyA && c.bodyB) {
      cutPoint = {
        x: (c.bodyA.position.x + c.bodyB.position.x) * 0.5,
        y: (c.bodyA.position.y + c.bodyB.position.y) * 0.5
      };
    }

    if (this.physicsWorld) {
      this.physicsWorld.removeConstraint(c);
    }

    this.constraints.splice(idx, 1);

    this.detachEvents();
    this.isCut = true;

    return cutPoint;
  }

  detachEvents() {
    if (
      this._beforeUpdateHandler &&
      this.physicsWorld &&
      this.physicsWorld.Events &&
      this.physicsWorld.engine
    ) {
      this.physicsWorld.Events.off(this.physicsWorld.engine, 'afterUpdate', this._beforeUpdateHandler);
      this._beforeUpdateHandler = null;
    }
  }

  /**
   * Renders the rope strands and the static pin anchor in p5.js.
   */
  render() {
    if (this.destroyed) return;

    // If the physics world was cleared on level restart/change, mark stale rope as destroyed
    if (
      this.pinBody &&
      this.physicsWorld &&
      this.physicsWorld.world &&
      Array.isArray(this.physicsWorld.world.bodies) &&
      this.physicsWorld.world.bodies.indexOf(this.pinBody) === -1
    ) {
      this.detachEvents();
      this.destroyed = true;
      this.constraints = [];
      this.nodes = [];
      return;
    }

    // Fade out severed rope tails smoothly and clean up bodies once invisible
    if (this.isCut) {
      const fadeSpeed = typeof ROPE_FADE_SPEED !== 'undefined' ? ROPE_FADE_SPEED : 6;
      this.alpha = Math.max(0, this.alpha - fadeSpeed);
      if (this.alpha <= 0) {
        this.destroyNodesAndConstraints();
      }
    }

    push();

    // 1. Draw active rope segments if visible
    if (this.alpha > 0 && this.constraints.length > 0) {
      this.renderRopeStrands();
    }

    // 2. Always draw the static anchor Pin on top
    this.renderPin();

    pop();
  }

  /**
   * Groups contiguous active constraints into polylines and renders braided rope styling.
   */
  renderRopeStrands() {
    // Group contiguous constraints where prev.bodyB === curr.bodyA
    const chains = [];
    let currentChain = [];

    for (let i = 0; i < this.constraints.length; i++) {
      const c = this.constraints[i];
      if (!c || !c.bodyA || !c.bodyB) continue;

      // Skip drawing link attached to candy if candy was eaten/deleted
      if (this.candyBody && c.bodyB === this.candyBody && this.candyBody.gameObject && this.candyBody.gameObject.eaten) {
        continue;
      }

      if (currentChain.length === 0) {
        currentChain.push(c.bodyA.position, c.bodyB.position);
      } else {
        const lastPos = currentChain[currentChain.length - 1];
        if (lastPos === c.bodyA.position) {
          currentChain.push(c.bodyB.position);
        } else {
          chains.push(currentChain);
          currentChain = [c.bodyA.position, c.bodyB.position];
        }
      }
    }

    if (currentChain.length > 0) {
      chains.push(currentChain);
    }

    noFill();
    strokeCap(ROUND);
    strokeJoin(ROUND);

    for (let cIdx = 0; cIdx < chains.length; cIdx++) {
      const pts = chains[cIdx];
      if (pts.length < 2) continue;

      // Pass 1: Dark brown outer outline
      stroke(75, 45, 20, this.alpha);
      strokeWeight(6);
      this.drawSmoothChain(pts);

      // Pass 2: Warm hemp inner core
      stroke(198, 148, 88, this.alpha);
      strokeWeight(3.4);
      this.drawSmoothChain(pts);

      // Pass 3: Subtle lighter highlight along the rope
      stroke(230, 190, 135, this.alpha * 0.75);
      strokeWeight(1.2);
      this.drawSmoothChain(pts);
    }
  }

  /**
   * Draws a smooth curve through an array of {x, y} points using vertex interpolation
   * @param {Array<{x: number, y: number}>} pts
   */
  drawSmoothChain(pts) {
    if (pts.length === 2) {
      line(pts[0].x, pts[0].y, pts[1].x, pts[1].y);
      return;
    }

    beginShape();
    vertex(pts[0].x, pts[0].y);

    const steps = 8;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i];
      const p1 = pts[i + 1];
      const midX = (p0.x + p1.x) * 0.5;
      const midY = (p0.y + p1.y) * 0.5;

      if (i === 0) {
        vertex(midX, midY);
      } else {
        const prev = pts[i - 1];
        const startX = (prev.x + p0.x) * 0.5;
        const startY = (prev.y + p0.y) * 0.5;

        for (let s = 1; s <= steps; s++) {
          const t = s / steps;
          const invT = 1 - t;
          const qx = invT * invT * startX + 2 * invT * t * p0.x + t * t * midX;
          const qy = invT * invT * startY + 2 * invT * t * p0.y + t * t * midY;
          vertex(qx, qy);
        }
      }
    }

    const last = pts[pts.length - 1];
    vertex(last.x, last.y);
    endShape();
  }

  /**
   * Renders the anchor Pin at (pinX, pinY), using MechanicsAssets sprite if available or vector style.
   */
  renderPin() {
    push();
    translate(this.pinX, this.pinY);

    const drewSprite = (
      typeof MechanicsAssets !== 'undefined' &&
      MechanicsAssets &&
      typeof MechanicsAssets.drawImageOrRegion === 'function' &&
      MechanicsAssets.drawImageOrRegion(MechanicsAssets.pinImg, 0, 0, 28, 28)
    );

    if (drewSprite) {
      pop();
      return;
    }

    // Drop shadow
    noStroke();
    fill(30, 20, 10, 75);
    circle(1, 2.5, 24);

    // Outer metallic base ring
    stroke(38, 52, 64);
    strokeWeight(2.2);
    fill(104, 158, 198);
    circle(0, 0, 21);

    // Inner recess
    noStroke();
    fill(66, 108, 140);
    circle(1, 1.5, 13);

    // Center light-blue knob
    stroke(38, 52, 64);
    strokeWeight(1.8);
    fill(145, 222, 255);
    circle(0, 0, 9.5);

    // highlight dot
    noStroke();
    fill(255, 255, 255, 210);
    circle(-1.5, -1.5, 3);

    pop();
  }

  /**
   * Removes intermediate nodes and constraints from the physics world after fade-out, keeping the pin visual.
   */
  destroyNodesAndConstraints() {
    this.detachEvents();
    if (this.physicsWorld) {
      for (let i = 0; i < this.constraints.length; i++) {
        this.physicsWorld.removeConstraint(this.constraints[i]);
      }
      for (let i = 0; i < this.nodes.length; i++) {
        this.physicsWorld.removeBody(this.nodes[i]);
      }
    }
    this.constraints = [];
    this.nodes = [];
  }

  // Completely removes all bodies (including Pin) and constraints of this rope from PhysicsWorld.
  destroy() {
    this.destroyNodesAndConstraints();
    if (this.physicsWorld && this.pinBody) {
      this.physicsWorld.removeBody(this.pinBody);
    }
    this.pinBody = null;
    this.destroyed = true;
  }
}

// Global scope export
if (typeof window !== 'undefined') {
  window.Rope = Rope;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Rope };
}
