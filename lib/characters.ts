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
      `Uniforme histórico del REGIMIENTO DE PATRICIOS DE BUENOS AIRES (versión actual de la Guardia Histórica, custodia ceremonial del Cabildo). Reproducir EXACTAMENTE este uniforme — todos los elementos, sin variantes.

═══════════════════════════════════════════════════════
RESUMEN VISUAL (gestalt): un soldado con CHAQUETA AZUL NAVY de DOS hileras de botones plateados BIEN SEPARADAS sobre el pecho, HOMBROS LISOS SIN HOMBRERAS, CUELLO ROJO con 4 botones plateados, PUÑOS ROJOS, FAJA ROJA, dos correas blancas cruzadas en X sobre el pecho, y una GALERA NEGRA de COPA MODERADA (no muy alta) tipo SOMBRERO DE COPA con UNA SOLAPA MUY CORTA Y CHIQUITA pegada contra la copa del lado izquierdo (no sobresale, queda contra la copa), donde está el adorno rojo y blanco con una PLUMA BLANCA vertical alta.
═══════════════════════════════════════════════════════

╔═══════════════════════════════════════════════════════╗
║  ⚠️ ELEMENTO MÁS DIFÍCIL — LA GALERA (leer primero)  ║
╚═══════════════════════════════════════════════════════╝

LA GALERA del Patricio es lo que el modelo SUELE EQUIVOCAR. Reproducir EXACTAMENTE así:

FORMA Y TIPO:
- Es un SOMBRERO DE COPA / TOP HAT de fieltro negro, estilo civil de principios del siglo XIX — silueta de sombrero de copa clásico.
- En inglés se llamaría "stovepipe top hat" o "tall felt top hat".
- ALTURA de la copa: MODERADA — un poco más alta que ancha, pero NO un sombrero de copa muy alto tipo Lincoln. La copa es contenida, modesta en alto, aproximadamente entre 14-18 cm de alto (la mitad o un poco más del ancho de la cabeza). NO es la copa altísima del top-hat victoriano; es más corta y compacta.
- TOP / CORONA: redondeada, levemente domada o plana suave. NO un cilindro hueco con boca arriba, NO una boca abierta tipo shako.
- LADOS de la copa: rectos verticales — NO un cilindro rígido de shako militar.
- ALA: ANGOSTA Y CORTA en todo el contorno — apenas un reborde estrecho que rodea la base de la copa. NO ala media de gentleman top-hat, NO ala ancha de cowboy ni de gauchesco.

- ⚠️⚠️ SOLAPA LEVANTADA — REQUISITO CRÍTICO: del lado izquierdo del wearer (mismo costado del adorno), una parte del ala se levanta y queda PEGADA CONTRA LA COPA. Esta SOLAPA LEVANTADA es **MUY CORTA, CHIQUITA, DISCRETA — NUNCA larga, NUNCA ancha, NUNCA grande**. Apenas un PETALITO de fieltro pegado al lado de la copa, del tamaño aproximado del adorno (escudete + loop) que sostiene. Su altura es como mucho un tercio de la altura de la copa. La solapa **NO sobresale del contorno superior de la copa**, queda contenida dentro del perfil del sombrero, ceñida.

- LO QUE NO ES LA SOLAPA: NO una solapa ancha que cubra toda la cara izquierda de la galera, NO una pestaña grande tipo bicornio napoleónico, NO una valva que extienda lateralmente, NO un ala entera curvada hacia arriba, NO una pieza que sobresalga arriba de la copa, NO una solapa de ala extendida que se pliega como tricornio. Es una piecita chiquita, casi vestigial, sólo lo necesario para sostener el adorno.

- El resto del ala (lado derecho del wearer, frente, parte de atrás) se mantiene PLANO al horizonte, ANGOSTO. NO levantado en ningún otro lado.
- COLOR: ÍNTEGRAMENTE NEGRO de fieltro mate, de arriba a abajo, sin ninguna parte de otro color, sin cinta colorada, sin galones, sin bordes vivos. Sólo negro.

ADORNO LATERAL DE LA GALERA (al costado izquierdo del wearer, lado derecho del observador en foto frontal):
- ROSETA / ESCUDETE rectangular vertical de tela ROJA (aprox. 4×2 cm), prendida sobre el costado de la copa.
- Sobre ese rectángulo rojo, una CINTA / LAZO BLANCO en forma de LOOP / LAZADA / GOTA INVERTIDA que envuelve y enmarca el rectángulo rojo. El loop blanco rodea el rojo de manera que se ve el rojo adentro y el blanco alrededor.
- De la parte ALTA del loop blanco SALE LA PLUMA BLANCA: una pluma vertical, larga (del orden del alto de la copa de la galera, o un poco menos), inclinada apenas hacia atrás. Es UNA sola pluma blanca clara, no un penacho. Color blanco puro.
- TODO el adorno (rectángulo rojo + loop blanco + pluma blanca) va AL COSTADO IZQUIERDO de la galera, NO en el centro frontal.

LO QUE NO ES LA GALERA — anti-patrones específicos a evitar:
- NO es un shako militar (cilindro hueco con boca arriba).
- NO es un morrión con visera.
- NO es un bicornio ni tricornio.
- NO es un sombrero de copa civil moderno (esos tienen ala plana horizontal).
- NO es un bowler / sombrero bombín (bajo y squat).
- NO es un sombrero gauchesco de ala muy ancha.
- NO tiene visera adelante.
- NO tiene copa roja arriba (la copa es NEGRA — el rojo es sólo el escudete del adorno lateral).
- NO tiene la pluma centrada al frente (va al costado izquierdo).

═══════════════════════════════════════════════════════
RESTO DEL UNIFORME (elementos secundarios — todos obligatorios)
═══════════════════════════════════════════════════════

A) CHAQUETA / CASACA
- Color: AZUL MARINO oscuro (navy), paño grueso.
- Largo: hasta la cadera/cintura.
- Frente: estilo DOBLE PECHERA — **EXACTAMENTE DOS COLUMNAS** PARALELAS VERTICALES de 7-8 BOTONES PLATEADOS / DE PELTRE cada una. Sólo DOS, nunca tres, nunca cuatro, nunca filas adicionales arriba o al costado. Sólo dos columnas paralelas, ni una más.
- **Las dos columnas están BIEN SEPARADAS / SPACED APART, cada una sobre el costado del pecho** (una a la izquierda, otra a la derecha — NO juntas al centro). El espacio entre ambas columnas es amplio, equivalente al ancho del esternón o más, dejando un panel azul liso vertical en el centro del pecho.
- ENTRE las dos columnas: NADA. No hay tercera columna, no hay botones adicionales, no hay condecoraciones, no hay galones cruzando horizontalmente, no hay alamares decorativos, no hay broches. Sólo el azul liso de la chaqueta entre las dos columnas verticales de botones.
- ENTRE las dos columnas de botones NO hay solapa blanca, NO hay jabot, NO hay chaleco visible — es el azul liso de la chaqueta directamente, con los botones plateados a ambos costados.
- CUELLO: ROJO ALTO Y PARADO (granate), llegando hasta la mandíbula. NO blanco, NO dorado.
- **EN EL CUELLO ROJO van CUATRO (4) BOTONES PLATEADOS pequeños, dos a cada lado, en línea horizontal sobre la tela roja del cuello**, simulando un cierre frontal del cuello.
- PUÑOS / vueltas en los extremos de las mangas: ROJOS también, con un par de botones plateados.
- Hombros: PLANOS, completamente lisos. **NUNCA hombreras rojas, charreteras rojas, sobrehombros de tela roja, fleco rojo en los hombros, ni cualquier ornamento rojo sobre el hombro**. Tampoco charreteras grandes doradas ni galones llamativos. Los hombros son sólo el azul navy de la chaqueta, sin agregados.

B) FAJA
- Banda de tela ROJA ANCHA en la cintura, por encima de la chaqueta, anudada al costado.

C) BANDOLERAS EN X
- DOS correas blancas cruzadas en X sobre el pecho. Una baja del hombro izquierdo a la cadera derecha; la otra del hombro derecho a la cadera izquierda. Forman una X clara.
- Ancho de cada correa: ~4-5 cm, parejo.
- ⚠️ INTERSECCIÓN DE LA X: completamente LISA. Sólo las dos correas blancas superpuestas. NUNCA, BAJO NINGÚN CONCEPTO, va un BOTÓN, HEBILLA, PLACA, CHAPA, MEDALLA, ROSETA, ESCUDO, BROCHE, NUDO, MOÑO, INSIGNIA, EMBLEMA ni ningún ornamento sobre el cruce. Cero metales o textiles en el centro de la X.

D) PANTALÓN Y CALZADO
- Pantalón BLANCO crudo entallado hasta debajo de la rodilla, o más largo según versión.
- Botas o polainas NEGRAS altas hasta debajo de la rodilla.
- Guantes BLANCOS de gala.

═══════════════════════════════════════════════════════

Postura: militar firme y digna, hombros rectos, mirada al frente. Si entra naturalmente, sostiene un fusil con bayoneta o un sable. NO sostener objetos modernos, NO sostener nada anacrónico.

PROHIBIDO ABSOLUTAMENTE (lista exhaustiva de anti-patrones):
- Cualquier tipo de TRAJE CIVIL: casaca de salón, jabot/chorrera, frac, smoking, sotana, túnica, sobrecasaca larga, camisa sin chaqueta encima.
- SOMBREROS distintos a la galera descripta: tricornio, bicornio, shako cilíndrico militar moderno, morrión con visera, sombrero de copa civil con ala plana ENTERA, sombrero bombín, sombrero gauchesco aludo, sombrero de paja, gorra con visera. La galera es UNA sola forma, top-hat alto angosto negro con UN solo lado del ala (el izquierdo) levantado contra la copa.
- Galera con AMBOS lados del ala curvados hacia arriba (es UNO solo, el izquierdo). Galera con el ala enteramente plana sin lado levantado. Galera con el lado DERECHO levantado en vez del izquierdo.
- Columnas de botones plateados JUNTAS / CENTRADAS al medio del pecho (las dos columnas van bien SEPARADAS, una sobre cada costado del pecho, con panel azul liso en el medio).
- Cuello rojo SIN los 4 botones plateados (los 4 botones en el cuello son parte del uniforme; no omitir).
- Galera con COPA ROJA u otra cinta colorada. La galera es íntegramente NEGRA; el rojo está en el ESCUDETE del adorno lateral, NO en la galera misma.
- Pluma o escarapela CENTRADAS al frente de la galera (van al COSTADO IZQUIERDO).
- BOTÓN/HEBILLA/PLACA/MEDALLA/ROSETA/ESCUDO/MOÑO en el centro de la X de bandoleras (intersección LISA).
- Solapas blancas en V sobre el pecho (la chaqueta NO tiene solapas blancas; el blanco está sólo en las bandoleras en X).
- HOMBRERAS ROJAS, charreteras rojas, fleco rojo, sobrehombros rojos, o cualquier ornamento rojo en los hombros — NUNCA. Los hombros son sólo azul navy liso de la chaqueta.
- Charreteras grandes doradas o galones dorados llamativos en los hombros.
- Galera muy alta tipo top-hat victoriano de Lincoln — es de copa MODERADA, no extremadamente alta.
- ⚠️ Solapa de la galera ANCHA, LARGA, GRANDE, EXTENDIDA, o que SOBRESALGA por encima del contorno de la copa — TODOS PROHIBIDOS. La solapa levantada del lado izquierdo es CHIQUITA, casi vestigial, apenas lo necesario para sostener el adorno, contenida dentro del perfil del sombrero. NUNCA solapa tipo bicornio napoleónico (larga y cocada), NUNCA solapa que cubra toda la cara izquierda de la copa, NUNCA una valva extendida lateralmente, NUNCA un ala plegada hacia arriba estilo tricornio. Si la solapa parece grande, está mal: hacerla más chica.
- Ala completa media-ancha o ancha — el ala es ANGOSTA. NUNCA ala media-ancha tipo gentleman top-hat, NUNCA ala ancha de cowboy o gauchesca.
- Más de dos columnas de botones en la chaqueta — son SIEMPRE exactamente DOS, ni más ni menos. NO una tercera columna central, NO botones agregados arriba o en los costados, NO galones, NO alamares decorativos, NO condecoraciones cruzando el pecho.
- Cuello blanco o dorado en lugar de ROJO.
- Uniforme de granaderos de San Martín (1812+ — casaca con plastrón rojo distinto), Confederación, ejército argentino moderno, traje militar de fines del XIX.

Si el modelo dudara entre versiones simplificadas o entre civilianos y este uniforme, ELEGIR SIEMPRE la reconstrucción completa exacta del uniforme del Regimiento de Patricios tal como está descripto arriba — galera incluida con su forma de top-hat alto y adorno al costado.`
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
