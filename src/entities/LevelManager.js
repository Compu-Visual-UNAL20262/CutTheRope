
/**
 * src/entities/LevelManager.js
 * Builds each level.
 */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
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
    this.lossStarted = false;
    this.lossNotified = false;
    this.candy_sprites = candySprites;
  }

  clearCurrentLevel(){
    this.candy = null;
    this.target = null;
    this.stars = [];
    this.ropes = [];
  }

  loadLevel(index = 1) {
    this.clearCurrentLevel();
    this.currentLevel = index;
    this.collectedStars = 0;
    this.winNotified = false;
    this.lossStarted = false;
    this.lossNotified = false;

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

  async render() {
    // Dibujar primero las cuerdas.
    for (const rope of this.ropes) rope?.render();

    if (this.target) {
      this.target.update(this.candy);
      this.target.render();
    }

    for (const star of this.stars) star.render();

    if (this.candy) this.candy.render();

    if (this.target && this.target.reached && !this.winNotified) {
      this.winNotified = true;
      if (this.candy) this.candy.delete();

      // Esperar a que termine la animación de masticar y notificar al GameState
      setTimeout(() => {
        if (typeof gameState !== 'undefined' && gameState) {
          if (typeof gameState.setWon === 'function') gameState.setWon();
          else if (typeof gameState.changeState === 'function') gameState.changeState('LEVEL_WON');
        }
      }, 2000);
    }


    if (this.target && this.target.lost && !this.lossNotified && sadAnimation.isFinished) {
      this.lossNotified = true;

      if (typeof gameState !== 'undefined' && gameState) {
        if (typeof gameState.setLost === 'function') {
          gameState.setLost();
        } else if (typeof gameState.changeState === 'function') {
          gameState.changeState('LEVEL_LOST');
        }
      }
    }
  }

  startLossAnimation() {
    if (this.lossStarted || !this.target || this.target.reached) return;

    this.lossStarted = true;
    this.target.onLost();
  }

  click(){
    this.candy.delete();
    this.candy = new Candy(
      this.physicsWorld,
      mouseX,
      mouseY,
      candySprites
    );
    return
  }
}
