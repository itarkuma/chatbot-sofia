import 'dotenv/config';
import { OpenAIEmbeddings, ChatOpenAI } from '@langchain/openai';
import { PineconeStore } from '@langchain/pinecone';
import { pinecone } from '../lib/pinecone/connect';
import { PromptTemplate } from '@langchain/core/prompts';

import { preprocessPregunta } from '../lib/utils/preprocessinText';

import { distance } from 'fastest-levenshtein';

function matchDisparador( doc: any, question: string ): boolean {
  const queryLower = question.toLowerCase();
  const disparadoras = doc.metadata?.disparadoras || [];

  for ( const frase of disparadoras ) {
    const fraseLimpia = frase.trim().toLowerCase();

    const dist = distance( queryLower, fraseLimpia );
    const maxLen = Math.max( queryLower.length, fraseLimpia.length );
    const porcentaje = dist / maxLen;

    if ( porcentaje < 0.45 ) {
      console.log( `✅ RETURNING TRUE: "${ fraseLimpia }" (dist: ${ dist }, %: ${ porcentaje.toFixed( 2 ) })` );
      return true;
    }
  }

  return false;
}

function mapSeccionToArchivo( seccion ) {
  return {
    curso_online_vivo: '1_curso_trading_online_vivo.txt',
    curso_online_grabado: '2_curso_trading_online_grabado.txt',
    formacion_miami: '4_curso_trading_miami.txt',
    formacion_santiago: '5_curso_trading_santiago.txt',
    soy_alumno: '3_alumnos.txt',
    soporte_general: '9_soporte_general.txt',
  }[ seccion ];
}
const archivoPorSeccion = {
  curso_online_vivo: '1_curso_trading_online_vivo.txt',
  curso_online_grabado: '2_curso_trading_online_grabado.txt',
  formacion_miami: '4_curso_trading_miami.txt',
  formacion_santiago: '5_curso_trading_santiago.txt',
  soy_alumno: '3_alumnos.txt',
  soporte_general: '9_soporte_general.txt',
};
function mapArchivoToSeccion( archivo: string ): string | null {
  for ( const [ seccion, nombreArchivo ] of Object.entries( archivoPorSeccion ) ) {
    if ( nombreArchivo === archivo ) return seccion;
  }
  return null;
}


export const askSofiaFallback = async ( question: string, esAlumno: boolean = false ) => {

  const query = preprocessPregunta( question );

  const model = new ChatOpenAI( {
    modelName: process.env.MODELO_SOFIA || "gpt-3.5-turbo", // o "gpt-3.5-turbo"
    temperature: 0.3,   // ajusta si lo deseas
    openAIApiKey: process.env.OPENAI_API_KEY!,
  } );

  const index = pinecone.Index( process.env.PINECONE_INDEX_NAME! );

  const vectorStore = await PineconeStore.fromExistingIndex( new OpenAIEmbeddings(), {
    pineconeIndex: index,
    textKey: 'text',
  } );

  // Construir filtro por sección (si existe)
  const filters: any = {};

  filters.es_fallback = true;
  console.log( { filters } );

  //  const retrievedDocs = await vectorStore.similaritySearchWithScore( query, 10, filters );
  const resultados = await vectorStore.similaritySearchWithScore( query, 5, filters );

  const retrievedDocs = resultados.map( ( [ doc ] ) => doc );

  console.log( '📥 Documentos recuperados por Pinecone fallback:' );
  resultados.forEach( ( [ doc, score ], i ) => {
    console.log( `\n#${ i + 1 }` );
    console.log( 'Archivo:', doc.metadata?.archivo );
    console.log( 'Chunk:', doc.metadata?.chunk );
    console.log( 'Tipo:', doc.metadata?.tipo );
    console.log( 'Score:', score.toFixed( 4 ) );
  } );

  const coincidenciasFallback = retrievedDocs.filter( doc =>
    doc.metadata?.es_fallback === true &&
    matchDisparador( doc, query )
  );


  // Determinamos la mejor respuesta disponible según prioridad
  let respuestaFija = coincidenciasFallback[ 0 ];


  // Si no hay match pero el top 1 es respuesta_fija, devolvemos esa como fallback de último recurso
  if ( !respuestaFija && retrievedDocs.length > 0 && retrievedDocs[ 0 ].metadata?.tipo === 'respuesta_fija' ) {
    respuestaFija = retrievedDocs[ 0 ];
  }
  console.log( '\n✅ Respuesta fallback seleccionada:', respuestaFija?.metadata?.chunk || 'Ninguna' );



  if ( respuestaFija ) {
    const full = respuestaFija.pageContent;
    const match = full.match( /👉[^\n]*\n+([\s\S]*)/ );
    const onlyAnswer = match?.[ 1 ]?.trim() || full;

    console.log( `🤖 Sofía (respuesta fija)` );
    //    return onlyAnswer;
    return {
      texto: onlyAnswer,
      origen: mapArchivoToSeccion( respuestaFija.metadata?.archivo ) || null,
      tags: respuestaFija.metadata?.tags || [],
      chunkId: respuestaFija.metadata?.chunk || null
    };


  } else {
    // 🧠 Caso contrario, usamos Gemini con prompt personalizado
    const context = retrievedDocs.map( doc => doc.pageContent ).join( '\n\n' );

    const prompt = new PromptTemplate( {
      inputVariables: [ 'context', 'query' ],
      template: `
Eres Sofía, una asistente de soporte entrenada con información específica de los cursos de Fran Fialli.

⚠️ Si alguno de los fragmentos incluye instrucciones como "Responder exactamente con el siguiente bloque de texto",
debes copiar y pegar dicho contenido literalmente. No lo modifiques ni lo resumas. Respeta emojis, negritas, formato y espacios.

Usa exclusivamente el siguiente contexto para responder la pregunta:

---------------------
{context}
---------------------

Pregunta: {query}
Respuesta:
    `
    } );

    const finalPrompt = await prompt.format( { context, query } );
    const response = await model.invoke( finalPrompt );

    console.log( `Gemini responde` );

    return {
      texto: typeof response === 'string' ? response : ( response.text || '' ),
      origen: null,
      tags: [],
      chunkId: null
    };

  }



};


