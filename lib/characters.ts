/*
 * characters.ts — fuente única de verdad de los 6 personajes.
 *
 * Cada personaje es un ROL neutro respecto al género (porteño/a, patriota,
 * vendedor/a, patricio/a, gaucho/a, aguatero/a). El género (dama/caballero)
 * lo elige aparte el usuario con el GenderToggle. La combinación rol ×
 * género da:
 *  - el nombre completo que se muestra en la cartela del retrato
 *  - el prompt específico que se manda a Gemini con la foto del usuario
 *
 * Reglas que TODOS los prompts respetan:
 *  - ANCLA HISTÓRICA: Buenos Aires colonial, Virreinato del Río de la Plata,
 *    año 1810, alrededor de la Revolución de Mayo. Sin elementos de épocas
 *    posteriores (Confederación, fines del XIX, presente). Sin elementos de
 *    otras geografías coloniales (Lima, México, Cuzco).
 *  - Conservar exactamente los rasgos faciales (rostro, edad, expresión,
 *    complexión). NO modificar el cuerpo ni la edad. Sólo agregar
 *    indumentaria y fondo de época.
 *  - Estilo: retrato al óleo colonial rioplatense del siglo XIX temprano.
 *  - Apto para audiencias escolares: sin contenido sexualizado, sin
 *    violencia explícita, sin alteraciones del cuerpo del retratado.
 *
 * Los prompts están redactados en español rioplatense (la app es es-AR)
 * pero usan vocabulario histórico/pictórico estándar que Gemini entiende
 * mejor en su entrenamiento multilingüe.
 */

import type { Gender } from "@/components/GenderToggle";

export type CharacterId =
  | "porteno"
  | "patriota"
  | "vendedor"
  | "patricio"
  | "gaucho"
  | "aguatero";

export interface Character {
  id: CharacterId;
  /** Nombre completo cuando el género es dama (mostrado en la cartela). */
  nombreDama: string;
  /** Nombre completo cuando el género es caballero. */
  nombreCaballero: string;
  /** Frase corta que se muestra debajo del nombre en la card del picker. */
  descripcionCorta: string;
  /**
   * Si está definido, el personaje sólo está disponible en ese género — la
   * card aparece deshabilitada en el picker para el otro. Usado por
   * Patricio (no existieron patricias históricas en el cuerpo militar).
   */
  genderRestriction?: Gender;
  /** Prompt para Gemini cuando se elige dama. */
  promptDama: string;
  /** Prompt para Gemini cuando se elige caballero. */
  promptCaballero: string;
}

/*
 * Preámbulo y cierre comunes a todos los prompts. Se insertan en cada uno
 * para que las restricciones de seguridad y estilo no dependan de un
 * sistema de mensajes separado.
 */
/*
 * Estrategia de prompt:
 *
 * 1. La PRESERVACIÓN DE IDENTIDAD va primero y es la instrucción dominante.
 *    Los modelos de imagen tienden a "idealizar" la cara si no se les frena
 *    activamente. Detallamos rasgo por rasgo para que no haya margen.
 *
 * 2. Aclaramos explícitamente que el GÉNERO del personaje histórico se define
 *    por la ROPA que se agrega, no por el rostro. Sin esto, el modelo intenta
 *    "feminizar" o "masculinizar" la cara cuando hay disonancia entre el
 *    rostro real y el rol elegido (ej. un hombre que pide Dama porteña).
 *
 * 3. Vestimenta específica del rol al final del bloque de instrucción.
 *
 * 4. Estilo pictórico y safety como cierre.
 */

