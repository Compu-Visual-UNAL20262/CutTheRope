# Documento de Auditoría y Plan de Acción — Farid
**Rol:** Mecánicas de Cuerdas, Corte (Slicing) y Fuerzas  
**Fecha:** 27 de Octubre, 2026  
**Documento base:** `ComputacionVisual.md`  
**Estado:** Documento temporal de revisión interna (no versionar en README).

---

## 1. Estructura de Archivos bajo tu Responsabilidad

Como responsable de la física interactiva del juego, eres dueño exclusivo de los siguientes archivos:

```text
CutTheRope/
├── src/mechanics/
│   ├── Rope.js             # Cadenas de Matter.Constraint, anclaje estático (Pin) y render p5.js
│   ├── Cutter.js           # Rastro de cuchilla, detección de intersección y corte de Constraints
│   └── Gimmicks.js         # Mecánicas especiales: Burbuja (Bubble), Cojín de Aire (AirCushion) y loader
└── assets/mechanics/
    ├── bubble_sheet.png    # Spritesheet de burbuja en vuelo
    ├── bubble_attached.png # Spritesheet de burbuja envolviendo el caramelo
    ├── cushion.png         # Sprite del cojín de aire (FALTA AGREGAR)
    ├── pin.png             # Sprite del botón/anclaje de cuerda (FALTA AGREGAR)
    ├── slice.mp3           # Efecto de sonido: corte de cuerda (FALTA AGREGAR)
    ├── pop.mp3             # Efecto de sonido: explosión de burbuja (FALTA AGREGAR)
    └── cushion.mp3         # Efecto de sonido: soplo/impulso de aire (FALTA AGREGAR)
```

### Organización y Arquitectura del Sistema de Sonido en Mecánicas:
* **Ubicación obligatoria:** Todos los efectos sonoros de corte e impulsos deben residir en `assets/mechanics/`.
* **Carga descentralizada:**
  * En `MechanicsAssets.preload()`, debes precargar:
    * `this.sliceSound = new Audio('assets/mechanics/slice.mp3');`
    * `this.popSound = new Audio('assets/mechanics/pop.mp3');`
    * `this.cushionSound = new Audio('assets/mechanics/cushion.mp3');`
  * **Regla de oro de muteo:** Antes de reproducir cualquier audio, debes verificar:
    ```javascript
    if (typeof audioManager !== 'undefined' && audioManager && audioManager.isMuted) return;
    ```
    (Actualmente ya lo haces en `Cutter.playSliceSound` y `Bubble.playPopSound`, lo cual es excelente).

---

## 2. Lo que está Bien Implementado

1. **`Rope.js` (Excelente nivel de detalle físico y estético):**
   * Encadenamiento con `Matter.Constraint` y `Bodies.circle` para nodos intermediarios.
   * Filtro de colisión correcto: categoría `0x0004` (`ROPE`) y `mask: 0` para evitar que la cuerda colisione consigo misma o empuje al dulce como un sólido.
   * Renderizado en 3 capas de color (borde exterior, cuerpo de cáñamo y reflejo de luz) con interpolación de curvas Bezier cuadráticas multi-tramo (`drawSmoothChain`).
   * Desvanecimiento visual progresivo (`fade-out`) al cortar un segmento antes de limpiar los cuerpos del motor físico.
   * Anclaje estático (`Pin`) con renderizado vectorial de respaldo muy pulido.
2. **`Cutter.js`:**
   * Trazado de cuchilla de alta luminosidad (resplandor cyan + centro blanco puro).
   * Intersección paramétrica de segmentos 2D con verificación matemática rigurosa ($0 \le t \le 1$ y $0 \le u \le 1$).
   * Tolerancia radial de impacto (`CUTTER_HIT_RADIUS`) para que swipes rápidos no se salten uniones de nodos.
   * Partículas visuales locales de fibras de soga y chispas al rebanar.
