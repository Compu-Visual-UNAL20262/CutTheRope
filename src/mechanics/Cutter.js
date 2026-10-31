/**
 * src/mechanics/Cutter.js
 * Mouse/touch swipe tracking, blade visual trail, and 2D line-segment intersection
 * to sever active Matter.Constraint links in ropes.
 * Responsibility: Farid [BASE + Mechanics]
 */

class Cutter {
  constructor() {
    this.isSlicing = false;
    this.prevX = null;
    this.prevY = null;

    // Blade slash trail points: { x, y, life }
    this.bladeTrail = [];

    // Local visual bursts & rope fiber particles on cut: { x, y, vx, vy, size, angle, vRot, life, maxLife, isFlash }
    this.cutBursts = [];

    // Set of ropes already severed during the current frame/step to avoid multi-shredding
    this.cutCooldownMap = new WeakMap();
  }

  /**
   * Checks whether the game is currently in the active PLAYING state.
   * @returns {boolean}
   */
  isPlayingState() {
    if (typeof gameState !== 'undefined' && gameState && gameState.currentState) {
      return gameState.currentState === 'PLAYING';
    }
    return true;
  }

  /**
   * Starts a swipe path when mouse/touch is pressed.
   * @param {number} x
   * @param {number} y
   */
  onPress(x, y) {
    if (!this.isPlayingState()) return;

    // If the user clicked on an active captured Bubble, pop it instead of starting a cut
    if (typeof Bubble !== 'undefined' && typeof Bubble.handleGlobalClick === 'function') {
      if (Bubble.handleGlobalClick(x, y)) {
        return;
      }
    }

    // If the user clicked on an AirCushion, puff it instead of starting a cut
    if (typeof AirCushion !== 'undefined' && typeof AirCushion.handleGlobalClick === 'function') {
      if (AirCushion.handleGlobalClick(x, y)) {
        return;
      }
    }

    this.isSlicing = true;
    this.prevX = x;
    this.prevY = y;

    this.addTrailPoint(x, y);
  }

  /**
   * Extends the swipe path and checks for intersections against active ropes.
   * @param {number} x
   * @param {number} y
   */
  onDrag(x, y) {
    if (!this.isPlayingState()) {
      this.isSlicing = false;
      return;
    }

    if (!this.isSlicing) {
      this.isSlicing = true;
      this.prevX = x;
      this.prevY = y;
      this.addTrailPoint(x, y);
      return;
    }

    if (this.prevX !== null && this.prevY !== null) {
      const distMoved = Math.hypot(x - this.prevX, y - this.prevY);
      if (distMoved > 0.5) {
        this.checkRopeCuts(
          { x: this.prevX, y: this.prevY },
          { x: x, y: y }
        );
        this.addTrailPoint(x, y);
        this.prevX = x;
        this.prevY = y;
      }
    } else {
      this.prevX = x;
      this.prevY = y;
      this.addTrailPoint(x, y);
    }
  }

  /**
   * Ends the current swipe gesture.
   */
  onRelease() {
    this.isSlicing = false;
    this.prevX = null;
    this.prevY = null;
  }

  /**
   * Appends a point to the blade visual trail.
   * @param {number} x
   * @param {number} y
   */
  addTrailPoint(x, y) {
    const maxTrail = typeof CUTTER_MAX_TRAIL !== 'undefined' ? CUTTER_MAX_TRAIL : 14;
    this.bladeTrail.unshift({
      x: x,
      y: y,
      life: 1.0
    });

    if (this.bladeTrail.length > maxTrail) {
      this.bladeTrail.pop();
    }
  }

