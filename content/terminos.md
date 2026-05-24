# Términos y Condiciones · Aviso de Privacidad

*Versión 2 — vigente desde mayo de 2026.*

## En dos minutos

- **Retratos de la Patria** es una app educativa que transforma tu foto en un retrato pintado al óleo de una **figura de la Argentina colonial**.
- **No guardamos tu foto en ningún lado.** Se procesa y se descarta.
- Para hacer el retrato, mandamos tu foto a la IA de Google (Gemini). Eso significa que tu imagen sale momentáneamente hacia servidores de Google. Más detalle abajo.
- **Si sos menor de edad, necesitás autorización** de tu mamá, papá o adulto responsable para usar la app.
- **Hasta 4 retratos por dispositivo.** Para no recargar la cuota gratuita de la IA. Si necesitás más, podés clonar el repo y usar tu propia clave.
- Al tocar "Acepto y continúo" estás aceptando estos términos. Sin esa aceptación, no podés usar la app.

---

## Qué hace la app

Tomás una foto desde tu cámara (o subís una que ya tengas), elegís entre varios personajes históricos de la Argentina colonial — porteño/a, patriota, vendedor/a, patricio, gaucho/a, aguatero/a — y la inteligencia artificial te devuelve un retrato pintado al óleo donde estás vestido como esa figura. El proyecto es educativo y nació para la **Semana de Mayo**.

## Qué NO hace la app (privacidad)

- **No guardamos tu foto** en ningún servidor ni base de datos nuestra. Se procesa, se devuelve el resultado, y se descarta.
- **No guardamos el retrato generado.** Vive sólo en el navegador. Si querés conservarlo, tenés que descargarlo o compartirlo vos.
- **No te pedimos cuenta, mail, ni datos personales.** No hay registro ni login.
- **No te perfilamos ni usamos cookies de seguimiento.** Hay una analítica básica de Vercel Analytics que cuenta cuántas personas visitan la app y desde qué país, sin cookies y sin recolectar datos personales. Más detalle en la sección "Métricas de uso" abajo.
- **No logueamos el contenido de las imágenes** ni en archivos del servidor ni en métricas.

## Métricas de uso (Vercel Analytics)

Para saber cuántas personas usan la app y mejorar el proyecto, usamos **Vercel Analytics**, una herramienta integrada en la plataforma donde corre el sitio. Funciona así:

- **No usa cookies.** No se guarda nada en tu navegador para identificarte entre visitas.
- **No recolecta datos personales** (ni nombre, ni mail, ni dirección, ni nada vinculado a tu identidad).
- **Sólo cuenta:** cantidad de visitas a cada página, país (no la ciudad), tipo de dispositivo (mobile/desktop), navegador. Nada que pueda usarse para reconocerte.
- Para contar visitantes únicos sin cookies, Vercel calcula un **hash temporal** combinando tu IP y el user-agent del día. Ese hash se descarta cada 24 horas y no se asocia a vos.
- Las métricas las ve sólo el autor del proyecto, en el panel de Vercel, en forma agregada.

Si te molesta esto, **un bloqueador de scripts** (uBlock Origin, Brave shields, etc.) lo desactiva automáticamente y la app sigue funcionando igual.

## Tu foto y Google Gemini

Para generar el retrato necesitamos un modelo de inteligencia artificial. Usamos la API de **Google Gemini**. Implicancias importantes:

- **Tu foto se envía momentáneamente a servidores de Google** para que el modelo la transforme.
- El procesamiento se hace con la **API paga de Gemini** (sin uso del modo gratuito). Google se compromete, en su tier pago, a **no usar los datos para entrenamiento**.
- Tras procesar tu foto, **nosotros no la conservamos** del lado del servidor.

## Sobre menores de 18 años

Esta app está pensada para uso educativo en escuelas y entornos familiares.

- **Si sos menor de 18 años, sólo podés usarla con autorización** de tu mamá, papá, tutor/a o adulto responsable.
- **Si sos docente o adulto responsable**, asegurate de tener el consentimiento de los padres/madres de los/las menores antes de usar la app con ellos. Idealmente firmado.
- **No subas la foto de un menor que no tenés autorización para fotografiar.**
- Las imágenes generadas con la foto de un menor merecen el mismo cuidado que la foto original: no compartirlas en redes públicas sin autorización.

## Marco legal argentino

Retratos de la Patria se ajusta al marco legal de la República Argentina:

- **Ley 25.326 de Protección de Datos Personales.** Regula el tratamiento de datos personales, incluidas las imágenes. La app procesa la foto que voluntariamente nos provees, sin almacenarla, y con la finalidad explícita de generar el retrato.
- **Código Civil y Comercial de la Nación, artículo 53 (Derecho a la propia imagen).** Para captar, reproducir o publicar la imagen de una persona se requiere su consentimiento (o el de su representante legal si es menor). Al aceptar estos términos estás dando ese consentimiento, **acotado al uso descripto en este documento**.

## Sin fines comerciales · Código abierto

- Retratos de la Patria es un **proyecto personal**, sin relación con ninguna empresa ni institución educativa.
- **No tiene fines comerciales.** No vendemos las imágenes ni los datos. No hay publicidad. No hay suscripciones.
- Es **código abierto** bajo licencia MIT. Podés revisar el código y hacer tu propia copia: <https://github.com/maxiyommi/retratos-patria>.
- Cualquier persona que despliegue la app usa su propia clave de Google Gemini (ver "Tu foto y Google Gemini" más arriba).

## Si cambiás de opinión

Como no guardamos nada nuestro lado, no hay nada que borrar de nuestros servidores: tu foto y tu retrato nunca se persistieron.

Si descargaste el retrato o lo compartiste, esa copia vive en **tu dispositivo** o en **el dispositivo de quien la haya recibido** — esas copias las administrás vos.

## Si tenés dudas o querés reportar algo

- Abrir un issue en GitHub: <https://github.com/maxiyommi/retratos-patria/issues>
- Repositorio del proyecto: <https://github.com/maxiyommi/retratos-patria>

---

*Estos términos pueden actualizarse para mejorar su claridad o ajustarse a cambios legales. Si la versión cambia, se te volverá a pedir aceptación la próxima vez que uses la app.*
