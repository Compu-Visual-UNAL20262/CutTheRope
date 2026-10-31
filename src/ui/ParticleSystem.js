class ParticleSystem {
  constructor() {
    this.particles = [];
  }

  // Chispas doradas al recolectar estrella
  emitStarBurst(x, y) {
    for (let i = 0; i < 16; i++) {
      const angle = (i / 16) * Math.PI * 2 + (Math.random() - 0.5) * 0.3;
      const speed = 2.0 + Math.random() * 4.0;
      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 4 + Math.random() * 4,
        color: [255, 215 + Math.random() * 40, 50],
        alpha: 255,
        decay: 6 + Math.random() * 4,
        shape: 'star'
      });
    }
  }

  // Fibras marrones al cortar cuerda
  emitRopeCut(x, y) {
    for (let i = 0; i < 10; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.0 + Math.random() * 3.0;
      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.0,
        size: 3 + Math.random() * 3,
        color: [180, 130, 75],
        alpha: 255,
        decay: 8 + Math.random() * 4,
        shape: 'fiber'
      });
    }
  }

  // Confeti festivo en victoria
  emitConfetti() {
    const colors = [
      [255, 90, 95], [90, 220, 255], [255, 225, 75], [120, 230, 90], [210, 110, 255]
    ];
    for (let i = 0; i < 45; i++) {
      this.particles.push({
        x: Math.random() * width,
        y: -10 - Math.random() * 30,
        vx: (Math.random() - 0.5) * 3,
        vy: 2.5 + Math.random() * 3.5,
        size: 6 + Math.random() * 5,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 255,
        decay: 2.5,
        shape: 'confetti',
        rotation: Math.random() * Math.PI,
        vRot: (Math.random() - 0.5) * 0.2
      });
    }
  }

  update() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= p.decay;

      if (p.shape === 'confetti') {
        p.rotation += p.vRot;
      } else {
        p.vy += 0.15; // Gravedad suave
      }

      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  render() {
    if (this.particles.length === 0) return;
    push();
    noStroke();
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      fill(p.color[0], p.color[1], p.color[2], p.alpha);

      if (p.shape === 'confetti') {
        push();
        translate(p.x, p.y);
        rotate(p.rotation);
        rectMode(CENTER);
        rect(0, 0, p.size, p.size * 0.6);
        pop();
      } else {
        circle(p.x, p.y, p.size);
      }
    }
    pop();
  }
}

if (typeof window !== 'undefined') {
  window.ParticleSystem = ParticleSystem;
}