  /**
   * Updates blade trail decay, local cut particles, and 60 FPS continuous slice detection.
   */
  update() {
    // 60 FPS continuous synchronization with p5 mouse state during PLAYING
    if (
      this.isPlayingState() &&
      typeof mouseIsPressed !== 'undefined' &&
      typeof mouseX === 'number' &&
      typeof mouseY === 'number'
    ) {
      if (mouseIsPressed) {
        if (!this.isSlicing) {
          this.onPress(mouseX, mouseY);
        } else {
          this.onDrag(mouseX, mouseY);
        }
      } else if (this.isSlicing) {
        this.onRelease();
      }
    }

    // Decay blade trail
    const decay = typeof CUTTER_TRAIL_DECAY !== 'undefined' ? CUTTER_TRAIL_DECAY : 0.12;
    for (let i = 0; i < this.bladeTrail.length; i++) {
      this.bladeTrail[i].life -= decay;
    }
    this.bladeTrail = this.bladeTrail.filter(pt => pt.life > 0);

    // Update cut bursts and rope fiber particles
    for (let i = 0; i < this.cutBursts.length; i++) {
      const p = this.cutBursts[i];
      if (!p.isFlash) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.18; // gravity on rope fibers
        p.vx *= 0.95;
        p.angle += p.vRot;
      }
      p.life -= p.decay;
    }
    this.cutBursts = this.cutBursts.filter(p => p.life > 0);
  }

  /**
   * Tests swipe segment A->B against all active ropes in LevelManager.
   * @param {{x: number, y: number}} pA - Swipe start point
   * @param {{x: number, y: number}} pB - Swipe end point
   */
  checkRopeCuts(pA, pB) {
    if (typeof levelManager === 'undefined' || !levelManager || !Array.isArray(levelManager.ropes)) {
      return;
    }

    const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
    const ropes = levelManager.ropes;

    for (let r = 0; r < ropes.length; r++) {
      const rope = ropes[r];
      if (!rope || rope.destroyed || typeof rope.getActiveSegments !== 'function') {
        continue;
      }

      // Brief cooldown (120ms) on the same rope so a single swipe cleanly cuts it in two
      const lastCutTime = this.cutCooldownMap.get(rope);
      if (lastCutTime !== undefined && now - lastCutTime < 120) {
        continue;
      }

      const segments = rope.getActiveSegments();
      let hitConstraint = null;
      let hitPoint = null;

      for (let s = 0; s < segments.length; s++) {
        const seg = segments[s];
        const intersection = this.segmentsIntersect(pA, pB, seg.p1, seg.p2);
        if (intersection) {
          hitConstraint = seg.constraint;
          hitPoint = intersection;
          break;
        }
      }

      if (hitConstraint && typeof rope.removeConstraint === 'function') {
        const cutCoords = rope.removeConstraint(hitConstraint) || hitPoint;
        this.cutCooldownMap.set(rope, now);

        if (cutCoords) {
          this.onRopeSevered(cutCoords.x, cutCoords.y, pA, pB);
        }
      }
    }
  }

  /**
   * Evaluates 2D intersection (or close blade proximity) between segment p1->p2 and segment p3->p4.
   * @param {{x: number, y: number}} p1
   * @param {{x: number, y: number}} p2
   * @param {{x: number, y: number}} p3
   * @param {{x: number, y: number}} p4
   * @returns {{x: number, y: number}|null} Intersection coordinates or null
   */
  segmentsIntersect(p1, p2, p3, p4) {
    const x1 = p1.x, y1 = p1.y;
    const x2 = p2.x, y2 = p2.y;
    const x3 = p3.x, y3 = p3.y;
    const x4 = p4.x, y4 = p4.y;

    // 1. Exact parametric line-segment intersection
    const denom = (x2 - x1) * (y4 - y3) - (y2 - y1) * (x4 - x3);
    if (Math.abs(denom) > 1e-6) {
      const t = ((x3 - x1) * (y4 - y3) - (y3 - y1) * (x4 - x3)) / denom;
      const u = ((x3 - x1) * (y2 - y1) - (y3 - y1) * (x2 - x1)) / denom;

      if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
        return {
          x: x1 + t * (x2 - x1),
          y: y1 + t * (y2 - y1)
        };
      }
    }

    // 2. Blade radius tolerance check (prevents fast swipes from slipping through adjacent node joints)
    const hitRadius = typeof CUTTER_HIT_RADIUS !== 'undefined' ? CUTTER_HIT_RADIUS : 5;
    const midRope = { x: (x3 + x4) * 0.5, y: (y3 + y4) * 0.5 };
    if (this.pointToSegmentDistance(midRope, p1, p2) <= hitRadius) {
      return midRope;
    }

    return null;
  }

  /**
   * Computes the minimum Euclidean distance from point P to line segment A->B.
   * @param {{x: number, y: number}} p
   * @param {{x: number, y: number}} a
   * @param {{x: number, y: number}} b
   * @returns {number}
   */
  pointToSegmentDistance(p, a, b) {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const lenSq = dx * dx + dy * dy;

    if (lenSq < 1e-6) {
      return Math.hypot(p.x - a.x, p.y - a.y);
    }

    const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / lenSq));
    const projX = a.x + t * dx;
    const projY = a.y + t * dy;

    return Math.hypot(p.x - projX, p.y - projY);
  }

  /**
   * Triggers audio, external ParticleSystem notification, and local fiber burst when a rope is cut.
   * @param {number} x
   * @param {number} y
   * @param {{x: number, y: number}} pA
   * @param {{x: number, y: number}} pB
   */
  onRopeSevered(x, y, pA, pB) {
    // 1. Play slice sound effect
    this.playSliceSound();

    // 2. Notify Ariadna's ParticleSystem if available
    if (
      typeof particleSystem !== 'undefined' &&
      particleSystem &&
      typeof particleSystem.emitRopeCut === 'function'
    ) {
      particleSystem.emitRopeCut(x, y);
    }

    // 3. Spawn local slash flash and brown rope-fiber particles
    const slashAngle = Math.atan2(pB.y - pA.y, pB.x - pA.x);
    this.cutBursts.push({
      x: x,
      y: y,
      angle: slashAngle,
      life: 1.0,
      decay: 0.14,
      isFlash: true
    });

    for (let i = 0; i < 10; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.2 + Math.random() * 3.2;
      this.cutBursts.push({
        x: x + (Math.random() - 0.5) * 6,
        y: y + (Math.random() - 0.5) * 6,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.0,
        size: 3 + Math.random() * 3.5,
        angle: Math.random() * Math.PI,
        vRot: (Math.random() - 0.5) * 0.25,
        r: 165 + Math.floor(Math.random() * 55),
        g: 115 + Math.floor(Math.random() * 45),
        b: 60 + Math.floor(Math.random() * 30),
        life: 1.0,
        decay: 0.04 + Math.random() * 0.025,
        isFlash: false
      });
    }
  }

  /**
   * Plays assets/mechanics/slice.mp3 from MechanicsAssets respecting audioManager.isMuted.
   */
  playSliceSound() {
    if (typeof audioManager !== 'undefined' && audioManager && audioManager.isMuted) {
      return;
    }

    if (
      typeof MechanicsAssets !== 'undefined' &&
      MechanicsAssets &&
      MechanicsAssets.sliceSound
    ) {
      try {
        const snd = MechanicsAssets.sliceSound;
        if (typeof snd.play === 'function') {
          if (typeof snd.currentTime === 'number') {
            snd.currentTime = 0;
          }
          const playPromise = snd.play();
          if (playPromise && typeof playPromise.catch === 'function') {
            playPromise.catch(() => {});
          }
        }
      } catch (err) {
        // Ignore browser autoplay restrictions
      }
    }
  }

  /**
   * Renders active gimmicks (if not already rendered this frame), blade slash trail, and cut bursts in p5.js.
   */
  render() {
    push();

    const currFrame = typeof frameCount === 'number' ? frameCount : -999;

    // 1. Render active AirCushion instances if LevelManager did not already draw them this frame
    if (typeof AirCushion !== 'undefined' && Array.isArray(AirCushion.activeInstances)) {
      for (let i = 0; i < AirCushion.activeInstances.length; i++) {
        const c = AirCushion.activeInstances[i];
        if (c && !c.destroyed && c._lastRenderFrame !== currFrame) {
          c.render();
        }
      }
    }

    // 2. Prune stale Bubble instances and render active ones if not already drawn this frame
    if (typeof Bubble !== 'undefined') {
      if (typeof Bubble.pruneStaleInstances === 'function') {
        Bubble.pruneStaleInstances();
      }
      if (Array.isArray(Bubble.activeInstances)) {
        for (let i = 0; i < Bubble.activeInstances.length; i++) {
          const b = Bubble.activeInstances[i];
          if (b && !b.destroyed && b._lastRenderFrame !== currFrame) {
            b.render();
          }
        }
      }
    }

    this.renderBladeTrail();
    this.renderCutBursts();

    pop();
  }

  /**
   * Draws a sharp, glowing blade ribbon along the swipe trajectory.
   */
  renderBladeTrail() {
    if (this.bladeTrail.length < 2) return;

    const maxWidth = typeof CUTTER_BLADE_WIDTH !== 'undefined' ? CUTTER_BLADE_WIDTH : 9;

    noFill();
    strokeCap(ROUND);
    strokeJoin(ROUND);

    // Outer cyan-blue blade glow
    for (let i = 0; i < this.bladeTrail.length - 1; i++) {
      const p1 = this.bladeTrail[i];
      const p2 = this.bladeTrail[i + 1];
      const t = (1 - i / this.bladeTrail.length) * p1.life;

      stroke(130, 225, 255, Math.floor(170 * t));
      strokeWeight(Math.max(1.5, maxWidth * t));
      line(p1.x, p1.y, p2.x, p2.y);
    }

    // Razor-sharp white inner edge
    for (let i = 0; i < this.bladeTrail.length - 1; i++) {
      const p1 = this.bladeTrail[i];
      const p2 = this.bladeTrail[i + 1];
      const t = (1 - i / this.bladeTrail.length) * p1.life;

      stroke(255, 255, 255, Math.floor(245 * t));
      strokeWeight(Math.max(1, maxWidth * 0.42 * t));
      line(p1.x, p1.y, p2.x, p2.y);
    }
  }

  /**
   * Draws the slash flash and flying rope fibers when a rope is severed.
   */
  renderCutBursts() {
    if (this.cutBursts.length === 0) return;

    for (let i = 0; i < this.cutBursts.length; i++) {
      const p = this.cutBursts[i];
      push();
      translate(p.x, p.y);
      rotate(p.angle);

      if (p.isFlash) {
        const len = 22 * p.life;
        stroke(255, 255, 255, Math.floor(240 * p.life));
        strokeWeight(3 * p.life);
        line(-len, 0, len, 0);

        noStroke();
        fill(255, 240, 170, Math.floor(190 * p.life));
        circle(0, 0, 14 * p.life);
      } else {
        // Short rope fiber piece
        stroke(75, 45, 20, Math.floor(220 * p.life));
        strokeWeight(2.5);
        line(-p.size * 0.5, 0, p.size * 0.5, 0);

        stroke(p.r, p.g, p.b, Math.floor(255 * p.life));
        strokeWeight(1.5);
        line(-p.size * 0.45, 0, p.size * 0.45, 0);
      }

      pop();
    }
  }
}

// Global scope export
if (typeof window !== 'undefined') {
  window.Cutter = Cutter;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Cutter };
}
