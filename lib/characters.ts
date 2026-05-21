/*
 * characters.ts — fuente única de verdad de los 4 personajes.
 *
 * Cada personaje es un ROL neutro respecto al género (porteño/a, patriota,
 * vendedor/a, soldado/a). El género (dama/caballero) lo elige aparte el
 * usuario con el GenderToggle. La combinación rol × género da:
 *  - el nombre completo que se muestra en la cartela del retrato
 *  - el prompt específico que se manda a Gemini con la foto del usuario
 *
 * Reglas que TODOS los prompts respetan:
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

export type CharacterId = "porteno" | "patriota" | "vendedor" | "soldado";

export interface Character {
  id: CharacterId;
  /** Nombre completo cuando el género es dama (mostrado en la cartela). */
  nombreDama: string;
  /** Nombre completo cuando el género es caballero. */
  nombreCaballero: string;
  /** Frase corta que se muestra debajo del nombre en la card del picker. */
  descripcionCorta: string;
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

const PROMPT_INTRO = `Esta fotografía muestra a una persona específica. Tu tarea: crear un retrato al óleo de ESA MISMA PERSONA, reconocible, vestida con indumentaria de la Buenos Aires colonial de 1810.

PRESERVACIÓN DEL ROSTRO — lo más importante de toda la instrucción:
La cara del retrato debe verse exactamente igual a la de la foto original. Conservá rigurosamente: la forma del rostro y la estructura ósea (mandíbula, mejillas, frente), la forma y el color de los ojos, la forma y el tamaño de la nariz, la forma de la boca y los labios, el arco y la posición de las cejas, el tono y la textura de la piel, la edad aparente de la persona, la expresión facial, el color y la textura del cabello, y cualquier marca distintiva (lunares, pecas, cicatrices). Alguien que conoce a la persona debe poder identificarla al instante en el retrato. La FIDELIDAD al original es más valiosa que la estética: no idealices, no embellezcas, no suavices arrugas, no rejuvenezcas ni envejezcas, no cambies proporciones, no agregues maquillaje que altere los rasgos.

El peinado SÓLO se ajusta si la moda de época lo requiere (por ejemplo, recogido bajo un peinetón o un sombrero); en ese caso, mantener el color y la textura del cabello.

GÉNERO DEL PERSONAJE: lo define exclusivamente la INDUMENTARIA descripta más abajo, NO el rostro. Si la indumentaria es femenina pero la cara es masculina (o viceversa), el rostro permanece tal cual está en la foto y sólo se viste el personaje según el rol. No "feminizar" ni "masculinizar" la cara para que matchee con la ropa.`;

const PROMPT_STYLE = `Técnica pictórica: retrato al óleo colonial rioplatense del siglo XIX temprano, pincelada visible pero refinada. Fondo neutro oscuro (tonos sepia, ocre quemado, marrón verdoso) con un acento de luz pictórica que destaca el rostro. Encuadre de medio cuerpo, semi-perfil de tres cuartos. Paleta sobria de tierras, marfiles, dorados apagados y sepias. La piel del personaje conserva las imperfecciones naturales propias del retratado original — no la suavices artificialmente.`;

const PROMPT_SAFETY = `Apto para audiencias escolares (niños y niñas). Sin contenido sexualizado, sin pieles expuestas más allá de lo natural en un retrato formal de época, sin violencia explícita. No alterar la edad ni el cuerpo del retratado.`;

function buildPrompt(attire: string): string {
  return `${PROMPT_INTRO}\n\nINDUMENTARIA Y CARACTERIZACIÓN DEL PERSONAJE:\n${attire}\n\nESTILO PICTÓRICO:\n${PROMPT_STYLE}\n\nSEGURIDAD:\n${PROMPT_SAFETY}`;
}

