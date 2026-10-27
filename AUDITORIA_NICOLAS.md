# Documento de Auditoría y Plan de Acción — Nicolás
**Rol:** Entidades del Mundo y Diseño de Niveles  
**Fecha:** 27 de Octubre, 2026  
**Documento base:** `ComputacionVisual.md`  
**Estado:** Documento temporal de revisión interna (no versionar en README).

---

## 1. Estructura de Archivos bajo tu Responsabilidad

Como responsable de los actores y rompecabezas físicos del juego, eres dueño exclusivo de los siguientes archivos:

```text
CutTheRope/
├── src/entities/
│   ├── Candy.js            # Cuerpo dinámico del caramelo y renderizado de sprite
│   ├── Target.js           # Monstruo Om Nom (sensor de llegada, animaciones de boca y soporte)
│   ├── Collectibles.js     # Estrellas coleccionables (sensores de puntuación) [Púas opcionales aquí]
│   ├── LevelManager.js     # Constructor de los 3-4 niveles conectando entidades y cuerdas
│   ├── SpriteAnimation.js  # Motor de reproducción de frames para spritesheets
│   └── EntitiesAssets.js   # Precarga descentralizada de imágenes y audios de entidades
└── assets/entities/
    ├── candy_sprite.png    # Sprite del dulce
    ├── sprite.png          # Spritesheet completo de Om Nom (idle, openMouth, eating)
    ├── star_sprite.png     # Sprite de estrella
    ├── support_sprite.png  # Base/pedestal de madera de Om Nom
    ├── nom_nom.mp3         # Audio: Om Nom comiendo (FALTA AGREGAR)
    └── star.mp3            # Audio: estrella recolectada (FALTA AGREGAR)
```

### Organización y Arquitectura del Sistema de Sonido en Entidades:
* **Ubicación obligatoria:** Todos los efectos sonoros de interacción de juego deben residir en `assets/entities/`.
* **Carga descentralizada en `EntitiesAssets.preload()`:**
  ```javascript
  this.eatSound = new Audio('assets/entities/nom_nom.mp3');
  this.starSound = new Audio('assets/entities/star.mp3');
  ```
* **Regla de oro de muteo:** Antes de reproducir cualquier sonido en `Target` o `Star`, debes consultar:
  ```javascript
  if (typeof audioManager !== 'undefined' && audioManager && audioManager.isMuted) return;
  ```

---

## 2. Lo que está Bien Implementado

1. **`Candy.js` (Física del caramelo):**
   * Configuración física calibrada con `Bodies.circle`, densidad 0.02, restitución 0.25 y fricción de aire 0.001.
   * Asignación de categoría `CONFIG.COLLISION_CATEGORIES.CANDY` y etiqueta `CONFIG.LABELS.CANDY`.
   * Traslación y rotación gráfica sincronizada con `body.position` y `body.angle`.
2. **`SpriteAnimation.js` (Lógica de animación):**
   * Clase genérica bien modularizada con soporte de `frameRate`, `loop`, `reset()` y control de tiempo por delta.
   * Manejo de los 3 estados de Om Nom (respiración en reposo, boca abierta al acercarse el dulce y masticar en victoria).
3. **Detección de proximidad en `Target.js` (L41-56):**
   * Cálculo de distancia euclidiana `dist(candy, target)` comparada contra `DETECTION_RADIUS (150px)` para abrir la boca anticipadamente.
4. **`Collectibles.js` (`Star`):**
   * Rotación continua de la estrella, desactivación física al ser tocada y aviso al sistema de partículas.

---

## 3. Lo que está Mal Implementado (Bugs Críticos y Bloqueos)

1. 🔴 **FALTA CRÍTICA — Solo existe el Nivel 1 en `LevelManager.js`:**
   * El documento de especificación exigía **de 3 a 4 niveles con dificultad progresiva** (Nivel 1: Péndulo simple; Nivel 2: Dos cuerdas y sincronización; Nivel 3: Cuerda + Burbuja para subir; Nivel 4: Burbuja + Cojín de aire).
   * En `LevelManager.js`, `loadLevel(index)` tiene fijas las coordenadas del Nivel 1. No existe el arreglo de niveles ni los niveles 2, 3 o 4.
2. 🔴 **BUG CRÍTICO — `Target.js` NO es sensor y tiene un bloque sólido (L15-27):**
   * En el constructor escribiste:
     ```javascript
     this.body = Matter.Bodies.circle(x, y, radius, {
       label: CONFIG.LABELS.TARGET,
       isStatic: true // <-- FALTA isSensor: true
     });
     this.support = Matter.Bodies.rectangle(x, y + radius, radius, 5, { isStatic: true });
     ```
   * **Consecuencia:** Como `isSensor` no es `true` y agregas un rectángulo `support` sólido, el dulce choca y rebota contra Om Nom como una pelota contra una pared, en lugar de atravesar el centro de su boca para activar la victoria.