const PROMPT_INTRO = `Esta fotografía muestra a una persona específica. Tu tarea: crear un retrato al óleo de ESA MISMA PERSONA, reconocible, caracterizada como un personaje específico de la BUENOS AIRES COLONIAL DE 1810 — Virreinato del Río de la Plata, alrededor de la Revolución de Mayo.

ANCLA HISTÓRICA (no negociable):
- Año: 1810 exclusivamente. NO usar moda ni objetos de épocas posteriores (Restauración rosista, Confederación, fines del siglo XIX, presente). NO usar elementos modernos (relojes pulsera, anteojos, ropa contemporánea, electrónica).
- Lugar: BUENOS AIRES y el Río de la Plata. NO usar referencias visuales de otras geografías coloniales (Lima, Cuzco, México colonial, España peninsular): la indumentaria, los accesorios y el clima visual son rioplatenses.
- Estética: retrato al óleo colonial rioplatense del temprano siglo XIX.

PRESERVACIÓN DEL ROSTRO — lo más importante de toda la instrucción:
La cara del retrato debe verse exactamente igual a la de la foto original. Conservá rigurosamente: la forma del rostro y la estructura ósea (mandíbula, mejillas, frente), la forma y el color de los ojos, la forma y el tamaño de la nariz, la forma de la boca y los labios, el arco y la posición de las cejas, el tono y la textura de la piel, la edad aparente de la persona, la expresión facial, el color y la textura del cabello, y cualquier marca distintiva (lunares, pecas, cicatrices). Alguien que conoce a la persona debe poder identificarla al instante en el retrato. La FIDELIDAD al original es más valiosa que la estética: no idealices, no embellezcas, no suavices arrugas, no rejuvenezcas ni envejezcas, no cambies proporciones, no agregues maquillaje que altere los rasgos.

El peinado SÓLO se ajusta si la moda de época lo requiere (por ejemplo, recogido bajo un peinetón o un sombrero); en ese caso, mantener el color y la textura del cabello.

GÉNERO DEL PERSONAJE: lo define exclusivamente la INDUMENTARIA descripta más abajo, NO el rostro. Si la indumentaria es femenina pero la cara es masculina (o viceversa), el rostro permanece tal cual está en la foto y sólo se viste el personaje según el rol. No "feminizar" ni "masculinizar" la cara para que matchee con la ropa.`;

const PROMPT_STYLE = `IMPORTANTE: el estilo pictórico TIENE MENOR PRIORIDAD que la preservación del rostro. Si hay tensión entre "más al óleo" y "que se parezca a la persona", siempre gana el parecido.

Pautas del estilo (aplicalas con moderación):
- Acabado de óleo sutil, técnica realista al estilo de los retratos coloniales rioplatenses del siglo XIX temprano. NO uses pincelada gruesa, impresionista ni expresiva: preferí trazos suaves que conserven los detalles finos del rostro (ojos, cejas, comisuras de la boca, lunares, líneas de expresión).
- Fondo neutro oscuro en tonos tierra (sepia, ocre quemado, marrón verdoso). Sin elementos distractores en el fondo.
- Iluminación suave y uniforme sobre el rostro. NO uses sombras dramáticas, claroscuro fuerte ni recortes de luz que oculten rasgos.
- Encuadre y pose: respetar la orientación de la foto original. Si la persona está de frente, dejala de frente; si está en tres cuartos, dejala en tres cuartos. NO rotes la cabeza ni reposiciones a la persona. Encuadre de busto a medio cuerpo.
- Paleta sobria: tierras, marfiles, dorados apagados y sepias.`;

const PROMPT_SAFETY = `Apto para audiencias escolares (niños y niñas). Sin contenido sexualizado, sin pieles expuestas más allá de lo natural en un retrato formal de época, sin violencia explícita. No alterar la edad ni el cuerpo del retratado.`;

/*
 * Sandwich emphasis: repetimos la regla de oro al final del prompt. Los
 * modelos grandes a veces "olvidan" la primera instrucción cuando el
 * prompt es largo (efecto lost-in-the-middle). Esta repetición final hace
 * que el modelo termine de leer con la preservación del rostro fresca en
 * la atención antes de generar.
 */
const PROMPT_CLOSING_REMINDER = `RECORDATORIO FINAL — la regla que rige todo lo anterior:

ESTE RETRATO TIENE QUE SER RECONOCIBLEMENTE LA MISMA PERSONA DE LA FOTO. La cara permanece igual: mismos ojos, misma nariz, misma boca, misma mandíbula, misma piel, mismas marcas, misma edad, misma expresión. La indumentaria y el fondo de 1810 son sólo el envoltorio; el sujeto del retrato es exactamente la persona de la foto original, sin idealizar, sin embellecer, sin homogeneizar. Si tenés dudas entre seguir el estilo de época o conservar un rasgo del rostro, conservá el rasgo.`;

