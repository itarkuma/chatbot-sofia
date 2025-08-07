import 'dotenv/config';
import { z } from "zod";
import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";

const openAI = new ChatOpenAI( {
  modelName: process.env.MODELO_SOFIA,
  temperature: 0.3,
  openAIApiKey: process.env.OPENAI_API_KEY!,
} );


const SYSTEM_STRUCT = `just only history based: 
{history}

Answer the users question as best as possible.`;

const PROMPT_STRUCT = ChatPromptTemplate.fromMessages( [
  [ "system", SYSTEM_STRUCT ],
  [ "human", "{question}" ]
] );

// Nuevas intenciones
const catchIntention = z.object( {
  intention: z.enum( [
    "UNKNOWN",
    "GREETING",
    "INFO_REQUEST",
    "INFO_REQUEST_CURSO_PRESENCIALES",
    "INFO_REQUEST_CURSO_PRESENCIALES_MIAMI",
    "INFO_REQUEST_CURSO_PRESENCIALES_SANTIAGO",
    "INFO_REQUEST_CURSO_ONLINE",
    "INFO_REQUEST_CURSO_ONLINE_GRABADO",
    "INFO_REQUEST_CURSO_ONLINE_VIVO",
    "PRECIO_EURO",
    "PRECIO_DOLAR",
    "PRECIO_MONEDA_LOCAL",
    "METODO_PAGO",
    "PRECIO_CURSO",
    "PRECIO_CURSO_MIAMI",
    "PRECIO_CURSO_SANTIAGO",
    "PRECIO_CURSO_GRABADO",
    "PRECIO_CURSO_VIVO"
  ] )
} );

type IntentionResponse = z.infer<typeof catchIntention>;

export const getIntention = async ( text: string ): Promise<string> => {
  try {

    const tool = ( openAI as any ).withStructuredOutput( catchIntention, {
      name: "CatchIntention",
    } );

    const pipeline = PROMPT_STRUCT.pipe( tool );

    const result = await pipeline.invoke( {
      question: text,
      history: "User said hello earlier.",
    } );

    const intention = ( result as IntentionResponse ).intention.toLowerCase();
    return intention;
  } catch ( error ) {
    return "unknown";
  }
};

// --- Ejemplo de uso ---
( async () => {
  // let intention = await getIntention( "¿Cuál es el precio del curso en Miami?" );
  // console.log( "Intention:", intention ); // -> sales
  // intention = await getIntention( "Buenas noches" );
  // console.log( "Intention:", intention ); // -> sales
  // intention = await getIntention( "Saludos" );
  // console.log( "Intention:", intention ); // -> sales
  // intention = await getIntention( "Hey cómo están?" );
  // console.log( "Intention:", intention ); // -> sales
  // intention = await getIntention( "¿Cuánto cuesta el curso en Miami?" );
  // console.log( "Intention:", intention ); // -> sales
  // intention = await getIntention( "¿Qué vale el curso en Santiago de Compostela?" );
  // console.log( "Intention:", intention ); // -> sales
  // intention = await getIntention( "¿Precio del curso?" );
  // console.log( "Intention:", intention ); // -> sales
  // intention = await getIntention( "Hello" );
  // console.log( "Intention:", intention ); // -> sales
  // intention = await getIntention( "Buenas, ¿qué hay?" );
  // console.log( "Intention:", intention ); // -> sales
  // intention = await getIntention( "moneda local" );
  // console.log( "Intention:", intention ); // -> sales
  // intention = await getIntention( "pesos colombianos" );
  // console.log( "Intention:", intention ); // -> sales
  // intention = await getIntention( "¿Cuáles son los métodos de pago?" );
  // console.log( "Intention:", intention ); // -> sales
  // intention = await getIntention( "¿Qué formas de pago hay?" );
  // console.log( "Intention:", intention ); // -> sales
  // intention = await getIntention( "¿Cuáles son las modalidades de pago?" );
  // console.log( "Intention:", intention ); // -> sales
  // intention = await getIntention( "Buen día" );
  // console.log( "Intention:", intention ); // -> sales
} )();