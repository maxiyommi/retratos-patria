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
const PROMPT_INTRO = `Transformá esta fotografía en un retrato pintado al óleo del Río de la Plata colonial, año 1810. Conservá EXACTAMENTE el rostro de la persona retratada: rasgos faciales, forma de la cara, edad, expresión, color de piel y complexión general. NO modifiques el rostro ni el cuerpo. Sólo cambiá indumentaria, peinado adecuado a la época, fondo y estilo pictórico.`;

const PROMPT_STYLE = `Técnica pictórica: retrato al óleo colonial rioplatense, pincelada visible pero refinada, fondo neutro oscuro (tonos sepia, ocre quemado, marrón verdoso) con un acento de luz pictórica que destaca el rostro. Encuadre de medio cuerpo, semi-perfil de tres cuartos. Paleta sobria de tierras, marfiles, dorados apagados y sepias.`;

const PROMPT_SAFETY = `El retrato debe ser apto para audiencias escolares (niños y niñas). Sin contenido sexualizado, sin pieles expuestas más allá de lo natural en un retrato formal de época, sin violencia explícita. No alterar la edad ni el cuerpo de la persona retratada.`;

function buildPrompt(attire: string): string {
  return `${PROMPT_INTRO}\n\nVestimenta y caracterización:\n${attire}\n\n${PROMPT_STYLE}\n\n${PROMPT_SAFETY}`;
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
