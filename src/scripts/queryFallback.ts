import 'dotenv/config';
import { OpenAIEmbeddings, ChatOpenAI } from '@langchain/openai';
import { PineconeStore } from '@langchain/pinecone';
import { pinecone } from '../lib/pinecone/connect';
import { PromptTemplate } from '@langchain/core/prompts';
import { Document } from "langchain/document";
import { preprocessPregunta } from '../lib/utils/preprocessinText';

import { distance } from 'fastest-levenshtein';

interface SofiaMetadata {
  archivo: string;
  chunk: string;
  disparadoras?: string[];
  es_fallback?: boolean;
  tags?: string[];
  tipo: 'respuesta_fija' | 'respuesta_libre';
  text?: string;
}

type SofiaDocument = Document<SofiaMetadata>;

function matchDisparador( doc: any, question: string ): boolean {

  const STOPWORDS = new Set( [
    'de', 'la', 'que', 'el', 'en', 'y', 'a', 'los', 'del', 'se', 'las',
    'por', 'un', 'para', 'con', 'no', 'una', 'su', 'al', 'lo', 'como',
    'más', 'pero', 'sus', 'le', 'ya', 'o', 'este', 'sí', 'porque', 'esta',
    'entre', 'cuando', 'muy', 'sin', 'sobre', 'también', 'me', 'hasta',
    'hay', 'donde', 'quien', 'desde', 'todo', 'nos', 'durante', 'todos',
    'uno', 'les', 'ni', 'contra', 'otros', 'ese', 'eso', 'ante', 'ellos',
    'e', 'esto', 'mí', 'antes', 'algunos', 'qué', 'unos', 'yo', 'otro',
    'otras', 'otra', 'él', 'tanto', 'esa', 'estos', 'mucho', 'quienes',
    'nada', 'muchos', 'cual', 'poco', 'ella', 'estar', 'estas', 'algunas',
    'algo', 'nosotros', 'mi', 'mis', 'tú', 'te', 'ti', 'tu', 'tus', 'ellas', 'puedo', 'leer'
  ] );

  const queryLower = preprocessPregunta( question );
  const palabrasQuery = queryLower.split( /\s+/ ).filter( p => !STOPWORDS.has( p ) );

  const disparadoras: string[] = doc.metadata?.disparadoras || [];
  const tags: string[] = ( doc.metadata?.tags || [] ).map( ( t: string ) => t.toLowerCase() );
  const chunkId = doc.metadata?.chunk || 'unknown';

  // ✅ [1] Match exacto con tag
  if ( tags.includes( queryLower ) ) {
    console.log( `✅ [TAG-EXACT] Match exacto con tag "${ queryLower }" en chunk ${ chunkId }` );
    return true;
  }

  // ✅ [2] Coincidencia palabra a palabra con tags
  for ( const palabra of palabrasQuery ) {
    if ( tags.includes( palabra ) ) {
      console.log( `✅ [TAG-WORD] Palabra "${ palabra }" coincide con tag en chunk ${ chunkId }` );
      return true;
    }

    // ✅ [3] Fuzzy match palabra con tags
    // const threshold = 0.55; 
    // const palabrasIrrelevantes = new Set( [
    //   "resultados", "descansos", "horarios", "detalles" // Agrega otras palabras irrelevantes que no deberían considerarse
    // ] );

    // for ( const tag of tags ) {

    //   if ( palabrasIrrelevantes.has( tag ) ) {
    //     continue; // Si es irrelevante, pasamos al siguiente tag
    //   }

    //   const dist = distance( palabra, tag );
    //   const maxLen = Math.max( palabra.length, tag.length );
    //   const porcentaje = dist / maxLen;

    //   if ( porcentaje < threshold ) {
    //     console.log( `✅ [TAG-FUZZY] Palabra "${ palabra }" ≈ tag "${ tag }" (dist: ${ dist }, %: ${ porcentaje.toFixed( 2 ) }) en chunk ${ chunkId }` );
    //     return true;
    //   }
    // }
  }

  // ✅ [4] Coincidencia con frases disparadoras
  for ( const frase of disparadoras ) {
    const fraseLimpia = preprocessPregunta( frase ).toLowerCase();
    const queryLimpia = queryLower;

    const palabrasFras = fraseLimpia.split( /\s+/ ).filter( p => !STOPWORDS.has( p ) );
    const palabrasQuery = queryLimpia.split( /\s+/ ).filter( p => !STOPWORDS.has( p ) );

    const fraseSinStop = palabrasFras.join( ' ' );
    const querySinStop = palabrasQuery.join( ' ' );

    // a) Inclusión mutua sin stopwords
    if (
      fraseSinStop.length > 0 &&
      querySinStop.length > 0 &&
      ( fraseSinStop.includes( querySinStop ) || querySinStop.includes( fraseSinStop ) )
    ) {
      console.log( `✅ [DISPARADORA-INCLUYE] "${ querySinStop }" ≈ "${ fraseSinStop }" en chunk ${ chunkId }` );
      return true;
    }

    // b) Fuzzy completo
    // const dist = distance( queryLower, fraseLimpia );
    // const maxLen = Math.max( queryLower.length, fraseLimpia.length );
    // const porcentaje = dist / maxLen;
    // const threshold = 0.5; 

    // if ( porcentaje < 0.5 ) {
    //   console.log( `✅ [DISPARADORA-LEV] "${ fraseLimpia }" (dist: ${ dist }, %: ${ porcentaje.toFixed( 2 ) }) en chunk ${ chunkId }` );
    //   return true;
    // }

    // c) Coincidencia por palabras clave
    const palabrasFrase = fraseLimpia.split( /\s+/ ).filter( p => !STOPWORDS.has( p ) );

    const comunes = palabrasFrase
      .filter( p => p !== "curso" && palabrasQuery.includes( p ) );
    if ( comunes.length >= 2 ) {
      console.log( `✅ [DISPARADORA-PALABRAS] Palabras comunes: ${ comunes.join( ', ' ) } en chunk ${ chunkId }` );
      return true;
    }
  }

  console.log( `❌ No match en chunk ${ chunkId }` );
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

  const retrievedDocs = resultados
    .filter( ( [ doc ] ) => doc.metadata?.es_fallback === true &&
      matchDisparador( doc, query ) )
    .map( ( [ doc, score ] ) => {
      doc;
      return [ doc, score ] as [ SofiaDocument, number ];
    } );



  // const coincidenciasFallback = retrievedDocs.filter( doc =>
  //   doc.metadata?.es_fallback === true &&
  //   matchDisparador( doc, query )
  // );


  // Determinamos la mejor respuesta disponible según prioridad

  if ( retrievedDocs.length > 0 ) {
    return await responderConResultados( retrievedDocs, query, "" );
  }

  console.log( 'buscar en global' );

  const filtrosGlobales = {
    archivo: { $in: [ '9_soporte_general.txt', '8_flujos_recursos_web.txt' ] }
  };

  const resultadosOtros = await vectorStore.similaritySearchWithScore( query, 10, filtrosGlobales ) as [ SofiaDocument, number ][];


  const relevantesPermitidos = resultadosOtros.map( ( [ doc, score ] ) => {
    const archivo = doc.metadata.archivo;

    const tags = ( doc.metadata?.tags || [] ).map( ( t: string ) => t.toLowerCase() );
    return [ doc, score ] as [ SofiaDocument, number ];
  } ).filter( ( [ doc ] ) => matchDisparador( doc, query ) );

  return await responderConResultados( relevantesPermitidos, query, "" );

};


