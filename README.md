# AutomatAnim — Generador de Animaciones Flotantes por Capas

Este programa toma las capas de una o varias imágenes (guardadas como archivos PNG separados) y genera automáticamente una animación donde cada capa se mueve de forma independiente, creando un efecto de **flotación orgánica** en loop perfecto.

**Resultado:** un GIF animado por cada plato + todos los frames individuales en PNG.

---

## ¿En qué está hecho este proyecto?

Está hecho en **TypeScript**, que es un lenguaje de programación que corre sobre **Node.js** (una plataforma que permite ejecutar código JavaScript/TypeScript en tu computador, fuera del navegador).

No necesitas saber programar para usarlo. Solo necesitas instalar dos herramientas y seguir los pasos de abajo.

---

## Requisitos previos

Antes de correr el proyecto por primera vez, necesitas tener instalado:

### 1. Node.js (versión 18 o superior)

Node.js es la plataforma que ejecuta el programa.

- Descárgalo desde: **https://nodejs.org**
- Elige la versión marcada como **"LTS"** (la más estable)
- Instálalo como cualquier programa de Windows (siguiente, siguiente, finalizar)

Para verificar que quedó bien instalado, abre una terminal (PowerShell o CMD) y escribe:
```
node --version
```
Debería mostrarte algo como `v20.11.0`. Si aparece un número, está bien.

### 2. npm (viene incluido con Node.js)

`npm` es el gestor de paquetes de Node.js. Se instala automáticamente junto con Node.js. Puedes verificarlo con:
```
npm --version
```

---

## Instalación (solo la primera vez)

1. Abre una terminal dentro de la carpeta del proyecto.
   - En Windows: navega hasta la carpeta, haz clic derecho en un espacio vacío y elige **"Abrir en Terminal"** o **"Abrir PowerShell aquí"**.

2. Escribe el siguiente comando y presiona Enter:
```
npm install
```

Esto descarga todas las librerías que necesita el proyecto (se guardan en la carpeta `node_modules/`). Puede tardar unos segundos.

---

## Cómo usar el proyecto

### Paso 1 — Prepara tus capas

Coloca tus archivos PNG (con fondo transparente) dentro de la carpeta **`Capas/`**.

El nombre de cada archivo debe seguir este formato exacto:
```
NOMBREPLATO_CAPA_01.png
NOMBREPLATO_CAPA_02.png
NOMBREPLATO_CAPA_03.png
...
```

**Ejemplo con los platos actuales:**
```
Capas/
  HABICHUELAS_CAPA_01.png
  HABICHUELAS_CAPA_02.png
  HABICHUELAS_CAPA_03.png
  HABICHUELAS_CAPA_04.png
  HABICHUELAS_CAPA_05.png
  PASTEL_CAPA_01.png
  PASTEL_CAPA_02.png
  PASTEL_CAPA_03.png
  PASTEL_CAPA_04.png
  SANCOCHO_CAPA_01.png
  SANCOCHO_CAPA_02.png
  SANCOCHO_CAPA_03.png
  SANCOCHO_CAPA_04.png
  SANCOCHO_CAPA_05.png
```

**Reglas importantes:**
- El programa agrupa automáticamente los archivos por el nombre antes de `_CAPA_`. No necesitas configurar nada.
- Todas las capas de un mismo plato deben tener **exactamente el mismo tamaño** (mismo ancho y alto).
- Deben tener **fondo transparente** (formato PNG con canal alpha).
- El orden importa: la capa `_01` es la más profunda (el fondo), la última va arriba.

### Paso 2 — Corre el programa

Abre la terminal en la carpeta del proyecto y ejecuta:

```
npm run dev
```

El programa va a:
1. Detectar automáticamente los grupos de capas en `Capas/`
2. Por cada grupo: calcular el movimiento, renderizar los frames y generar el GIF
3. Guardar todo el resultado en la carpeta `output/`

### Paso 3 — Encuentra tu resultado

```
output/
  frames/
    habichuelas_000.png … habichuelas_023.png   ← Frames de Habichuelas (PNG con transparencia)
    pastel_000.png      … pastel_023.png         ← Frames de Pastel
    sancocho_000.png    … sancocho_023.png        ← Frames de Sancocho
  gif/
    habichuelas_animado.gif   ← GIF en loop infinito
    pastel_animado.gif
    sancocho_animado.gif
```