function buildPrompt(attire: string): string {
  return [
    PROMPT_INTRO,
    `INDUMENTARIA Y CARACTERIZACIÓN DEL PERSONAJE:\n${attire}`,
    `ESTILO PICTÓRICO:\n${PROMPT_STYLE}`,
    `SEGURIDAD:\n${PROMPT_SAFETY}`,
    PROMPT_CLOSING_REMINDER,
  ].join("\n\n");
}

export const CHARACTERS: Character[] = [
  {
    id: "porteno",
    nombreDama: "Dama porteña",
    nombreCaballero: "Caballero porteño",
    descripcionCorta: "Salones y tertulias",
    promptDama: buildPrompt(
      `Vestir como DAMA PORTEÑA de sociedad de Buenos Aires en 1810, propia de los salones y tertulias del Virreinato del Río de la Plata. Vestido de talle alto al estilo Imperio (moda francesa adoptada por la elite porteña de la época), en muselina o seda clara, con bordados sutiles en el corpiño. Peinetón alto de carey sobre el cabello recogido — accesorio emblemático de la mujer porteña de 1810. Mantilla de encaje sobre los hombros. Aros de perla pequeños. Manos serenas. Postura recta y digna.`
    ),
    promptCaballero: buildPrompt(
      `Vestir como CABALLERO PORTEÑO de sociedad de Buenos Aires en 1810, propio de los salones y tertulias del Virreinato del Río de la Plata. Casaca oscura de paño con solapas anchas, chaleco bordado color crema o vino, camisa blanca con jabot (chorrera de encaje) en el cuello — moda francesa adoptada por la elite porteña de la época. Pelo peinado hacia atrás o con coleta atada. Posiblemente un anillo o reloj de bolsillo con cadena (NO reloj pulsera, que es del siglo XX). Postura erguida y serena.`
    ),
  },
  {
    id: "patriota",
    nombreDama: "Dama patriota",
    nombreCaballero: "Caballero patriota",
    descripcionCorta: "Revolución de Mayo",
    promptDama: buildPrompt(
      `Vestir como MUJER PATRIOTA de la Revolución de Mayo en Buenos Aires, 1810 — partidaria civil de la causa de la Primera Junta. Vestido oscuro de paño con detalles bordados, mantilla de encaje sobre los hombros, escarapela CELESTE Y BLANCA (símbolo de la Revolución de Mayo, adoptada por las patriotas porteñas) prendida sobre el corazón. Cabello recogido con peinetón porteño. Expresión decidida y solemne. Una mano puede sostener un pequeño rollo o pergamino sugerido (proclama de la Junta).`
    ),
    promptCaballero: buildPrompt(
      `Vestir como CABALLERO PATRIOTA de la Revolución de Mayo en Buenos Aires, 1810 — partidario civil de la causa de la Primera Junta. Casaca azul oscuro con cuello alto bordado en dorado, charreteras o galones discretos, camisa blanca con jabot en el cuello, escarapela CELESTE Y BLANCA (símbolo de la Revolución de Mayo) prendida sobre el pecho. Sombrero tricornio sobre la cabeza o sostenido en una mano. Postura noble, mirada firme. NO confundir con uniforme militar: es indumentaria civil del cabildante o vecino patriota porteño.`
    ),
  },
  {
    id: "vendedor",
    nombreDama: "Vendedora ambulante",
    nombreCaballero: "Vendedor ambulante",
    descripcionCorta: "Calle porteña",
    promptDama: buildPrompt(
      `Vestir como VENDEDORA AMBULANTE PORTEÑA de Buenos Aires en 1810, oficio popular de las calles empedradas del Río de la Plata (calles del centro porteño, alrededor de la Plaza de la Victoria / Plaza Mayor). Vestido sencillo de paño marrón o crudo, delantal blanco modesto, pañuelo atado a la cabeza. Cesto o canasto de mimbre apoyado sobre el hombro o el costado, con panes, frutas locales o atados de yerba mate asomando. Expresión cálida y franca, propia del trato cotidiano del barrio porteño.`
    ),
    promptCaballero: buildPrompt(
      `Vestir como VENDEDOR AMBULANTE PORTEÑO de Buenos Aires en 1810, oficio popular de las calles empedradas del Río de la Plata. Camisa blanca holgada con chaleco de paño marrón, poncho rioplatense cruzado sobre el hombro, pañuelo en el cuello, sombrero de paja o de ala ancha de la época. Canasto de mimbre o atado de productos (panes, yerba mate) en una mano o al hombro. Expresión franca, propia del trato cotidiano del barrio porteño.`
    ),
  },
  {
    id: "patricio",
    nombreDama: "Patricio de Buenos Aires",
    nombreCaballero: "Patricio de Buenos Aires",
    descripcionCorta: "Regimiento de Patricios",
    // Históricamente no existieron patricias en el Regimiento — la UI
    // bloquea la card cuando el género es "dama".
    genderRestriction: "caballero",
    promptDama: "",
    promptCaballero: buildPrompt(
      `UNIFORME OBLIGATORIO E INVARIABLE — REGIMIENTO DE PATRICIOS DE BUENOS AIRES, uniforme histórico de gala (versión que hoy luce la Guardia Histórica del cuerpo, custodia ceremonial del Cabildo y Casa de Gobierno). Este personaje SIEMPRE viste este uniforme COMPLETO, sin excepciones. SÓLO el uniforme militar descripto abajo. El cuerpo fue fundado en 1806 durante las Invasiones Inglesas y fue eje de la Revolución de Mayo (Cornelio Saavedra fue su comandante).

ELEMENTOS DEL UNIFORME — DESCRIPCIÓN EXHAUSTIVA siguiendo fotos de referencia. Reproducir TODOS exactamente:

A) CHAQUETA / CASACA
- Color: AZUL MARINO oscuro (navy), paño grueso o pana fina.
- Largo: hasta la cadera/cintura, sin faldones largos.
- Frente: estilo doble pechera con DOS COLUMNAS PARALELAS VERTICALES de aproximadamente 7-8 BOTONES PLATEADOS / DE PELTRE cada una. Las dos columnas son simétricas y van desde el cuello hasta la cintura.
- ENTRE las dos columnas de botones NO hay solapa blanca, NO hay jabot, NO hay chaleco visible. Es el azul de la chaqueta directamente, con los botones plateados a ambos lados.
- Cuello: ROJO SANGRE / GRANATE, alto y parado, llegando hasta debajo de la mandíbula. NO blanco, NO dorado: rojo.
- Puños / vueltas en los extremos de las mangas: ROJOS también, con un par de botones plateados rematándolos.
- Hombros: planos, sin charreteras grandes ni galones dorados grandes.

B) FAJA EN LA CINTURA
- Banda de tela ROJA ANCHA cruzando la cintura por encima de la chaqueta, anudada al COSTADO IZQUIERDO del wearer dejando caer las puntas hacia abajo.

C) BANDOLERAS EN X (correas cruzadas en el pecho)
- DOS correas blancas (cuero o tela) cruzadas en X sobre el pecho: una baja del hombro izquierdo al costado derecho de la cintura, la otra del hombro derecho al costado izquierdo. Forman una X clara sobre el azul de la chaqueta.
- Ancho de cada correa: ~4-5 cm, parejo de extremo a extremo.
- ⚠️ EN EL PUNTO EXACTO DONDE SE CRUZAN LAS DOS CORREAS: completamente liso. Sólo las dos correas blancas superpuestas, una encima de la otra. NUNCA, BAJO NINGÚN CONCEPTO, va un BOTÓN, HEBILLA, PLACA METÁLICA, CHAPA, MEDALLA, ROSETA, ESCUDO, BROCHE, PRESILLA, NUDO, MOÑO ni ningún ornamento metálico, textil o de cuero sobre la intersección. La X es plana y limpia.

D) PANTALÓN Y CALZADO
- Pantalón BLANCO crudo entallado hasta debajo de la rodilla, o largo blanco según versión.
- Polainas o botas NEGRAS altas hasta debajo de la rodilla.
- Guantes BLANCOS de gala.

E) GALERA — DESCRIPCIÓN EXHAUSTIVA (es el rasgo más distintivo):
- Tipo: GALERA ESTILO SOMBRERO DE COPA / TOP HAT, de fieltro NEGRO. NO es un shako militar cilíndrico moderno, NO es bicornio, NO es tricornio, NO es chapeau.
- Forma: copa ALTA con CORONA REDONDEADA / DOMADA arriba (no plana), levemente cónica desde la base hacia arriba, dome top. El perfil es el de un sombrero de copa civil de principios del siglo XIX.
- Color: ÍNTEGRAMENTE NEGRA de arriba a abajo. Sin copa de otro color, sin cinta colorada, sin bordes vivos.
- Ala: media, curvada HACIA ARRIBA en los costados (no plana horizontal). El ala adopta una leve curvatura que abraza la cabeza.
- Banda al pie de la copa: cinta negra ligeramente más oscura que el fieltro del cuerpo, apenas marcada.

F) ADORNO LATERAL DE LA GALERA (al costado izquierdo del wearer = lado derecho del observador en una foto frontal):
- ESCUDETE ROJO / ESCARAPELA RECTANGULAR ROJA: un pedazo de paño rojo en forma RECTANGULAR vertical (aprox. 4×2 cm), prendido al costado izquierdo de la copa.
- LAZO DE CINTA BLANCA: una cinta blanca formando un BUCLE / LAZADA cerrada en forma de gota/lágrima invertida que envuelve el escudete rojo. La cinta blanca rodea visiblemente el rectángulo rojo y se cierra arriba dejando ver el rojo enmarcado dentro del bucle blanco.
- PLUMA BLANCA larga y vertical, sale desde la PARTE SUPERIOR del bucle/lazada blanca, hacia arriba y un poquito hacia atrás. La pluma puede ser bastante alta — del orden del alto de la copa — y es claramente visible, blanca, de plumón fino. NO un penacho gigante teatral, pero sí una pluma vertical clara.
- IMPORTANTE: TODO este conjunto (escudete rojo + lazo blanco + pluma blanca) va AL COSTADO IZQUIERDO de la galera, NO al frente centrado.

Postura: militar firme y digna, mirada al frente o ligeramente al costado, hombros derechos. Si entra naturalmente, sostiene un fusil con bayoneta en posición de presentar armas o un sable.

PROHIBIDO ABSOLUTAMENTE (anti-patrones explícitos):
- Traje civil de cualquier tipo (casaca de salón, jabot/chorrera, frac, sotana, túnica).
- Sombrero tricornio o bicornio.
- Shako militar moderno (cilindro plano arriba), shako con copa roja o cinta colorada.
- Galera con copa de color diferente al negro o con cintas/vivos rojos sobre la propia galera.
- Pluma o escarapela CENTRADAS al frente de la galera (todo el adorno va al costado izquierdo).
- BOTÓN, HEBILLA, PLACA, MEDALLA, ROSETA, ESCUDO, MOÑO o cualquier ornamento en el CENTRO de la X de bandoleras (la intersección es LISA).
- Solapas blancas en V sobre el pecho (la chaqueta no tiene; sólo doble columna de botones plateados directamente sobre el azul).
- Charreteras grandes doradas o galones dorados llamativos.
- Cuello blanco o dorado (es ROJO).
- Uniforme de granaderos de San Martín (azul-rojo de 1812+ con casaca distinta), Confederación, ejército moderno, traje de fines del XIX.

Si el modelo dudara entre civilianos y este uniforme, o entre versión simplificada y la descripta, ELEGIR SIEMPRE el uniforme histórico completo del Regimiento de Patricios tal como está descripto arriba.`
    ),
  },
  {
    id: "gaucho",
    nombreDama: "Gaucha del campo",
    nombreCaballero: "Gaucho del campo",
    descripcionCorta: "Pampa rioplatense",
    promptDama: buildPrompt(
      `Vestir como GAUCHA o PAISANA del campo rioplatense en 1810 — la pampa bonaerense, Virreinato del Río de la Plata. Blusa blanca de algodón con escote modesto, falda larga oscura de paño, chal o pañoleta cruzada sobre el pecho, pañuelo atado a la cabeza o sombrero de paja con barbijo. Botas de potro o alpargatas. Si entra naturalmente, sostiene un mate de calabaza con bombilla en la mano (costumbre rioplatense). Postura serena, mirada franca, propia de la vida en la pampa.`
    ),
    promptCaballero: buildPrompt(
      `Vestir como GAUCHO del campo rioplatense en 1810, paisano de la pampa bonaerense (Virreinato del Río de la Plata). Indumentaria gauchesca histórica: camisa blanca o crudo de algodón holgada, chiripá de paño oscuro sobre las piernas (NO pantalón europeo), faja ancha colorada en la cintura, poncho de lana cruzado sobre un hombro (tonos tierra, vino o gris). Sombrero aludo de copa baja con barbijo bajo el mentón, botas de potro o de cuero. Si entra naturalmente, facón al cinto en la espalda. Mirada franca y reservada, postura firme y descansada.`
    ),
  },
  {
    id: "aguatero",
    nombreDama: "Aguatera porteña",
    nombreCaballero: "Aguatero porteño",
    descripcionCorta: "Oficio del río",
    promptDama: buildPrompt(
      `Vestir como AGUATERA PORTEÑA de Buenos Aires en 1810 — oficio popular de la ciudad colonial anterior al agua corriente, característica del Río de la Plata. Vestido sencillo de paño oscuro, delantal de tela cruda, pañuelo atado a la cabeza, mantón sobre los hombros. Manos trabajadas. Si entra naturalmente, un cántaro de barro o un pequeño barril de madera con aros oscuros apoyado en la cadera o el hombro. Expresión digna y serena, propia del trabajo cotidiano del barrio porteño.`
    ),
    promptCaballero: buildPrompt(
      `Vestir como AGUATERO PORTEÑO de Buenos Aires en 1810 — oficio popular de la ciudad colonial anterior al agua corriente: el que cargaba agua del Río de la Plata en barriles y la repartía casa por casa por las calles empedradas. Camisa blanca de algodón holgada, chaleco de paño marrón o gris, pantalón ancho hasta la pantorrilla, faja en la cintura, pañuelo al cuello, sombrero de ala ancha. Botas o alpargatas. Si entra naturalmente, sostiene un barril de madera con aros metálicos al hombro o una jarra de barro. Expresión franca y trabajadora.`
    ),
  },
];

