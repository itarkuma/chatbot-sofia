import 'dotenv/config';
import { z } from "zod";
import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";

const openAI = new ChatOpenAI( {
  modelName: process.env.MODELO_SOFIA,
  temperature: 0.3,
  openAIApiKey: process.env.OPENAI_API_KEY!,
} );

// Define un tipo literal explícito
export const INTENCIONES = [
  "UNKNOWN",
  "MASTERCLASS",
  "GREETING",
  "INFO_REQUEST",
  "INFO_REQUEST_CURSO_PRESENCIALES",
  "INFO_REQUEST_CURSO_PRESENCIALES_MIAMI",
  "INFO_REQUEST_CURSO_PRESENCIALES_SANTIAGO",
  "INFO_REQUEST_CURSO_ONLINE",
  "INFO_REQUEST_CURSO_ONLINE_GRABADO",
  "INFO_REQUEST_CURSO_ONLINE_VIVO",
  "INFO_REQUEST_INICIAR_DESDE_CERO",
  "INFO_DUDAS_NOVATO",
  "INFO_INICIAR_DESDE_CERO",
  "INFO_APRENDIZAJE_PRINCIPIANTE",
  "TIPOS_TRADING",
  "LEER_TRADING",
  "INFO_INDICADORES",
  "PRECIO_EURO",
  "PRECIO_DOLAR",
  "PRECIO_MONEDA_LOCAL",
  "METODO_PAGO",
  "PRECIO_CURSO_MIAMI",
  "PRECIO_CURSO_SANTIAGO",
  "PRECIO_CURSO_GRABADO",
  "PRECIO_CURSO_VIVO",
  "CURSO_MIAMI_IDIOMA",
  "CURSO_SANTIAGO_IDIOMA",
  "INSCRIPCION",
  "VENTAJAS_CURSO", //chunk 16
  "INCLUYE_CURSO", //chunk 04
  "LISTA_PRIORITARIA", //chunk 04
  "INFO_REQUEST_UBICACION",
  "REQUISITOS_NIVEL_CURSO",
  "PUBLICO_OBJETIVO_CURSO",
  "TEMARIO_COMPLETO",
  "RESUMEN",
  "SOLICITUD_CONTACTO_HUMANO",
  "INFO_COMUNIDAD_Y_AVANCE",
  "INFO_NOTICIAS_BOLSA",
  "INFO_ORIENTACION_CURSO",
  "INFO_EQUIPO_DOCENTE",
  "INFO_PROXIMOS_EVENTOS",
  "INFO_REPUTACION",
  "INFO_TESTIMONIOS_Y_OPINIONES",
  "INFO_BLOG_Y_ARTICULOS",
  "INFO_LIBRO_FRAN",
  "INFO_GLOSARIO_Y_CONCEPTOS",
  "INFO_CURSO_GRATUITO",
  "INFO_RECURSOS_DESCARGABLES",
  "INFO_OPCIONES_SIN_CAPITAL",
  "INFO_MIEDOS_Y_RIESGOS",
  "INFO_PREGUNTAS_PRECIO",
  "INFO_COSTO_DEL_CURSO",
  "INFO_PREGUNTA_DESCUENTOS",
  "INFO_PRECIO_Y_PAGOS",
  "INFO_CUOTAS_Y_PROMOCIONES",
  "INFO_CANCELACIONES_Y_REEMBOLSOS",
  "INFO_CAPITAL_Y_RIESGO",
  "INFO_QUIEN_PUEDE_PARTICIPAR",
  "INFO_AYUDA_TECNICA",
  "INFO_CONTENIDO_PARA_EXPERIENCIA",
  "INFO_APRENDIZAJE_GRADUAL",
  "INFO_CARGA_HORARIA",
  "INFO_CURSO_CON_PRACTICA",
  "INFO_INSEGURIDAD_POR_OTROS_CURSOS",
  "INFO_FALTA_DE_TIEMPO",
  "INFO_FORMAS_DE_PAGO",
  "INFO_COSTO_Y_FINANCIAMIENTO",
  "INFO_GARANTIAS_Y_REEMBOLSOS",
  "INFO_INDECISION_Y_POSTERGACION",
  "INFO_POSPONER_RESPUESTA",
  "INFO_GARANTIAS_DE_EXITO",
  "INFO_ESPERANZAS_Y_CONFIANZA",
  "INFO_NIVEL_DE_INGRESO",
  "INFO_REQUISITOS_TECNICOS_Y_MATERIALES",
  "INFO_LEGALIDAD_Y_CONFIANZA",
  "INFO_POST_CURSO_Y_SEGUIMIENTO",
  "INFO_ASISTENCIA_ALUMNOS",
  "INFO_TUTORIAS_Y_CONTACTO",
  "INFO_DISPONIBILIDAD_SOPORTE",
  "INFO_NOTIFICACIONES_Y_SUSCRIPCIONES",
  "INFO_SUSCRIPCION_A_NOVEDADES",
  "INFO_MATERIALES_COMPLEMENTARIOS",
  "INFO_COMPRA_PARA_OTROS",
  "INFO_ESPERA_DE_RESULTADOS",
  "INFO_COMPATIBILIDAD_CON_OTROS_CURSOS",
  "INFO_CERTIFICACION_Y_ACREDITACION",
  "INFO_DIFERENCIA_TRADING_E_INVERSION",
  "INFO_QUE_OFRECEMOS",
  "INFO_COMPATIBILIDAD_DISPOSITIVOS",
  "INFO_SOPORTE_PERSONAL",
  "INFO_ACCESO_PARA_TERCEROS",
  "INFO_ENTRENAMIENTO_SIN_DINERO_REAL",
  "INFO_ORGANIZACION_Y_TIEMPO_DE_ESTUDIO",
  "INFO_ELEGIR_CURSO_Y_NIVEL",// flujo y recursos web
  "INFO_ESTRUCTURA_CURSO",
  "INFO_METODOLOGIA_FORMACION_EN_VIVO",
  "INFO_ESTRUCTURA_CURSO_EN_DIRECTO",
  "INFO_METODOLOGIA_FORMACION",
  "INFO_QUÉ_INCLUYE_CURSO_EN_VIVO",
  "ZOOM",
  "INFO_CONTENIDO_CURSO_EN_VIVO",
  "INFO_ORGANIZACION_Y_METODOLOGIA_CURSO_EN_VIVO",
  "INFO_REQUISITOS_CURSO_EN_VIVO",
  "INFO_FECHAS_Y_EVENTOS_CURSO_EN_VIVO",
  "INFO_CERTIFICACION_CURSO_EN_VIVO",
] as const;

