# CLAUDE.md — Retratos de la Patria

> Archivo de memoria del proyecto. Claude Code lo lee al inicio de cada sesión.
> Mantenerlo corto, actualizado y honesto. Si algo cambia, actualizar acá.

## Qué es esto

Webapp educativa: una persona se saca una foto y la IA la "retrata" como una
figura de la Buenos Aires colonial de **1810** — el mismo rostro, pintado al
óleo y vestido de época. El usuario elige el personaje, ve el resultado
enmarcado y lo descarga o comparte.

- Nombre de trabajo: **Retratos de la Patria**.
- Origen: proyecto escolar para la Semana de Mayo.
- Es un proyecto personal y sin fines comerciales (no es producto de una
  empresa). Política de privacidad: el autor no se nombra en contenido
  visible al usuario — sólo se referencia el repo de GitHub. Mantener
  ese criterio al editar copys, footers, OG image, etc.
- Proyecto de **código abierto** (licencia MIT) desde su concepción.
- **Mobile-first**: se usa desde el celular. Diseño pensado para ~390px de
  ancho; el escritorio es secundario.
- Idioma de toda la interfaz: **español rioplatense (es-AR)**.

## Posicionamiento (por qué este proyecto y dónde está el valor)

Una investigación previa mostró que el concepto genérico —"subí tu foto y
mirate en otra época"— está **saturado**: existen MyHeritage AI Time Machine,
Fotor, VEED, Bylo.ai y muchas más. **El valor de este proyecto NO es la
tecnología** (cualquiera puede pedirle a Gemini "transformame en 1810").

El diferencial es la **combinación**, que no existe en ningún otro lado:
- localización cultural argentina (personajes locales bien investigados, es-AR);
- propósito educativo (Semana de Mayo, escuela);
- código abierto;
- privacy-first (no guarda nada, términos explícitos).

**Implicancia para el desarrollo:** la calidad está en la curaduría —los 4
personajes, los prompts, el español rioplatense, el diseño con impronta— no en
features genéricas. Que se sienta argentino, simple y confiable.

## Principios de producto (no negociables)

1. **Simple.** Una sola pantalla, sin menúes, sin cuentas, sin login. El
   recorrido entra en 4 pasos. No agregar features que no se pidieron.
2. **Mobile-first.** Botones grandes (mínimo 44px de alto), una columna, nada
   que dependa de hover. La cámara es el camino principal.
3. **Impronta argentina visible.** Celeste y blanco son la identidad dominante
   de la interfaz, no un acento (ver Diseño).
4. **Privacidad por diseño.** No se guarda nada. Ver Restricciones críticas.
5. **Código abierto.** Licencia MIT. Cada quien usa sus propias claves de API;
   el repositorio NUNCA contiene secretos.

## Recorrido del usuario

0. **Términos y Condiciones**: pantalla inicial de aceptación obligatoria.
   Bloquea todo lo demás hasta que se acepte.
1. **Sacar o subir foto** (la cámara abre directo en celular).
2. **Elegir personaje** entre 4 opciones.
3. **Ver el retrato** generado, dentro del marco.
4. **Descargar o compartir** (usar Web Share API en mobile).

## Stack

- **Next.js 15** (App Router) + **React 19** + **TypeScript** (modo `strict`).
- **CSS Modules** + un archivo de tokens (`styles/tokens.css`). Sin Tailwind:
  el diseño es a medida.
- **IA de imagen**: Google Gemini API vía SDK oficial `@google/genai`.
  Modelo: `gemini-2.5-flash-image` (Nano Banana). Soporta edición
  imagen-a-imagen, que es lo que necesitamos.
- **Backend**: Route Handler de Next.js (`/app/api/transform/route.ts`).
  Corre server-side y guarda la key. No hay servidor aparte ni n8n.
- **Sin base de datos.** No se persiste nada (ver Restricciones críticas).
- **Deploy**: Vercel.

## Comandos

