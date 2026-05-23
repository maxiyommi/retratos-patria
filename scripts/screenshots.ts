/*
 * scripts/screenshots.ts
 *
 * Genera los screenshots del README en docs/screenshots/ usando Playwright
 * sobre un build de Next en local. Mockea:
 *   - getUserMedia: rechaza para que Camera caiga al fallback "Subir foto"
 *   - /api/transform: intercepta la request y devuelve un PNG sample para
 *     poder llegar al step "result" sin gastar cuota de Gemini.
 *
 * Asume que el dev server está corriendo en http://localhost:3000.
 *
 * Uso:
 *   1) En una terminal: npm run dev
 *   2) En otra terminal: npm run screenshots
 *
 * Las imágenes salen a docs/screenshots/.
 */

import { chromium, type Browser, type Page } from "playwright";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const APP_URL = process.env.APP_URL ?? "http://localhost:3000";
const OUT_DIR = path.resolve(__dirname, "..", "docs", "screenshots");

// Viewport iPhone 12/13 — la app es mobile-first
const MOBILE_VIEWPORT = { width: 390, height: 844 };
// Para el hero usamos mismo ratio que el OG image
const HERO_VIEWPORT = { width: 1200, height: 630 };

async function ensureOutDir() {
  await mkdir(OUT_DIR, { recursive: true });
}

/**
 * Carga un PNG/SVG de sample-portrait.svg como base64 para que el mock
 * de /api/transform devuelva una imagen "generada". Como el sample es
 * SVG y la app espera un dataURL PNG/JPEG, leemos el SVG, lo dibujamos
 * sobre un canvas (vía Playwright en el browser context) y serializamos
 * como JPEG. Pero más simple: usamos el SVG inline embebido en un dataURL
 * SVG, que Gemini-style devolvería como PNG. La app sólo lo renderiza con
 * <img src>, así que cualquier dataURL válido funciona.
 */
async function loadSamplePortraitDataUrl(): Promise<string> {
  const svgPath = path.resolve(__dirname, "..", "public", "sample-portrait.svg");
  const svg = await readFile(svgPath, "utf-8");
  const b64 = Buffer.from(svg).toString("base64");
  return `data:image/svg+xml;base64,${b64}`;
}

/**
 * Crea un buffer JPEG chiquito para usar como "foto subida" en el flow.
 * 800x800 png con un degradé sepia + un avatar muy simplificado. Se
 * inyecta vía file input en el step Camera (fallback "Subir foto").
 */
async function generateSampleUploadPhoto(): Promise<Buffer> {
  // Minimal pre-baked JPEG: solid mid-gray 1024x1024 (avatar dummy
  // — el detalle no importa, sólo necesitamos pasar el editor).
  // Usamos un PNG simple en lugar de generar via canvas en Node.
  const samplePath = path.resolve(
    __dirname,
    "fixtures",
    "sample-upload.jpg",
  );
  try {
    return await readFile(samplePath);
  } catch {
    // Fallback: generar un PNG sólido con sharp/canvas no instalado.
    // Hacemos un mini JPEG válido inline (header + cuerpo mínimo).
    // Como hack, devolvemos los bytes de sample-portrait.svg envueltos
    // — playwright los va a usar como blob y el editor lo va a abrir
    // como imagen. Si falla, el flujo de screenshots de paso 2 no será
    // perfecto pero el paso 1 y 3-4 sí.
    throw new Error(
      "Falta scripts/fixtures/sample-upload.jpg — agregar una foto cuadrada para que el editor la cargue.",
    );
  }
}

/**
 * Inyecta dos hacks en cada nueva página:
 * 1) navigator.mediaDevices.getUserMedia → rechaza con NotAllowedError,
 *    forzando el fallback "Subir foto" del componente Camera.
 * 2) window.fetch para /api/transform → responde con el sample portrait.
 *
 * Sample portrait es el SVG existente en /public/sample-portrait.svg.
 */