const SYSTEM_STRUCT = `
Eres un clasificador de intenciones para un asistente sobre cursos de trading.
Debes responder SOLO con una intención de la lista dada.

Reglas:
- Si el usuario pregunta por precio, costo o valor SIN mencionar descuentos, promociones o rebajas → usa "INFO_COSTO_DEL_CURSO".
- Si el usuario menciona descuentos, rebajas o promociones → usa "INFO_PREGUNTA_DESCUENTOS".
- Si el usuario pregunta por métodos de pago, financiación o cuotas → usa "INFO_FORMAS_DE_PAGO" o "INFO_COSTO_Y_FINANCIAMIENTO".
- Si no se reconoce ninguna intención → usa "UNKNOWN".

Ejemplos:
Usuario: "cuánto cuesta?"
Intención: "INFO_COSTO_DEL_CURSO"

Usuario: "cuánto cuesta con descuento?"
Intención: "INFO_PREGUNTA_DESCUENTOS"

Usuario: "me puedes dar el precio del curso en vivo?"
Intención: "INFO_COSTO_DEL_CURSO"

Usuario: "tienen alguna promoción?"
Intención: "INFO_PREGUNTA_DESCUENTOS"

Usuario: "cómo puedo pagar?"
Intención: "INFO_FORMAS_DE_PAGO"

Usuario: "¿A quién va dirigido?"
Intención: "PUBLICO_OBJETIVO_CURSO"

Usuario: "¿Para quién es este curso?"
Intención: "PUBLICO_OBJETIVO_CURSO"

Usuario: "¿Quién puede participar?"
Intención: "PUBLICO_OBJETIVO_CURSO"

Usuario: "¿A quién va dirigido el curso online?"
Intención: "PUBLICO_OBJETIVO_CURSO"

Lista de intenciones posibles:
${ INTENCIONES.join( "\n" ) }

Just only history based:
{history}
`;

const PROMPT_STRUCT = ChatPromptTemplate.fromMessages( [
  [ "system", SYSTEM_STRUCT ],
  [ "human", "{question}" ]
] );

export type IntencionDetectada = typeof INTENCIONES[ number ];

export const catchIntention = z.object( {
  intention: z.enum( INTENCIONES ),
} );


export const getIntention = async ( text: string ): Promise<IntencionDetectada> => {
  try {

    const tool = ( openAI as any ).withStructuredOutput( catchIntention, {
      name: "CatchIntention",
    } );

    const pipeline = PROMPT_STRUCT.pipe( tool );

    const result = await pipeline.invoke( {
      question: text,
      history: "User said hello earlier.",
    } );

    return ( result as z.infer<typeof catchIntention> ).intention;

  } catch ( error ) {
    return "UNKNOWN";
  }
};