\`\`\`bash
npm run dev      # desarrollo local (http://localhost:3000)
npm run build    # build de producción
npm run start    # correr el build
npm run lint     # ESLint
\`\`\`

## Diseño — identidad visual

El diseño y el recorrido ya fueron validados en un preview interactivo.
Regla central: **dos mundos**.

- **La cáscara de la app (chrome)** es celeste y blanco — la Argentina de hoy.
  El celeste y blanco son la identidad DOMINANTE de la interfaz, no un acento.
- **El retrato y su marco** son pergamino, sepia y dorado — el clima de 1810.
  Ese mundo cálido vive solo dentro del marco del retrato.

Aplicación del chrome celeste/blanco:
- fondo de la app: cielo celeste; barra de estado celeste;
- panel de marca: celeste con el **Sol de Mayo dorado** y el wordmark blanco
  (es, literalmente, la composición de la bandera);
- botones de acción primarios: celeste; superficies: blanco cálido / crema;
- motivo de bandera: franja **celeste / blanco / celeste** como divisor.

Tokens de color (validados en el preview):
- celeste `#5b9ece` · celeste profundo `#2f6f9b` · celeste tinta `#1f5072`
- blanco cálido `#fbf7ec` · crema `#f3ecd9`
- dorado `#c9a14a` · dorado suave `#e7ce8e`  (Sol de Mayo y marco del retrato)
- pergamino `#efe1bf`  (solo dentro del retrato)

Tipografía: serif con carácter — display tipo Cormorant Garamond, cuerpo tipo
EB Garamond. Nada de fuentes genéricas.
Mobile: una columna, jerarquía clara, mucho aire, transiciones suaves.

## Flujo de datos

1. El cliente captura (cámara) o sube una foto y elige un personaje.
2. El cliente **reduce la imagen** (canvas, lado máximo ~1024px) antes de
   enviarla — baja costo y latencia.
