# Documento de Auditoría y Plan de Acción — Ángel
**Rol:** Core, Motor Físico e Integración Base  
**Fecha:** 27 de Octubre, 2026  
**Documento base:** `ComputacionVisual.md`  
**Estado:** Documento temporal de revisión interna (no versionar en README).

---

## 1. Estructura de Archivos bajo tu Responsabilidad

Como líder del Core y la integración base, eres dueño exclusivo de los siguientes archivos:

```text
CutTheRope/
├── index.html                  # Carga de librerías en /lib y scripts en orden estricto
├── sketch.js                   # Ciclo de vida de p5.js (preload, setup, draw, inputs, outOfBounds)
├── lib/                        # Librerías estáticas de terceros
│   ├── matter.min.js           # Motor de física 2D
│   ├── p5.min.js               # Motor gráfico y canvas
│   └── p5.sound.min.js         # Módulo de audio oficial de p5.js
└── src/
    ├── config.js               # Constantes globales del Core (dimensiones, gravedad, etiquetas, categorías)
    └── core/
        └── PhysicsWorld.js     # Wrapper de Matter.Engine, Composite y despachador de eventos onCollide
```

### Organización y Arquitectura del Sistema de Sonido en el Core:
* **Responsabilidad de Ángel en Audio:**
  * No gestionas la síntesis ni los archivos de audio directos (eso corresponde a Farid, Nicolás y Ariadna).
  * **Tu tarea en `index.html`:** Asegurar la carga de `lib/p5.sound.min.js` inmediatamente después de `lib/p5.min.js`.
  * **Tu tarea en `sketch.js`:** En `setup()`, asegurar que `audioManager = new AudioManager(gameState);` se inicialice antes que cualquier entidad que requiera consultar el estado de silencio (`audioManager.isMuted`).
  * **Ubicación centralizada de audio en el proyecto:**
    * `assets/ui/` -> Música de fondo y SFX de interfaz (Ariadna).
    * `assets/mechanics/` -> `slice.mp3` y `pop.mp3` (Farid).
    * `assets/entities/` -> `nom_nom.mp3` y `star.mp3` (Nicolás).
  * En `index.html`, **debe eliminarse el tag `<audio id="menu-music">` hardcodeado** (L16); el audio debe instanciarse mediante código en `AudioManager.js`.

---

## 2. Lo que está Bien Implementado

1. **Librerías locales en `/lib`:**
   * Las tres librerías (`matter.min.js`, `p5.min.js`, `p5.sound.min.js`) están correctamente descargadas, son versiones compatibles y no dependen de CDNs externos.
2. **Secuencia de scripts en `index.html` (L18-49):**
   * El orden respeta estrictamente el grafo de dependencias: Librerías -> Configuración & Core -> Mecánicas -> Entidades -> UI -> `sketch.js`.
3. **Despacho de colisiones en `PhysicsWorld.js` (L36-53):**
   * El hook en `Matter.Events.on(this.engine, 'collisionStart', ...)` inspecciona `bodyA.gameObject` y `bodyB.gameObject` y llama automáticamente a `.onCollide()`. Cumple al 100% el contrato de integración.
4. **API de `PhysicsWorld` (L59-114):**
   * Métodos `addBody`, `removeBody`, `addConstraint`, `removeConstraint` y `update` con soporte para elementos individuales o colecciones tipo Array.
5. **Máquina de estados en el ciclo de dibujado (`sketch.js`, L125-203):**
   * La separación limpia del `draw()` mediante `switch(currentState)` para `LOADING`, `MENU`, `PLAYING` y estados de fin de partida está muy bien orquestada.

---

## 3. Lo que está Mal Implementado (Bugs y Antipatrones)

1. 🔴 **CRÍTICO — Funciones `mousePressed()` y `mouseReleased()` duplicadas (`sketch.js`):**
   * En las líneas **25-36** tienes:
     ```javascript
     function mousePressed() {
       if (candy) candy.pressed();
     }
     function mouseReleased() {
       if (candy) candy.released();
     }
     ```
   * En las líneas **280-323** vuelves a definir `mousePressed()` y `mouseReleased()` para el `customCursor`, `uiManager` y `cutter`.
   * **Consecuencia:** JavaScript sobreescribe por completo la primera versión. El dulce nunca recibe eventos de clic directo.
   * **Solución:** Unificar en una sola función `mousePressed()` y una sola `mouseReleased()`.
2. 🔴 **CRÍTICO — `keyPressed()` sin validación defensiva (`sketch.js`, L325-327):**
   ```javascript
   function keyPressed() {
     levelManager.click();
   }
   ```
   Si el jugador toca cualquier tecla del teclado en el menú de carga o en el menú principal, `levelManager.click()` lanzará un error fatal `Cannot read properties of undefined`.
3. 🟡 **Antipatrón del ciclo de vida p5.js (`sketch.js`, L41 y L63):**
   * Declaraste `async function preload()`. p5.js no es una función asíncrona estándar y maneja internamente las promesas de `loadImage/loadSound`.
   * En `setup()` escribiste `await preload();`. Esto provoca que los recursos se carguen dos veces.
4. 🟡 **Contaminación de `src/config.js`:**
   * El contrato de arquitectura asignaba a Ángel y Farid definir la configuración base (`CANVAS_WIDTH`, `CANVAS_HEIGHT`, `GRAVITY_Y`, `LABELS`, `COLLISION_CATEGORIES`).
   * Actualmente `src/config.js` tiene más de 140 líneas con constantes de sprites de Nicolás (`OMNOM_SPRITES`, `CANDY_SPRITES`, `SUPPORT_SPRITE`) y constantes de Farid (`ROPE_*`, `CUTTER_*`, `BUBBLE_*`). Rompe la regla de propiedad de archivos.