async function setupPageMocks(page: Page, samplePortraitDataUrl: string) {
  // Mock getUserMedia
  await page.addInitScript(() => {
    if (navigator.mediaDevices) {
      navigator.mediaDevices.getUserMedia = () =>
        Promise.reject(
          Object.assign(new Error("Permission denied (mocked)"), {
            name: "NotAllowedError",
          }),
        );
    }
  });

  // Mock /api/transform — Playwright route intercept es más simple que
  // overrider window.fetch, lo manejamos abajo via page.route.
  await page.route("**/api/transform", async (route) => {
    // Demoramos la respuesta para que el step "Painting" sea capturable
    // (la bandera se va pintando durante este intervalo).
    await new Promise((r) => setTimeout(r, 6000));
    const body = JSON.stringify({ image: samplePortraitDataUrl });
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body,
    });
  });
}

/**
 * Helper para aceptar TermsGate previamente: pone localStorage flag.
 */
async function acceptTermsViaLocalStorage(page: Page) {
  await page.addInitScript(() => {
    try {
      window.localStorage.setItem("terminos_aceptados_v1", "yes");
    } catch {
      // ignore
    }
  });
}

async function captureSplashHero(browser: Browser, samplePortrait: string) {
  // Para el hero queremos el Splash visible. Viewport más ancho (landscape-ish).
  const ctx = await browser.newContext({ viewport: HERO_VIEWPORT });
  const page = await ctx.newPage();
  await setupPageMocks(page, samplePortrait);
  await page.goto(APP_URL);
  // Esperar a que la coreografía del Splash llegue al estado "idle"
  // (5s según los timings del componente)
  await page.waitForTimeout(5200);
  await page.screenshot({
    path: path.join(OUT_DIR, "hero.png"),
    type: "png",
  });
  await ctx.close();
  console.log("✓ hero.png");
}

