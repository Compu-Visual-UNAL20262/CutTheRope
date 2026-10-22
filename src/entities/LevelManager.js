
/**
 * src/entities/LevelManager.js
 * Builds each level.
 */

class LevelManager {
  constructor(physicsWorld) {
    this.physicsWorld = physicsWorld;

    this.candy = null;
    this.target = null;
    this.stars = [];
    this.ropes = [];

    this.currentLevel = 1;
    this.collectedStars = 0;
    this.winNotified = false;
    this.candy_sprites = candySprites;
  }

  loadLevel(index = 1) {
    this.currentLevel = index;
    this.collectedStars = 0;
    this.winNotified = false;

    const w = CONFIG.CANVAS_WIDTH;
    const h = CONFIG.CANVAS_HEIGHT;
    const centerX = w / 2;

    // Creating entities
    this.candy = new Candy(
      this.physicsWorld,
      centerX-50,
      130,
      candySprites
    );

    this.target = new Target(
    this.physicsWorld,
    centerX,
    h-110);

    const starPositions = [
      { x: centerX - 85, y: 270 },
      { x: centerX,      y: 340 },
      { x: centerX + 85, y: 270 }
    ];

    this.stars = starPositions.map(pos =>
      new Star(
        this.physicsWorld,
        pos.x,
        pos.y,
        13,
        () => {
          this.collectedStars++;
        }
      )
    );

    // 4. Conectar la cuerda de Farid si ya está disponible.
    // La firma acordada es Rope(pinX, pinY, segments, candyBody).
    if (typeof Rope !== 'undefined') {
      const rope = new Rope(
        centerX,
        55,
        8,
        this.candy.body
      );

      this.ropes.push(rope);
    }
  }

  render() {
    // Dibujar primero las cuerdas.
    for (const rope of this.ropes) {
      if (rope && typeof rope.render === 'function') {
        rope.render();
      }
    }

    // Actualizar la expresión del monstruo.
    if (this.target && this.candy) {
      this.target.update(this.candy);
      this.target.render();
    }

    // Dibujar estrellas.
    for (const star of this.stars) {
      star.render();
    }

    // Dibujar el dulce.
    if (this.candy) {
      this.candy.render();
    }

    // Notificar la victoria una sola vez.
    if (this.target && this.target.reached && !this.winNotified) {
      this.winNotified = true;

      if (
        typeof gameState !== 'undefined' &&
        gameState
      ) {
        if (typeof gameState.setWon === 'function') {
          gameState.setWon();
        } else if (typeof gameState.changeState === 'function') {
          gameState.changeState('LEVEL_WON');
        }
      }
    }
  }
}