const responderConResultados = async (
  resultados: [ SofiaDocument, number ][],
  query: string,
  archivoContexto: string
) => {

  //  const coincidenciasFijas = resultados.filter( ( [ doc ] ) => doc.metadata.tipo === 'respuesta_fija' && !doc.metadata.es_fallback );
  const coincidenciasFijas = resultados
    .filter( ( [ doc ] ) => doc.metadata.tipo === 'respuesta_fija' && !doc.metadata.es_fallback )
    .sort( ( a, b ) => b[ 1 ] - a[ 1 ] );
  const coincidenciasFallback = resultados.filter( ( [ doc ] ) => doc.metadata.tipo === 'respuesta_fija' && doc.metadata.es_fallback );
  const coincidenciasLibres = resultados.filter( ( [ doc ] ) => doc.metadata.tipo === 'respuesta_libre' );

  const mejor =
    coincidenciasFijas[ 0 ]?.[ 0 ] ||
    coincidenciasFallback[ 0 ]?.[ 0 ] ||
    coincidenciasLibres[ 0 ]?.[ 0 ];

  if ( mejor ) {
    const match = mejor.pageContent.match( /👉[^\n]*\n+([\s\S]*)/ );
    const onlyAnswer = match?.[ 1 ]?.trim() || mejor.pageContent;

    return {
      texto: onlyAnswer,
      origen: '',
      tags: mejor.metadata.tags || [],
      chunkId: mejor.metadata.chunk || null
    };
  }

  // Si no hay nada, usar modelo generativo con contexto
  const context = resultados.map( ( [ doc ] ) => doc.pageContent ).join( "\n\n" );

  const prompt = new PromptTemplate( {
    inputVariables: [ "context", "query" ],
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
  const response = await new ChatOpenAI( { modelName: process.env.MODELO_SOFIA, temperature: 0.3, openAIApiKey: process.env.OPENAI_API_KEY! } ).invoke( finalPrompt );

  console.log( "gemini responde fallback" );

  return {
    texto: typeof response === "string" ? response : ( response.text || "" ),
    origen: '',
    tags: [],
    chunkId: null
  };
};