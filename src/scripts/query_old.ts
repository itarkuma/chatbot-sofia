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
  const queryLower = preprocessPregunta( question );
  const palabrasQuery = queryLower.split( /\s+/ ); // palabras individuales

  const disparadoras = doc.metadata?.disparadoras || [];
  const tags = ( doc.metadata?.tags || [] ).map( ( t: string ) => t.toLowerCase() );

  const chunkId = doc.metadata?.chunk || 'unknown';

  // ✅ Match directo por inclusión exacta en tags
  if ( tags.includes( queryLower ) ) {
    console.log( `✅ [TAG-EXACT] Match exacto con tag "${ queryLower }" en chunk ${ chunkId }` );
    return true;
  }

  // ✅ Match si alguna palabra de la query coincide con un tag (genérico)
  for ( const palabra of palabrasQuery ) {
    if ( tags.includes( palabra ) ) {
      console.log( `✅ [TAG-WORD] Palabra "${ palabra }" coincide con tag en chunk ${ chunkId }` );
      return true;
    }

    for ( const tag of tags ) {
      const dist = distance( palabra, tag );
      const maxLen = Math.max( palabra.length, tag.length );
      const porcentaje = dist / maxLen;

      if ( porcentaje < 0.35 ) {
        console.log( `✅ [TAG-FUZZY] Palabra "${ palabra }" ≈ tag "${ tag }" (dist: ${ dist }, %: ${ porcentaje.toFixed( 2 ) }) en chunk ${ chunkId }` );
        return true;
      }
    }
  }

  // ✅ Fallback: disparadoras existentes
  for ( const frase of disparadoras ) {
    const fraseLimpia = preprocessPregunta( frase );

    if ( fraseLimpia.includes( queryLower ) || queryLower.includes( fraseLimpia ) ) {
      console.log( `✅ [DISPARADORA-INCLUYE] "${ queryLower }" ≈ "${ fraseLimpia }" en chunk ${ chunkId }` );
      return true;
    }

    const dist = distance( queryLower, fraseLimpia );
    const maxLen = Math.max( queryLower.length, fraseLimpia.length );
    const porcentaje = dist / maxLen;

    if ( porcentaje < 0.45 ) {
      console.log( `✅ [DISPARADORA-LEV] "${ fraseLimpia }" (dist: ${ dist }, %: ${ porcentaje.toFixed( 2 ) }) en chunk ${ chunkId }` );
      return true;
    }
  }

  console.log( `❌ No match en chunk ${ chunkId }` );
  return false;
}


const detectarCambioDeContexto = ( q: string ): string | null => {
  const query = preprocessPregunta( q );
  if ( query.includes( "miami" ) ) return "4_curso_trading_miami.txt";
  if ( query.includes( "santiago" ) ) return "5_curso_trading_santiago.txt";
  if ( query.includes( "grabado" ) ) return "2_curso_trading_online_grabado.txt";
  if ( query.includes( "en vivo" ) || query.includes( "zoom" ) || query.includes( "clases" ) ) return "1_curso_trading_online_vivo.txt";
  return null;
};


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