3. 🔴 **BUG CRÍTICO — Bloqueo síncrono del bucle gráfico (`LevelManager.js`, L104-106):**
   ```javascript
   async render() {
     ...
     if (this.target && this.target.reached && !this.winNotified) {
       this.winNotified = true;
       this.candy.delete();
       while (!eatingAnimation.isFinished) {
         await sleep(500); // <-- BLOQUEA ASÍNCRONAMENTE EL DRAW LOOP A 60 FPS
       }
       gameState.setWon();
     }
   }
   ```
   * `render()` se invoca 60 veces por segundo en el bucle principal de p5.js.
   * Ejecutar un `while` con `await sleep` dentro de un frame de dibujo causa promesas colgadas y hace que la interfaz se trabe.
4. 🔴 **Pérdida masiva de rendimiento en `Candy.render()` (L46-49):**
   ```javascript
   for (let i = 0; i < CANDY_SPRITES.length; i++) {
     this.sprites[i].mask(this.mascara.get()); // <-- CÁLCULO DE PÍXELES EN CPU A 60 FPS
     image(this.sprites[i], 0, 0, this.radius * 2, this.radius * 2);
   }
   ```
   * `.mask()` en p5.js opera directamente sobre los buffers de memoria de píxeles. Invocarlo 60 veces por segundo degrada drásticamente los FPS. La máscara debe aplicarse **una sola vez** durante `preload()`.
5. 🟡 **Fuga de cuerpos en `LevelManager` al reiniciar o cambiar de nivel:**
   * Al recargar el nivel con `loadLevel(1)`, no remueves los cuerpos ni las cuerdas del nivel anterior del motor de física, acumulando colisiones invisibles.

---

## 4. Lo que debe ser Eliminado en Producción, pero que en Desarrollo Funciona

1. **Método `click()` en `LevelManager.js` (L121-130):**
   ```javascript
   click() {
     this.candy.delete();
     this.candy = new Candy(this.physicsWorld, mouseX, mouseY, candySprites);
     return;
   }
   ```
   * Fue creado para reposicionar el dulce donde apuntaba el mouse. Debe eliminarse para que no altere la jugabilidad.
2. **Parámetro con coma residual en `Target.update` (L33):**
   * `update(candy, )` -> Sintaxis descuidada.

---

## 5. Lo que No Fue Considerado Inicialmente, pero Debe ser Agregado Sí o Sí

1. 🔴 **Diseño e implementación de los Niveles 2, 3 y 4 en `LevelManager.js`:**
   * **Nivel 2:** 2 puntos de anclaje (`Pin`) con cuerdas hacia el mismo caramelo, forzando a cortar la primera cuerda para balancearse y luego la segunda.
   * **Nivel 3:** 1 cuerda + 1 Burbuja (`new Bubble(...)`) colocada debajo para atrapar el caramelo y elevarlo hacia estrellas superiores.
   * **Nivel 4:** Burbuja para elevar + Cojín de aire (`new AirCushion(...)`) para empujarlo lateralmente hacia la boca de Om Nom.
2. 🔴 **Archivos de sonido y reproducción:**
   * Guardar `assets/entities/nom_nom.mp3` y reproducirlo en `Target.onCollide`.
   * Guardar `assets/entities/star.mp3` y reproducirlo en `Star.onCollide`.
3. 🔴 **Limpieza del nivel previo en `LevelManager`:**
   * Método `clearCurrentLevel()` que elimine cuerpos viejos de `physicsWorld` antes de poblar el siguiente nivel.

---

## 6. Lo que Puede Quedar como Deuda Técnica (No Afecta al Usuario Directamente)

1. **Dibujo procedural de estrellas vs `star_sprite.png`:**
   * El código actual dibuja la estrella con polígonos dorados (`beginShape`). Visualmente se ve impecable y gira muy bien, por lo que no es urgente usar el sprite png.
2. **Obstáculos de púas (`Spike`):**
   * El documento lo clasificaba como bonus opcional. Si no se incluye, el juego cumple todos los requisitos con los niveles y gimmicks.

---

## 7. Instrucciones Paso a Paso para Nicolás

### Paso 1: Corregir `Target.js` para que sea un sensor puro
Modifica el constructor en `src/entities/Target.js`:

```javascript
class Target {
  constructor(physicsWorld, x, y, radius = TARGET_RADIUS) {
    this.physicsWorld = physicsWorld;
    this.radius = radius;
    this.type = 'target';
    this.reached = false;
    this.mouthOpen = false;

    // Cuerpo estático SENSOR para no rebotar el caramelo
    this.body = Matter.Bodies.circle(x, y, radius * 0.7, {
      label: CONFIG.LABELS.TARGET,
      isStatic: true,
      isSensor: true
    });
    this.body.gameObject = this;
    this.physicsWorld.addBody(this.body);

    // NOTA: Eliminar this.support sólido; el pedestal se dibuja solo visualmente en render()
  }
```

### Paso 2: Corregir la transición de victoria en `LevelManager.js`
Elimina el `while sleep` y haz la función sincrónica:

```javascript
render() {
  for (const rope of this.ropes) rope?.render();
  if (this.target) {
    this.target.update(this.candy);
    this.target.render();
  }
  for (const star of this.stars) star.render();
  if (this.candy) this.candy.render();

  // Detección de victoria limpia sin bucle bloqueante
  if (this.target && this.target.reached && !this.winNotified) {
    this.winNotified = true;
    if (this.candy) this.candy.delete();

    // Esperar a que termine la animación de masticar y notificar al GameState
    setTimeout(() => {
      if (typeof gameState !== 'undefined' && gameState) {
        if (typeof gameState.setWon === 'function') gameState.setWon();
        else if (typeof gameState.changeState === 'function') gameState.changeState('LEVEL_WON');
      }
    }, 1200);
  }
}
```

### Paso 3: Optimizar `Candy.js`
En `EntitiesAssets.js`, aplica la máscara **una sola vez** al precargar:
```javascript
// En EntitiesAssets.preload():
const maskGfx = createGraphics(CANDY_RADIUS * 2, CANDY_RADIUS * 2);
maskGfx.fill(0);
maskGfx.circle(CANDY_RADIUS, CANDY_RADIUS, CANDY_RADIUS * 2);
candySprites.forEach(sprite => sprite.mask(maskGfx));
```
Y en `Candy.render()`, simplemente dibuja la imagen directa sin llamar a `.mask()` en cada frame.

### Paso 4: Armar el constructor de Niveles 1 a 3 en `LevelManager.js`
Estructura un diccionario o switch de niveles:
```javascript
loadLevel(index = 1) {
  this.clearCurrentLevel();
  this.currentLevel = index;
  this.collectedStars = 0;
  this.winNotified = false;

  const centerX = CONFIG.CANVAS_WIDTH / 2;
  const h = CONFIG.CANVAS_HEIGHT;

  if (index === 1) {
    // Nivel 1: Péndulo simple
    this.candy = new Candy(this.physicsWorld, centerX - 60, 140, candySprites);
    this.target = new Target(this.physicsWorld, centerX, h - 100);
    this.stars = [
      new Star(this.physicsWorld, centerX - 60, 260, 13, () => this.collectedStars++),
      new Star(this.physicsWorld, centerX, 330, 13, () => this.collectedStars++),
      new Star(this.physicsWorld, centerX + 60, 260, 13, () => this.collectedStars++)
    ];
    this.ropes.push(new Rope(centerX, 60, 8, this.candy.body));
  } else if (index === 2) {
    // Nivel 2: Dos cuerdas en tensión
    this.candy = new Candy(this.physicsWorld, centerX, 180, candySprites);
    this.target = new Target(this.physicsWorld, centerX, h - 100);
    this.stars = [
      new Star(this.physicsWorld, centerX, 280, 13, () => this.collectedStars++),
      new Star(this.physicsWorld, centerX - 80, 360, 13, () => this.collectedStars++),
      new Star(this.physicsWorld, centerX + 80, 360, 13, () => this.collectedStars++)
    ];
    this.ropes.push(new Rope(centerX - 100, 80, 7, this.candy.body));
    this.ropes.push(new Rope(centerX + 100, 80, 7, this.candy.body));
  } else if (index === 3) {
    // Nivel 3: Cuerda y Burbuja antigravedad
    this.candy = new Candy(this.physicsWorld, centerX, 130, candySprites);
    this.target = new Target(this.physicsWorld, centerX, 90); // Om Nom arriba
    this.stars = [
      new Star(this.physicsWorld, centerX, 240, 13, () => this.collectedStars++),
      new Star(this.physicsWorld, centerX, 340, 13, () => this.collectedStars++),
      new Star(this.physicsWorld, centerX, 440, 13, () => this.collectedStars++)
    ];
    this.ropes.push(new Rope(centerX, 55, 6, this.candy.body));
    new Bubble(this.physicsWorld, centerX, 320, 34); // Burbuja que atrapa el dulce al caer
  }
}
```
