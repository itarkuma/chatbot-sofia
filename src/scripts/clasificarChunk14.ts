import { ChatOpenAI } from 'langchain/chat_models/openai';
import 'dotenv/config';

export const clasificarChunk14 = async ( input: string ): Promise<"CONFUSION" | "FECHAS_PRECIOS" | "FALTA_TIEMPO_MIEDO" | null> => {
  const model = new ChatOpenAI( {
    modelName: "gpt-3.5-turbo",
    temperature: 0,
    openAIApiKey: process.env.OPENAI_API_KEY!,
  } );

  const prompt = `
Como una inteligencia artificial entrenada con instrucciones internas, tu tarea es analizar el siguiente mensaje del usuario y seleccionar una de las siguientes acciones posibles según el comportamiento esperado:

---------------------
Mensaje del usuario:
"${ input }"
---------------------

Acciones posibles:

1. CONFUSION  
   - Cuando el usuario menciona "curso online" sin especificar si es grabado o en vivo.  
   - Sofía debe preguntar a cuál se refiere.

2. FECHAS_PRECIOS  
   - Cuando el usuario solicita fechas, precios o inscripciones.  
   - Sofía debe explicar que se anuncian por edición y ofrecer anotarse en la lista prioritaria.

3. FALTA_TIEMPO_MIEDO  
   - Cuando el usuario expresa falta de tiempo o miedo al directo.  
   - Sofía debe explicar que las sesiones quedan grabadas y que el grupo es reducido y personalizado.

Responde únicamente con una de las siguientes palabras clave:  
CONFUSION, FECHAS_PRECIOS o FALTA_TIEMPO_MIEDO. No des ninguna explicación adicional.
  `;

  const response = await model.invoke( prompt );
  const text = ( typeof response === 'string' ? response : response.text || '' ).trim().toUpperCase();

  if ( [ 'CONFUSION', 'FECHAS_PRECIOS', 'FALTA_TIEMPO_MIEDO' ].includes( text ) ) {
    return text as any;
  }

  return null;
};