/* ── Helpers ─────────────────────────────────────────────────────────── */

/** Devuelve el personaje por id, o undefined si no existe. */
export function getCharacterById(id: CharacterId): Character | undefined {
  return CHARACTERS.find((c) => c.id === id);
}

/** Nombre completo del personaje según el género elegido. */
export function getFullName(c: Character, gender: Gender): string {
  return gender === "dama" ? c.nombreDama : c.nombreCaballero;
}

/** Prompt para Gemini correspondiente al personaje + género. */
export function getPrompt(c: Character, gender: Gender): string {
  return gender === "dama" ? c.promptDama : c.promptCaballero;
}

/** Etiqueta corta para mostrar dentro de la card del picker (declinada por género). */
const SHORT_LABELS: Record<CharacterId, { dama: string; caballero: string }> = {
  porteno: { dama: "Porteña", caballero: "Porteño" },
  patriota: { dama: "Patriota", caballero: "Patriota" },
  vendedor: { dama: "Vendedora", caballero: "Vendedor" },
  patricio: { dama: "Patricio", caballero: "Patricio" },
  gaucho: { dama: "Gaucha", caballero: "Gaucho" },
  aguatero: { dama: "Aguatera", caballero: "Aguatero" },
};

export function getShortLabel(c: Character, gender: Gender): string {
  return SHORT_LABELS[c.id][gender];
}
