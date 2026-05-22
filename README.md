# Retratos de la Patria

Webapp educativa: una persona se saca una foto y la IA la "retrata" como una
figura de la Buenos Aires colonial de **1810** — el mismo rostro, pintado al
óleo y vestido de época. Pensada para la Semana de Mayo en escuelas.

Es un proyecto personal, sin fines comerciales, de **código abierto**
desde su concepción (licencia MIT). Quien lo desarrolla está detrás del
[repositorio en GitHub](https://github.com/maxiyommi/retratos-patria).

## Cómo funciona

1. Aceptás los Términos y Condiciones.
2. Sacás o subís una foto desde el celular.
3. Elegís uno de los 4 personajes: Dama porteña, Caballero patriota,
   Vendedor/a ambulante o Soldado de la Patria.
4. La IA transforma tu foto en un retrato al óleo de 1810.
5. Lo descargás o lo compartís.

No guardamos tu foto en ningún servidor ni base de datos: se procesa, se
devuelve y se descarta. Ver [`content/terminos.md`](./content/terminos.md)
para el detalle.

## Stack

- [Next.js 15](https://nextjs.org) (App Router) + React 19 + TypeScript strict
- Google Gemini API (`gemini-2.5-flash-image`) vía
  [`@google/genai`](https://www.npmjs.com/package/@google/genai)
- CSS Modules (sin Tailwind) + tokens en `styles/tokens.css`
- Deploy en [Vercel](https://vercel.com)

## Cómo correr localmente

Necesitás Node.js 20+ y una clave de Gemini.

```bash
# 1. Cloná el repo
git clone https://github.com/maxiyommi/retratos-patria.git
cd retratos-patria

# 2. Instalá dependencias
npm install

# 3. Conseguí una API key en https://aistudio.google.com/apikey
#    y copiala a .env.local
cp .env.example .env.local
# editá .env.local y pegá tu clave en GEMINI_API_KEY=

# 4. Arrancá el server de desarrollo
npm run dev
```

Abrí [http://localhost:3000](http://localhost:3000) en el navegador. Para
probar la cámara desde el celular, accedé desde la misma red wifi a
`http://<ip-de-tu-compu>:3000`.

## Comandos

```bash
npm run dev      # desarrollo local
npm run build    # build de producción
npm run start    # correr el build
npm run lint     # ESLint
```

## Filosofía

Este proyecto se diferencia no por la tecnología (cualquiera puede pedirle a
una IA "transformame en 1810") sino por la **curaduría**:

- localización cultural argentina (personajes investigados, es-AR);
- propósito educativo (Semana de Mayo, escuelas);
- código abierto;
- privacy-first (no guarda nada, términos explícitos).

## Privacidad

La app procesa fotos de chicos en contexto escolar. Por eso:

- No persistimos las fotos ni las imágenes generadas en ningún lado.
- No logueamos el contenido de las imágenes.
- Las imágenes generadas viven solo en la sesión del navegador.
- La foto se envía a Google (Gemini) para la transformación. El tier gratuito
  puede usar los datos para mejorar sus modelos; el tier pago no. Para uso
  con menores se recomienda tier pago.
- Marco legal: Ley 25.326 de Protección de Datos Personales y derecho a la
  propia imagen (Código Civil y Comercial, art. 53).

## Licencia

[MIT](./LICENSE) — 2026.

Si lo usás en tu escuela o lo adaptás, podés
[abrir un issue en GitHub](https://github.com/maxiyommi/retratos-patria/issues)
para contarlo.