3. \`POST /api/transform\` recibe \`{ image, characterId }\`.
4. La route arma el prompt del personaje y llama a Gemini con la foto + prompt.
5. Devuelve la imagen generada en base64.
6. El cliente la muestra dentro del marco y ofrece descargar o compartir.

### Contrato de la API

\`\`\`
POST /api/transform
body:     { image: string (dataURL base64), characterId: 'dama'|'caballero'|'vendedor'|'soldado' }
200:      { image: string (dataURL base64) }
4xx/5xx:  { error: string }   // mensaje apto para mostrar al usuario, en español
\`\`\`

## Estructura de carpetas

\`\`\`
/  (raíz)
  LICENSE                   # licencia MIT (copyright = GitHub handle maxiyommi)
  README.md                 # documentación pública del proyecto
  CLAUDE.md                 # este archivo
  .env.example              # plantilla de variables (sin valores) — SÍ se commitea
  .gitignore
/app
  /api/transform/route.ts   # llama a Gemini (server-side)
  layout.tsx
  page.tsx                  # pantalla única
  globals.css
/components
  TermsGate.tsx             # pantalla de aceptación de términos (bloquea el uso)
  Camera.tsx                # cámara en vivo + subir archivo
  CharacterPicker.tsx       # los 4 personajes
  PortraitFrame.tsx         # marco + resultado + descargar/compartir
  LoadingState.tsx          # animación de "pintado"
  Footer.tsx                # firma de autoría + links
/content
  terminos.md               # texto de Términos y Condiciones + Aviso de Privacidad
/lib
  characters.ts             # definición y PROMPTS de los 4 personajes (fuente de verdad)
  gemini.ts                 # wrapper del cliente de Gemini
  image.ts                  # reducir/encodear imágenes
/styles
  tokens.css                # colores, tipografías, espaciado
.env.local                  # NO se commitea — la clave de cada quien
\`\`\`

## Pantalla de Términos y Condiciones (TermsGate)

- Es lo primero que ve el usuario. Hasta que no acepte, no puede usar la app.
- Muestra el texto de \`content/terminos.md\` (resumen visible + acceso al
  texto completo) y un botón **"Acepto y continúo"**.
- La aceptación se guarda en \`localStorage\` con una **clave versionada**
  (ej. \`terminos_aceptados_v1\`). Si se actualiza el texto, subir la versión
  para volver a pedir aceptación.
- Para tablets compartidas en el aula, se puede configurar para pedir la
  aceptación por sesión en vez de persistirla.

## Personajes

Los 4 personajes y sus prompts viven en \`lib/characters.ts\` (fuente única):
**Dama porteña**, **Caballero patriota**, **Vendedor/a ambulante** y
**Soldado de la Patria**. Son el corazón del valor del proyecto (ver
Posicionamiento): hay que cuidarlos.

Cada prompt debe pedirle a Gemini que:
- conserve los rasgos faciales para que la persona se reconozca;
- vista a la persona con el traje de época correspondiente;
- use estilo de pintura/retrato colonial de 1810;
- mantenga el contenido apto para chicos (solo vestuario y fondo de época;
  **no** cambiar la edad ni el cuerpo de la persona).

## IA — Gemini

- SDK: \`@google/genai\`. La firma de \`generateContent\` y la config de
  \`responseModalities\` puede cambiar entre versiones: **verificar contra la
  doc oficial** (\`https://ai.google.dev/gemini-api/docs/image-generation\`).
- La imagen se manda como \`inlineData\` (base64) junto con el prompt de texto.
- Modelo de mayor calidad si hace falta: \`gemini-3.1-flash-image\` (Nano
  Banana 2) o \`gemini-3-pro-image\` (Nano Banana Pro, sin tier gratuito).

## Variables de entorno

\`\`\`
GEMINI_API_KEY=...     # SOLO server-side. Nunca exponer al cliente.
\`\`\`

- Configuración real en \`.env.local\` (ignorado por git).
- \`.env.example\` documenta las variables sin valores y SÍ se commitea.
- En producción (Vercel) la variable se carga en el panel del proyecto.

## Convenciones de código

- TypeScript \`strict\`. Tipar el contrato de la API en un solo lugar.
- Componentes funcionales con hooks.
- Texto visible al usuario: siempre en español rioplatense.
- Procesar imágenes en el cliente cuando se pueda (privacidad + costo).
- Manejo de errores siempre con mensaje claro en español; nunca dejar al
  usuario con una pantalla colgada si falla Gemini.
- Identificadores en inglés, comentarios en español.

## Autoría y footer

- El footer firma: **"Proyecto educativo de código abierto"** + link al
  repo de GitHub. NO se nombra al autor — quien quiera saber la identidad
  llega vía GitHub. Esto es deliberado: política de privacidad del autor.
- Mismo criterio en OG image, terminos.md, README, layout metadata: no
  exponer nombre+apellido en contenido visible.
- Es un proyecto personal: no debe presentarse como producto de una empresa.
- El \`LICENSE\` (MIT) usa el handle de GitHub \`maxiyommi\` como copyright
  holder, no el nombre y apellido. La identidad legal queda enlazada vía
  el perfil de GitHub si hace falta.

## Restricciones críticas (LEER SIEMPRE)

**Sin secretos en el repo.** Nunca commitear claves, tokens ni datos
personales. Verificar que \`.env.local\` esté ignorado antes de cualquier push.
El repo es público: nunca subir fotos de prueba de menores (ni en /public, ni
en issues, ni en capturas).

**Aceptación obligatoria de términos.** Nadie usa la app sin aceptar antes los
Términos y Condiciones (ver TermsGate).

**Privacidad de menores.** Esta app procesa fotos de chicos.
- No persistir las fotos ni las imágenes generadas en ningún servidor ni base
  de datos. Procesar, devolver y descartar.
- No loguear el contenido de las imágenes.
- Las imágenes generadas viven solo en la sesión del navegador.
- Enviar la foto a Gemini implica que sale hacia servidores de Google. El tier
  gratuito puede usar los datos para mejorar sus modelos; el tier pago no.
  Para fotos de menores, preferir el tier pago. Esto debe estar declarado en
  los Términos y Condiciones.
- Marco legal de referencia: Ley 25.326 de Protección de Datos Personales y
  derecho a la propia imagen (Código Civil y Comercial, art. 53).

**Contenido apto para chicos.** Los prompts solo agregan vestuario y fondo de
época. Nunca alterar edad ni cuerpo.

**Costo y límites.** \`gemini-2.5-flash-image\` free: ~500 imágenes/día y
~10/min. Reducir las imágenes antes de enviarlas, no reintentar en bucle, y
poner un rate limit simple por IP en la route.

## Estado actual

Andamiaje listo: \`LICENSE\` (MIT), \`README.md\`, \`.env.example\`,
\`.gitignore\`, \`CLAUDE.md\` y \`content/terminos.md\`. Diseño y recorrido ya
validados en un preview interactivo.

Próximos pasos sugeridos:
1. Scaffold de Next.js + TypeScript + la estructura de carpetas de arriba.
2. \`styles/tokens.css\` con la paleta y tipografías de la sección Diseño.
3. \`components/TermsGate.tsx\` (lee \`content/terminos.md\`).
4. \`lib/characters.ts\` con los 4 personajes y sus prompts.
5. \`components/Camera.tsx\` y \`CharacterPicker.tsx\`.
6. \`app/api/transform/route.ts\` + \`lib/gemini.ts\`.
7. \`components/PortraitFrame.tsx\` + \`Footer.tsx\`.

Idea opcional para más adelante: un **modo sin IA** de respaldo (vestuario
ilustrado superpuesto) por si en el aula falla el wifi o se agota la cuota.