3. **`Bubble` en `Gimmicks.js`:**
   * Conexión directa al hook `beforeUpdate` de Matter.js para inyectar flotabilidad (`applyForce`) en cada frame superando la gravedad.
   * Amortiguamiento suave de la velocidad terminal vertical (`BUBBLE_MAX_UPWARD_SPEED = 4.2`).
   * Explotado al hacer clic dentro del radio (`handleClick` y `pop()`), restaurando la fricción de aire original del dulce.
   * Método estático `Bubble.handleGlobalClick(x, y)` para que el clic del mouse distinga entre cortar y pinchar una burbuja.

---

## 3. Lo que está Mal Implementado (Bugs y Omisiones Mayores)

1. 🔴 **OMISIÓN MAYOR — `AirCushion` (Cojín de Aire) NO ESTÁ PROGRAMADO:**
   * El documento de especificación exigía dos mecánicas especiales: Burbuja y Cojín de aire.
   * En `Gimmicks.js`, el cojín de aire solo figura en el comentario de cabecera (L3). **No existe la clase `AirCushion`**.
   * **Consecuencia:** Nicolás no puede armar el Nivel 4 porque depende del cojín de aire para impulsar el caramelo lateralmente.
2. 🔴 **Bug de precarga de audio en `MechanicsAssets.preload()` (L36 y L42):**
   ```javascript
   sliceAudio.preload = 'none'; // L36
   popAudio.preload = 'none';   // L42
   ```
   * Al colocar `preload = 'none'`, el navegador posterga la carga indefinidamente y el evento `canplaythrough` **nunca se dispara**.
   * Por ende, `MechanicsAssets.sliceSound` y `popSound` permanecen siempre como `null`.
   * **Solución:** Cambiar a `preload = 'auto'` o disparar `.load()`.
3. 🟡 **Los sprites de burbuja no se utilizan en `render()`:**
   * En `assets/mechanics/` existen `bubble_sheet.png` y `bubble_attached.png`, y los cargas en `preload()`.
   * Sin embargo, `Bubble.render()` dibuja la burbuja 100% con círculos vectoriales de p5.js (L439-478). Los sprites cargados no se usan en pantalla.
4. 🟡 **Incompatibilidad de imágenes p5.js (`Gimmicks.js`, L23-30):**
   * Usas `new Image()` de JavaScript estándar en lugar de `loadImage()` de p5.js. Un objeto `HTMLImageElement` no es completamente compatible con la función `image()` de p5.js.
5. 🟡 **Sobrecarga de iteraciones del motor en `Rope.js` (L64-72):**
   * En cada constructor de `Rope` sobreescribes `this.physicsWorld.engine.constraintIterations = 10`. Esto debe ser configurado una sola vez en el motor, no en cada cuerda que se instancie.

---

## 4. Lo que debe ser Eliminado en Producción, pero que en Desarrollo Funciona

1. **Llamada a `this.update()` dentro de `Bubble.render()` (L414):**
   * En `Gimmicks.js`, `render()` invoca internamente a `this.update()`.
   * En desarrollo ayuda a que la animación funcione sola, pero desacopla la arquitectura: si el bucle principal luego llama `update()` explícitamente, la animación y las partículas correrán al doble de velocidad. Debe separarse.

---

## 5. Lo que No Fue Considerado Inicialmente, pero Debe ser Agregado Sí o Sí

1. 🔴 **Implementar la Clase `AirCushion` en `src/mechanics/Gimmicks.js`:**
   * Debe ser un cuerpo estático o área de interacción clicable.
   * Al hacer clic sobre él, debe reproducir un efecto de compresión visual y aplicar una fuerza horizontal con `Matter.Body.applyForce` sobre el dulce si este se encuentra en su cono de alcance.
2. 🔴 **Archivos de audio físicos:**
   * Colocar los archivos reales `assets/mechanics/slice.mp3` y `assets/mechanics/pop.mp3` en el repositorio.
3. **Registro y limpieza de `Bubble.activeInstances` entre niveles:**
   * Si el jugador pasa al Nivel 2 o reinicia, las burbujas del nivel anterior deben vaciarse para no dejar referencias colgadas en `Bubble.activeInstances`.