5. 🟡 **`clearWorld()` en `PhysicsWorld.js` (L102-105):**
   ```javascript
   this.World.clear(this.world, false);
   this.Engine.clear(this.engine);
   ```
   Llamar a `Engine.clear()` destruye estructuras internas del motor mientras que los listeners de eventos (`collisionStart`) persisten registrados en la instancia vieja de `engine`. Debe usarse `Composite.clear(this.world, false)` para vaciar cuerpos sin desarmar el motor.

---

## 4. Lo que debe ser Eliminado en Producción, pero que en Desarrollo Funciona

1. **La función `keyPressed()` en `sketch.js` (L325-327):**
   * Fue colocada para probar manualmente el dulce invocando `levelManager.click()`. En producción debe eliminarse para que las teclas no generen comportamientos anómalos.
2. **Variables globales no utilizadas en `sketch.js` (L18-24):**
   ```javascript
   let candySprites;
   let supportSprite;
   let idleAnimation;
   let openMouthAnimation;
   let eatingAnimation;
   ```
   Estas variables pertenecen al ámbito de Nicolás (`EntitiesAssets.js`) y ensucian el ámbito global del orquestador.
3. **Tag `<audio id="menu-music">` en `index.html` (L16):**
   * El elemento DOM `<audio>` estático debe eliminarse; Ariadna ya maneja el audio dinámicamente en `AudioManager.js`.

---

## 5. Lo que No Fue Considerado Inicialmente, pero Debe ser Agregado Sí o Sí

1. **Detección de salida en eje horizontal (X) en `checkOutOfBounds()`:**
   * La especificación original solo consideraba `candy.y > CONFIG.CANVAS_HEIGHT + 50`.
   * **Requerimiento:** Si el caramelo es impulsado hacia los lados fuera de la vista ($X < -50$ o $X > CANVAS\_WIDTH + 50$), debe disparar `LEVEL_LOST` inmediatamente para no dejar la partida congelada.
2. **Método de reseteo del mundo físico coordinado:**
   * Añadir en `PhysicsWorld` un método `resetForNewLevel()` que elimine todos los cuerpos dinámicos y constraints, conservando los listeners de eventos.

---

## 6. Lo que Puede Quedar como Deuda Técnica (No Afecta al Usuario Directamente)

1. **Paso de delta dinámico en `PhysicsWorld.update()`:**
   * Actualmente usa `1000/60` (fijo a 60 FPS). Si la pantalla corre a 120Hz o hay pequeñas caídas de frames, la física puede variar imperceptiblemente, pero no impide jugar.
2. **Uso mixto de `World.add` y `Composite.add`:**
   * En Matter.js `World` hereda de `Composite`. Aunque es una inconsistencia estilística en el código, funciona sin fallos.
3. **Extracción de constantes ajenas fuera de `config.js`:**
   * Si bien viola la pureza de responsabilidades, no genera ningún bug en tiempo de ejecución. Puede reorganizarse al final.

---

## 7. Instrucciones Paso a Paso para Ángel

### Paso 1: Corregir los eventos de mouse en `sketch.js`
Reemplaza las funciones duplicadas eliminando las líneas 25-36 y consolidando en la sección de INPUTS (L280):

```javascript
function mousePressed() {
  if (customCursor) customCursor.onPress(mouseX, mouseY);
  if (uiManager && typeof uiManager.handleClick === 'function') {
    if (uiManager.handleClick(mouseX, mouseY)) return;
  }
  if (levelManager && typeof levelManager.handleClick === 'function') {
    if (levelManager.handleClick(mouseX, mouseY)) return;
  }
  if (cutter && typeof cutter.onPress === 'function') {
    cutter.onPress(mouseX, mouseY);
  }
}

function mouseDragged() {
  if (customCursor) customCursor.onDrag(mouseX, mouseY);
  if (cutter && typeof cutter.onDrag === 'function') {
    cutter.onDrag(mouseX, mouseY);
  }
}

function mouseReleased() {
  if (customCursor) customCursor.onRelease();
  if (cutter && typeof cutter.onRelease === 'function') {
    cutter.onRelease();
  }
}
```

### Paso 2: Proteger y desactivar `keyPressed()`
```javascript
function keyPressed() {
  // Desactivado para producción. Descomentar solo para pruebas locales:
  // if (levelManager && typeof levelManager.click === 'function') levelManager.click();
}
```

### Paso 3: Corregir `checkOutOfBounds()` en `sketch.js`
```javascript
function checkOutOfBounds() {
  let candyPos = null;
  if (levelManager && levelManager.candy && levelManager.candy.body) {
    candyPos = levelManager.candy.body.position;
  }

  if (!candyPos) return;

  const outY = candyPos.y > CONFIG.CANVAS_HEIGHT + 50;
  const outX = candyPos.x < -50 || candyPos.x > CONFIG.CANVAS_WIDTH + 50;

  if (outY || outX) {
    if (gameState && typeof gameState.setLost === 'function') {
      gameState.setLost();
    } else if (gameState && typeof gameState.changeState === 'function') {
      gameState.changeState('LEVEL_LOST');
    }
  }
}
```

### Paso 4: Eliminar el tag `<audio>` de `index.html`
Borrar la línea 16 de `index.html`.