export const askSofia = async ( question: string, seccion: string, esAlumno: boolean = false ) => {
  const query = preprocessPregunta( question );

  const model = new ChatOpenAI( {
    modelName: process.env.MODELO_SOFIA || "gpt-3.5-turbo",
    temperature: 0.3,
    openAIApiKey: process.env.OPENAI_API_KEY!,
  } );
  const index = pinecone.Index( process.env.PINECONE_INDEX_NAME! );
  const vectorStore = await PineconeStore.fromExistingIndex( new OpenAIEmbeddings(), {
    pineconeIndex: index,
    textKey: 'text',
  } );

  // Detectar cambio de flujo si se menciona otro curso o sección
  const detectarCambioDeFlujo = ( query: string, seccionActual: string ): string | null => {
    const mapeo: Record<string, string[]> = {
      'curso_online_grabado': [ 'curso grabado', 'módulos grabados', 'modulos grabados', 'curso online grabado', 'online grabado' ],
      'curso_online_vivo': [ 'en vivo', 'en zoom', 'clases por Zoom', 'por Zoom', 'curso en vivo', 'en directo', 'en tiempo real', 'tiempo real' ],
      'curso_miami': [ 'curso en miami', 'en miami' ],
      'curso_santiago': [ 'curso en santiago', 'curso en Santiago de Compostela', 'Santiago de Compostela', 'Santiago Compostela' ],
      'soporte_general': [ 'soporte', 'ayuda', 'asistencia' ],
    };

    const normalizada = preprocessPregunta( query ).toLowerCase().normalize( 'NFD' ).replace( /[̀-ͯ]/g, '' );

    for ( const [ seccionKey, keywords ] of Object.entries( mapeo ) ) {
      if ( seccionKey !== seccionActual && keywords.some( k => normalizada.includes( k ) ) ) {
        return seccionKey;
      }
    }
    return null;
  };


  const cambio = detectarCambioDeFlujo( query, seccion );
  if ( cambio ) {
    console.log( `⚠️ Cambio de flujo detectado: ${ seccion } -> ${ cambio }` );
    seccion = cambio;
  }

  const filters: any = {};
  if ( seccion ) {
    filters.archivo = mapSeccionToArchivo( seccion );
  }

  if ( esAlumno ) {
    filters.archivo = filters.archivo
      ? { $and: [ filters.archivo, { $ne: '3_alumnos.txt' } ] }
      : { $ne: '3_alumnos.txt' };
  }

  const archivoActual = mapSeccionToArchivo( seccion );
  const filtersActual: any = { archivo: archivoActual };

  //  const resultadosActuales: [ SofiaDocument, number ][] = await vectorStore.similaritySearchWithScore( query, 10, filtersActual );
  const resultadosActuales = await vectorStore.similaritySearchWithScore( query, 10, filters ) as [ SofiaDocument, number ][];

  const relevantesActuales = resultadosActuales.filter( ( [ doc ] ) => matchDisparador( doc, query ) );

  const nuevoContextoDetectado = detectarCambioDeContexto( query ); // string | null
  console.log( { nuevoContextoDetectado } );

  if ( relevantesActuales.length > 0 ) {
    return await responderConResultados( relevantesActuales, query, archivoActual );
  }

  // Buscar en otras secciones
  const filtrosGlobales = {
    archivo: {
      $in: [
        '1_curso_trading_online_vivo.txt',
        '2_curso_trading_online_grabado.txt',
        '4_curso_trading_miami.txt',
        '5_curso_trading_santiago.txt',
        '9_soporte_general.txt',
      ]
    }
  };
  //  const resultadosOtros: [ SofiaDocument, number ][] = await vectorStore.similaritySearchWithScore( query, 10, filtrosGlobales );
  const resultadosOtros = await vectorStore.similaritySearchWithScore( query, 10, filtrosGlobales ) as [ SofiaDocument, number ][];



  const relevantesPermitidos = resultadosOtros.filter( ( [ doc ] ) => {
    const archivo = doc.metadata.archivo;
    const esFallback = doc.metadata.es_fallback;
    const coincideContexto = archivo === nuevoContextoDetectado;
    return esFallback || coincideContexto;
  } ).filter( ( [ doc ] ) => matchDisparador( doc, query ) );

  return await responderConResultados( relevantesPermitidos, query, nuevoContextoDetectado || archivoActual );
};

const responderConResultados = async (
  resultados: [ SofiaDocument, number ][],
  query: string,
  archivoContexto: string
) => {
  let i = 0;
  for ( const [ doc, number ] of resultados ) {
    console.log( '📥 Documentos recuperados por Pinecone:' );
    console.log( `\n#${ i + 1 }` );
    console.log( 'Archivo:', doc.metadata?.archivo );
    console.log( 'Chunk:', doc.metadata?.chunk );
    console.log( 'Tipo:', doc.metadata?.tipo );
    console.log( 'Score:', number.toFixed( 4 ) );
    i++;
  }
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
      origen: mapArchivoToSeccion( mejor.metadata.archivo ),
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
  const response = await new ChatOpenAI( { modelName: process.env.MODELO_SOFIA, temperature: 0.3 } ).invoke( finalPrompt );

  return {
    texto: typeof response === "string" ? response : ( response.text || "" ),
    origen: mapArchivoToSeccion( archivoContexto ),
    tags: [],
    chunkId: null
  };
};