export const CHARACTERS: Character[] = [
  {
    id: "porteno",
    nombreDama: "Dama porteña",
    nombreCaballero: "Caballero porteño",
    descripcionCorta: "vestimenta de sociedad porteña",
    promptDama: buildPrompt(
      `Vestir como dama porteña de sociedad de 1810. Vestido de talle alto al estilo Imperio, en muselina o seda clara, con bordados sutiles en el corpiño. Peinetón alto de carey sobre el cabello recogido. Mantilla de encaje sobre los hombros. Aros de perla pequeños. Manos serenas. Postura recta y digna.`
    ),
    promptCaballero: buildPrompt(
      `Vestir como caballero porteño de sociedad de 1810. Casaca oscura de paño con solapas anchas, chaleco bordado color crema o vino, camisa blanca con jabot (chorrera de encaje) en el cuello. Pelo peinado hacia atrás o con coleta atada. Posiblemente un anillo o reloj de cadena. Postura erguida y serena.`
    ),
  },
  {
    id: "patriota",
    nombreDama: "Dama patriota",
    nombreCaballero: "Caballero patriota",
    descripcionCorta: "casaca azul y tricornio de Mayo",
    promptDama: buildPrompt(
      `Vestir como mujer patriota de la Revolución de Mayo de 1810. Vestido oscuro de paño con detalles bordados, mantilla de encaje, escarapela celeste y blanca prendida sobre el corazón. Cabello recogido con peinetón. Expresión decidida y solemne. Una mano puede sostener un pequeño rollo o pergamino sugerido.`
    ),
    promptCaballero: buildPrompt(
      `Vestir como caballero patriota de la Revolución de Mayo de 1810. Casaca azul oscuro con cuello alto bordado en dorado, charreteras o galones discretos, camisa blanca con jabot en el cuello, escarapela celeste y blanca prendida sobre el pecho. Sombrero tricornio sobre la cabeza o sostenido en una mano. Postura noble, mirada firme.`
    ),
  },
  {
    id: "vendedor",
    nombreDama: "Vendedora ambulante",
    nombreCaballero: "Vendedor ambulante",
    descripcionCorta: "poncho, sombrero y canasto",
    promptDama: buildPrompt(
      `Vestir como vendedora ambulante porteña de 1810, oficio popular del Río de la Plata. Vestido sencillo de paño marrón o crudo, delantal blanco modesto, pañuelo en la cabeza. Cesto o canasto de mimbre apoyado sobre el hombro o el costado, con panes, frutas o atados de yerba asomando. Expresión cálida y franca, propia de la calle.`
    ),
    promptCaballero: buildPrompt(
      `Vestir como vendedor ambulante porteño de 1810, oficio popular del Río de la Plata. Camisa blanca holgada con chaleco de paño marrón, poncho cruzado sobre el hombro, pañuelo en el cuello, sombrero de paja o de ala ancha. Canasto de mimbre o atado de productos (panes, yerba) en una mano o al hombro. Expresión franca, propia de la calle.`
    ),
  },
  {
    id: "soldado",
    nombreDama: "Soldada de la Patria",
    nombreCaballero: "Soldado de la Patria",
    descripcionCorta: "morrión, escarapela y fusil",
    promptDama: buildPrompt(
      `Vestir como soldada de la Patria de 1810, en honor a las mujeres que combatieron en la independencia (por ejemplo, Juana Azurduy). Casaca militar azul oscuro con vivos celestes y blancos, charreteras doradas, camisa blanca debajo. Cabello recogido o con sombrero. Escarapela celeste y blanca prominente. Si entra naturalmente, sostiene un sable o un fusil con la culata apoyada. Postura militar firme y digna.`
    ),
    promptCaballero: buildPrompt(
      `Vestir como soldado de la Patria de 1810, miembro de las milicias patriotas. Casaca militar azul oscuro con vivos celestes y blancos, charreteras doradas, camisa blanca debajo. Morrión negro o tipo casco con escarapela celeste y blanca prominente al frente, posiblemente con un penacho. Si entra naturalmente, sostiene un fusil con la culata apoyada o un sable al cinto. Postura militar firme y digna.`
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
  soldado: { dama: "Soldada", caballero: "Soldado" },
};

export function getShortLabel(c: Character, gender: Gender): string {
  return SHORT_LABELS[c.id][gender];
}