- Los **PNGs individuales** tienen transparencia completa. Ideales para edición posterior o importar a After Effects, Photoshop, etc.
- Los **GIFs** están listos para usar en redes sociales, web o presentaciones.

---

## Agregar un nuevo plato

No se necesita tocar el código. Solo:

1. Agrega los nuevos PNGs a la carpeta `Capas/` siguiendo el patrón de nombre: `MIPLATО_CAPA_01.png`, `MIPLATO_CAPA_02.png`, etc.
2. Corre `npm run dev`.

El programa detecta el nuevo grupo automáticamente y genera su propio GIF.

---

## Configuración — cómo ajustar la animación

Todos los parámetros de la animación están en un solo archivo:

**`src/config/AnimationConfig.ts`**

Puedes abrirlo con cualquier editor de texto (Notepad, VS Code, etc.) y modificar los valores:

```typescript
outputFrames: 60,          // Cantidad de frames del GIF (más = animación más suave, más tiempo de proceso)
internalSamples: 120,      // Poses internas de cálculo (dejar siempre el doble de outputFrames)

maxHorizontalOffset: 4,    // Qué tanto se mueven las capas de lado a lado (en píxeles)
maxVerticalOffset: 6,      // Qué tanto suben y bajan las capas (en píxeles)
maxRotation: 1.5,          // Qué tanto rotan las capas (en grados)

depthScaleMin: 1.0,        // Intensidad de movimiento en la capa más profunda (base = 1.0)
depthScaleMax: 1.45,       // Intensidad de movimiento en la capa superior (más movimiento = más "liviana")

gifDelayCentisecs: 3,      // Velocidad del GIF: 3 = 30ms por frame ≈ 33 cuadros por segundo → loop ~1.8s
                           // (número más bajo = más rápido, más alto = más lento)

inputDir: 'Capas',         // Carpeta donde están tus PNGs de entrada
outputDir: 'output',       // Carpeta donde se guarda el resultado
```

Después de cambiar cualquier valor, vuelve a correr `npm run dev` para regenerar las animaciones.

---

## Comandos disponibles

| Comando | Qué hace |
|---------|----------|
| `npm run dev` | Corre el programa directamente (recomendado para uso normal) |
| `npm run build` | Compila el código TypeScript a JavaScript (para producción) |
| `npm start` | Corre la versión compilada (usar después de `npm run build`) |

---

## Cómo funciona (explicación simple)

El programa genera movimiento **orgánico y no sincronizado** usando matemática de ondas (sinusoides):

- **Cada capa se mueve de forma independiente**: no todas suben y bajan al mismo tiempo.
- **Tres tipos de movimiento por capa**: arriba-abajo, lado a lado, y rotación.
- **Las capas superiores se mueven más**: simulan ser más "livianas" (efecto de profundidad).
- **El loop es perfecto**: matemáticamente el último frame conecta exactamente con el primero, sin saltos.
- **Grupos automáticos**: el programa detecta los platos por el prefijo del nombre del archivo, sin configuración manual.

---

## Solución de problemas frecuentes

**"npm no se reconoce como comando"**
→ Node.js no está instalado correctamente. Reinstálalo desde https://nodejs.org y reinicia la terminal.

**"Cannot find module" o errores al correr**
→ Probablemente falta correr `npm install`. Ejecuta ese comando primero.

**El GIF sale muy rápido o muy lento**
→ Ajusta `gifDelayCentisecs` en la configuración. Prueba con `6` (más rápido) o `12` (más lento).

**El movimiento apenas se nota**
→ Sube los valores de `maxVerticalOffset`, `maxHorizontalOffset` y `maxRotation` en la configuración.

**El movimiento es exagerado**
→ Baja esos mismos valores.

**Solo se genera un GIF en vez de uno por plato**
→ Verifica que los nombres de los archivos en `Capas/` siguen el patrón `NOMBRE_CAPA_01.png`. El guion bajo y la palabra `CAPA` deben estar presentes.

**Las capas no aparecen en el orden correcto**
→ Verifica que los números al final estén bien ordenados (`_01`, `_02`, `_03`...). La capa `_01` va al fondo, la última va arriba.

**Los frames del output se sobreescriben entre platos**
→ Esto no debería pasar: cada plato usa su propio prefijo (`habichuelas_000.png`, `pastel_000.png`, etc.). Si ves archivos con nombre genérico `frame_000.png`, son de una corrida anterior — puedes borrarlos.