---

## 6. Lo que Puede Quedar como Deuda Técnica (No Afecta al Usuario Directamente)

1. **Fallback de audio procedural (Web Audio API):**
   * El código que sintetiza el corte y el pop mediante osciladores (`AudioContext`) fue una genialidad técnica para tapar la falta de los archivos `.mp3`. Puede quedarse como fallback defensivo permanente.
2. **Lógica de `_hasPrimaryRope` en `Rope.js`:**
   * La distinción entre la primera cuerda conectada y las secundarias no estaba en el documento original, pero resuelve el estiramiento inicial no deseado del caramelo. Puede quedarse tal cual.

---

## 7. Instrucciones Paso a Paso para Farid

### Paso 1: Implementar la clase `AirCushion` en `src/mechanics/Gimmicks.js`
Agrega la siguiente clase al final de `src/mechanics/Gimmicks.js`:

```javascript
class AirCushion {
  constructor(x, y, direction = 1, range = 180, forceMagnitude = 0.035) {
    this.x = x;
    this.y = y;
    this.direction = direction; // 1 = derecha, -1 = izquierda
    this.range = range;
    this.forceMagnitude = forceMagnitude;
    this.size = 52;
    this.squish = 1.0;
  }

  handleClick(clickX, clickY) {
    const d = Math.hypot(clickX - this.x, clickY - this.y);
    if (d <= this.size * 0.75) {
      this.activate();
      return true;
    }
    return false;
  }

  activate() {
    this.squish = 0.55; // Animación de compresión del cojín
    this.playCushionSound();

    if (typeof levelManager !== 'undefined' && levelManager.candy && levelManager.candy.body) {
      const candyBody = levelManager.candy.body;
      const dx = candyBody.position.x - this.x;
      const dy = Math.abs(candyBody.position.y - this.y);

      // Si el dulce está en la dirección de soplado y dentro del rango
      const isInDirection = this.direction > 0 ? (dx > 0 && dx < this.range) : (dx < 0 && Math.abs(dx) < this.range);
      if (isInDirection && dy < 80) {
        const factor = Math.max(0.3, 1 - (Math.abs(dx) / this.range));
        Matter.Body.applyForce(candyBody, candyBody.position, {
          x: this.direction * this.forceMagnitude * factor,
          y: -0.008 * factor // Pequeño impulso ascendente
        });
      }
    }
  }

  playCushionSound() {
    if (typeof audioManager !== 'undefined' && audioManager && audioManager.isMuted) return;
    // Reproducir cushionSound o sintetizador de soplo Web Audio
  }

  update() {
    if (this.squish < 1.0) {
      this.squish = Math.min(1.0, this.squish + 0.08);
    }
  }

  render() {
    this.update();
    push();
    translate(this.x, this.y);
    scale(this.direction * (2 - this.squish), this.squish);
    // Dibujo del cojín inflable (marrón cuero con boquilla)
    fill(190, 85, 45);
    stroke(75, 30, 15);
    strokeWeight(3);
    ellipse(0, 0, this.size, this.size * 0.75);
    // Boquilla
    fill(140, 60, 30);
    rect(this.size * 0.35, -7, 16, 14, 4);
    pop();
  }
}

// Exportar globalmente
if (typeof window !== 'undefined') {
  window.AirCushion = AirCushion;
}
```

### Paso 2: Corregir la precarga de audio en `MechanicsAssets.preload()`
Cambia `preload = 'none'` a `preload = 'auto'` en las líneas 36 y 42 de `Gimmicks.js`.

### Paso 3: Guardar los archivos físicos de sonido
Descarga o añade clips cortos en formato `.mp3` para:
- `assets/mechanics/slice.mp3` (sonido de swish / corte).
- `assets/mechanics/pop.mp3` (burbuja reventando).
- `assets/mechanics/cushion.mp3` (soplo de aire).