async function captureMobileFlow(
  browser: Browser,
  samplePortrait: string,
  uploadPhoto: Buffer,
) {
  const ctx = await browser.newContext({
    viewport: MOBILE_VIEWPORT,
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });
  const page = await ctx.newPage();
  await acceptTermsViaLocalStorage(page);
  await setupPageMocks(page, samplePortrait);
  await page.goto(APP_URL);

  // Dismiss del Splash — esperamos a que aparezca el botón "Ingresar"
  // y clickeamos. Mismo botón que en el flow real.
  await page.waitForSelector("text=Ingresar", { state: "visible", timeout: 8000 });
  await page.waitForTimeout(4500); // que termine la coreografía
  await page.click("text=Ingresar");
  await page.waitForTimeout(900); // fade out del Splash

  // ── Paso 1: Camera (fallback con "Subir foto" porque getUserMedia
  //    está mockeado a fallar) ──
  await page.waitForSelector("text=Posicionate", { timeout: 8000 });
  await page.waitForTimeout(800);
  await page.screenshot({
    path: path.join(OUT_DIR, "paso-1-camara.png"),
    type: "png",
  });
  console.log("✓ paso-1-camara.png");

  // Subir la foto sample para avanzar — el botón "Subir foto" abre file picker
  const fileInput = await page.$("input[type=file]");
  if (!fileInput) {
    console.error("✗ no se encontró input[type=file] en el fallback");
    return;
  }
  await fileInput.setInputFiles({
    name: "sample.jpg",
    mimeType: "image/jpeg",
    buffer: uploadPhoto,
  });

  // Después de subir abre el PhotoEditor (crop con óvalo) — confirmamos
  // con "Usar esta foto". Eso lleva al PREVIEW de Camera con la foto
  // recortada, donde HAY OTRO "Usar esta foto" que es el que avanza al
  // step Choose. Necesitamos clickear dos veces.
  await page.waitForSelector("text=Usar esta foto", { timeout: 8000 });
  await page.waitForTimeout(1200);
  await page.click("text=Usar esta foto"); // PhotoEditor confirm
  await page.waitForTimeout(1200);
  await page.waitForSelector("text=Sacar otra", { timeout: 5000 }); // estamos en preview
  await page.click("text=Usar esta foto"); // Camera preview confirm → onPhotoReady
  await page.waitForTimeout(900);

  // ── Paso 2: Choose ──
  // Esperar el eyebrow del Paso 2 (texto único de la pantalla)
  await page.waitForSelector("text=El rol", { timeout: 10000 });
  await page.waitForTimeout(1400);
  await page.screenshot({
    path: path.join(OUT_DIR, "paso-2-rol.png"),
    type: "png",
  });
  console.log("✓ paso-2-rol.png");

  // Click en el primer rol disponible (Porteña)
  await page.click("text=Porteña");
  await page.waitForTimeout(400);

  // Click "Pintarme como ..."
  await page.click("text=Pintarme como");

  // ── Paso 3: Painting (la bandera se va a pintar; screenshot mid-flow
  //    antes de que el mock responda) ──
  // El mock responde inmediatamente, así que necesitamos atrasar el
  // navigator transition. Tomamos screenshot apenas se ve "Pintándote".
  await page.waitForSelector("text=Pintándote", { timeout: 3000 });
  // Esperar a que se empiece a pintar la bandera (~1.5s)
  await page.waitForTimeout(1700);
  await page.screenshot({
    path: path.join(OUT_DIR, "paso-3-pintando.png"),
    type: "png",
  });
  console.log("✓ paso-3-pintando.png");

  // ── Paso 4: Result ──
  // El mock ya respondió; esperamos a que se vea la galería
  await page.waitForSelector("text=Vos en", { timeout: 8000 });
  // Esperar a que las cortinas se abran (~3s)
  await page.waitForTimeout(3400);
  await page.screenshot({
    path: path.join(OUT_DIR, "paso-4-galeria.png"),
    type: "png",
  });
  console.log("✓ paso-4-galeria.png");

  // ── Bonus: capturar el cuadro descargado tal cual lo genera la app ──
  // En vez de descargar archivo, llamamos directamente al canvas
  // helper composeFramedPortrait via el DOM. La forma más simple:
  // esperar al state framedPortrait y leerlo como blob.
  const framedDataUrl = await page.evaluate(async () => {
    // Buscamos la imagen del marco (PortraitFrame.image) y la promesa
    // de stamp ya está en state. Workaround: leemos el blob del
    // descargado simulando un click en "Descargar". Sin embargo, eso
    // dispara file download; mejor capturar el dataURL del state.
    // Como no tenemos acceso directo al state, usamos un truco: el
    // .resultStage tiene la imagen renderizada; podemos screenshot
    // sólo ese elemento más abajo.
    return null;
  });
  void framedDataUrl;

  // El cuadro descargado lo screenshoteamos directamente del DOM
  // (sólo el frame, sin el chrome de la app).
  const frame = await page.$('figure[aria-label^="Retrato"]');
  if (frame) {
    await frame.screenshot({
      path: path.join(OUT_DIR, "cuadro-descargado.jpg"),
      type: "jpeg",
      quality: 90,
    });
    console.log("✓ cuadro-descargado.jpg");
  } else {
    console.warn("✗ no se encontró .PortraitFrame_root para cuadro-descargado");
  }

  await ctx.close();
}

async function main() {
  console.log(`Conectando a ${APP_URL} ...`);
  await ensureOutDir();
  const samplePortrait = await loadSamplePortraitDataUrl();
  const uploadPhoto = await generateSampleUploadPhoto();

  const browser = await chromium.launch({
    headless: true,
    args: [
      // No necesitamos cámara real porque mockeamos getUserMedia, pero
      // estos flags aseguran que el browser no pida prompts del SO.
      "--use-fake-ui-for-media-stream",
    ],
  });
  try {
    await captureSplashHero(browser, samplePortrait);
    await captureMobileFlow(browser, samplePortrait, uploadPhoto);
  } finally {
    await browser.close();
  }
  console.log("Listo.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
