import 'dotenv/config';
import { OpenAIEmbeddings, ChatOpenAI } from '@langchain/openai';
import { PineconeStore } from '@langchain/pinecone';
import { pinecone } from '../lib/pinecone/connect';
import { PromptTemplate } from '@langchain/core/prompts';
import { Document } from "langchain/document";
import { preprocessPregunta } from '../lib/utils/preprocessinText';

import { esComparacionGrabadoVsVivo } from '../lib/utils/esComparacionGrabadoVsVivo';
import { distance } from 'fastest-levenshtein';
import { esPrecioRelacion } from '../lib/utils/esPrecioRelacion';

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


export const askSofia = async ( question: string, seccion: string, ask_menu: string = '', esAlumno: boolean = false ) => {


  const index = pinecone.Index( process.env.PINECONE_INDEX_NAME! );
  const vectorStore = await PineconeStore.fromExistingIndex( new OpenAIEmbeddings(), {
    pineconeIndex: index,
    textKey: 'text',
  } );

  const query = preprocessPregunta( question );
  const palabrasQuery = query.split( /\s+/ );

  // Detectar cambio de flujo si se menciona otro curso o sección
  const detectarCambioDeFlujo = ( query: string, seccionActual: string ): string | null => {

    const normalizada = preprocessPregunta( query );

    if ( esComparacionGrabadoVsVivo( normalizada ) ) { return null; }

    const mapeo: Record<string, string[]> = {
      'curso_online_grabado': [ 'curso grabado', 'módulos grabados', 'modulos grabados', 'curso online grabado', 'online grabado' ],
      'curso_online_vivo': [ 'en vivo', 'en zoom', 'clases por Zoom', 'por Zoom', 'curso en vivo', 'en directo', 'en tiempo real', 'tiempo real' ],
      'formacion_miami': [ 'curso en miami', 'en miami', 'curso miami', 'curso de miami' ],
      'formacion_santiago': [ 'curso santiago', 'curso en santiago', 'curso de santiago', 'curso en Santiago de Compostela', 'Santiago de Compostela', 'Santiago Compostela' ],
      'soporte_general': [ 'soporte', 'ayuda', 'asistencia' ],
    };


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



  if ( ask_menu === 'user_question_multiples' ) {
    const archivoActual = 'fallbacks.txt';
    const filters = {
      archivo: 'fallbacks.txt',
      chunk: 'chunk_11'
    };

    const resultados = await vectorStore.similaritySearchWithScore(
      query,
      1, // solo queremos uno
      filters
    ) as [ SofiaDocument, number ][];

    if ( resultados.length > 0 ) {
      return await responderConResultadosFijo( resultados, query, archivoActual );
    }
  }

  if ( ask_menu === 'user_javiernoresponde' ) {
    const archivoActual = 'fallbacks.txt';
    const filters = {
      archivo: 'fallbacks.txt',
      chunk: 'chunk_10'
    };

    const resultados = await vectorStore.similaritySearchWithScore(
      query,
      1, // solo queremos uno
      filters
    ) as [ SofiaDocument, number ][];

    if ( resultados.length > 0 ) {
      return await responderConResultadosFijo( resultados, query, archivoActual );
    }
  }

  if ( ask_menu === 'user_derivarjavier' ) {
    const archivoActual = 'fallbacks.txt';
    const filters = {
      archivo: 'fallbacks.txt',
      chunk: 'chunk_09'
    };

    const resultados = await vectorStore.similaritySearchWithScore(
      query,
      1, // solo queremos uno
      filters
    ) as [ SofiaDocument, number ][];

    if ( resultados.length > 0 ) {
      return await responderConResultadosFijo( resultados, query, archivoActual );
    }
  }

  if ( ask_menu === 'user_otrasciudades' ) {
    const archivoActual = 'fallbacks.txt';
    const filters = {
      archivo: 'fallbacks.txt',
      chunk: 'chunk_08'
    };

    const resultados = await vectorStore.similaritySearchWithScore(
      query,
      1, // solo queremos uno
      filters
    ) as [ SofiaDocument, number ][];

    if ( resultados.length > 0 ) {
      return await responderConResultadosFijo( resultados, query, archivoActual );
    }
  }

  if ( ask_menu === 'user_formasdepago' ) {
    const archivoActual = 'fallbacks.txt';
    const filters = {
      archivo: 'fallbacks.txt',
      chunk: 'chunk_07'
    };

    const resultados = await vectorStore.similaritySearchWithScore(
      query,
      1, // solo queremos uno
      filters
    ) as [ SofiaDocument, number ][];

    if ( resultados.length > 0 ) {
      return await responderConResultadosFijo( resultados, query, archivoActual );
    }
  }

  if ( ask_menu === 'user_promocion' ) {
    const archivoActual = 'fallbacks.txt';
    const filters = {
      archivo: 'fallbacks.txt',
      chunk: 'chunk_06'
    };

    const resultados = await vectorStore.similaritySearchWithScore(
      query,
      1, // solo queremos uno
      filters
    ) as [ SofiaDocument, number ][];

    if ( resultados.length > 0 ) {
      return await responderConResultadosFijo( resultados, query, archivoActual );
    }
  }

  if ( ask_menu === 'user_dato_nodisponible' ) {
    const archivoActual = 'fallbacks.txt';
    const filters = {
      archivo: 'fallbacks.txt',
      chunk: 'chunk_05'
    };

    const resultados = await vectorStore.similaritySearchWithScore(
      query,
      1, // solo queremos uno
      filters
    ) as [ SofiaDocument, number ][];

    if ( resultados.length > 0 ) {
      return await responderConResultadosFijo( resultados, query, archivoActual );
    }
  }

  if ( ask_menu === 'esta_confuso_1' ) {
    const archivoActual = 'fallbacks.txt';
    const filters = {
      archivo: 'fallbacks.txt',
      chunk: 'chunk_01'
    };

    const resultados = await vectorStore.similaritySearchWithScore(
      query,
      1, // solo queremos uno
      filters
    ) as [ SofiaDocument, number ][];

    if ( resultados.length > 0 ) {
      return await responderConResultadosFijo( resultados, query, archivoActual );
    }
  }

  if ( ask_menu === 'esta_confuso_2' ) {
    const archivoActual = 'fallbacks.txt';
    const filters = {
      archivo: 'fallbacks.txt',
      chunk: 'chunk_02'
    };

    const resultados = await vectorStore.similaritySearchWithScore(
      query,
      1, // solo queremos uno
      filters
    ) as [ SofiaDocument, number ][];

    if ( resultados.length > 0 ) {
      return await responderConResultadosFijo( resultados, query, archivoActual );
    }
  }

  if ( ask_menu === 'menu' ) {

    const archivoActual = 'fallbacks.txt';
    const filters = {
      archivo: 'fallbacks.txt',
      chunk: 'chunk_04'
    };

    const resultados = await vectorStore.similaritySearchWithScore(
      query,
      1, // solo queremos uno
      filters
    ) as [ SofiaDocument, number ][];

    if ( resultados.length > 0 ) {
      return await responderConResultadosFijo( resultados, query, archivoActual );
    }

  }

  if ( ask_menu === 'saludo' ) {

    const archivoActual = '9_soporte_general.txt';
    const filters = {
      archivo: '9_soporte_general.txt',
      chunk: 'chunk_01'
    };

    const resultados = await vectorStore.similaritySearchWithScore(
      query,
      1, // solo queremos uno
      filters
    ) as [ SofiaDocument, number ][];

    if ( resultados.length > 0 ) {
      return await responderConResultadosFijo( resultados, query, archivoActual );
    }

  }

  if ( ask_menu === 'curso_online_grabado' ) {

    const archivoActual = '2_curso_trading_online_grabado.txt';
    const filters = {
      archivo: '2_curso_trading_online_grabado.txt',
      chunk: 'chunk_01'
    };

    const resultados = await vectorStore.similaritySearchWithScore(
      query,
      1, // solo queremos uno
      filters
    ) as [ SofiaDocument, number ][];

    if ( resultados.length > 0 ) {
      return await responderConResultadosFijo( resultados, query, archivoActual );
    }

  }

  if ( seccion === 'curso_online_grabado' && /resumen/.test( preprocessPregunta( query ) ) ) {

    const archivoActual = '2_curso_trading_online_grabado.txt';
    const filters = {
      archivo: '2_curso_trading_online_grabado.txt',
      chunk: 'chunk_04'
    };

    const resultados = await vectorStore.similaritySearchWithScore(
      query,
      1, // solo queremos uno
      filters
    ) as [ SofiaDocument, number ][];

    if ( resultados.length > 0 ) {
      return await responderConResultadosFijo( resultados, query, archivoActual );
    }

  }

  if ( seccion === 'curso_online_grabado' && /temario completo/.test( preprocessPregunta( query ) ) ) {

    const archivoActual = '2_curso_trading_online_grabado.txt';
    const filters = {
      archivo: '2_curso_trading_online_grabado.txt',
      chunk: 'chunk_08'
    };

    const resultados = await vectorStore.similaritySearchWithScore(
      query,
      1, // solo queremos uno
      filters
    ) as [ SofiaDocument, number ][];

    if ( resultados.length > 0 ) {
      return await responderConResultadosFijo( resultados, query, archivoActual );
    }

  }
  const esConsultaIndicadoresg = /\bindicadores(?:\s+(t[eé]cnicos?|que\s+enseñan|enseñan|de trading))?|\benseñan\s+indicadores\b/i.test( preprocessPregunta( query ) );

  if ( seccion === 'curso_online_grabado' && esConsultaIndicadoresg ) {

    const archivoActual = '2_curso_trading_online_grabado.txt';
    const filters = {
      archivo: '2_curso_trading_online_grabado.txt',
      chunk: 'indicadores'
    };

    const resultados = await vectorStore.similaritySearchWithScore(
      query,
      1, // solo queremos uno
      filters
    ) as [ SofiaDocument, number ][];

    if ( resultados.length > 0 ) {
      return await responderConResultadosFijo( resultados, query, archivoActual );
    }

  }
  if ( seccion === 'curso_online_grabado' && /(m[eé]todos?|forma[s]?) de pago[s]?/.test( preprocessPregunta( query ) ) ) {

    const archivoActual = '2_curso_trading_online_grabado.txt';
    const filters = {
      archivo: '2_curso_trading_online_grabado.txt',
      chunk: 'metodo_pago'
    };

    const resultados = await vectorStore.similaritySearchWithScore(
      query,
      1, // solo queremos uno
      filters
    ) as [ SofiaDocument, number ][];

    if ( resultados.length > 0 ) {
      return await responderConResultadosFijo( resultados, query, archivoActual );
    }

  }

  if ( seccion === 'curso_online_grabado' && /plataforma de trading/.test( preprocessPregunta( query ) ) ) {

    const archivoActual = '2_curso_trading_online_grabado.txt';
    const filters = {
      archivo: '2_curso_trading_online_grabado.txt',
      chunk: 'plataforma_trading'
    };

    const resultados = await vectorStore.similaritySearchWithScore(
      query,
      1, // solo queremos uno
      filters
    ) as [ SofiaDocument, number ][];

    if ( resultados.length > 0 ) {
      return await responderConResultadosFijo( resultados, query, archivoActual );
    }

  }


  if ( seccion === 'curso_online_grabado' && esPrecioRelacion( query ) ) {

    const archivoActual = '2_curso_trading_online_grabado.txt';
    const filters = {
      archivo: '2_curso_trading_online_grabado.txt',
      chunk: 'chunk_24'
    };

    const resultados = await vectorStore.similaritySearchWithScore(
      query,
      1, // solo queremos uno
      filters
    ) as [ SofiaDocument, number ][];

    if ( resultados.length > 0 ) {
      return await responderConResultadosFijo( resultados, query, archivoActual );
    }

  }

  if ( ask_menu === 'curso_online_vivo' ) {

    const archivoActual = '1_curso_trading_online_vivo.txt';
    const filters = {
      archivo: '1_curso_trading_online_vivo.txt',
      chunk: 'chunk_01'
    };

    const resultados = await vectorStore.similaritySearchWithScore(
      query,
      1, // solo queremos uno
      filters
    ) as [ SofiaDocument, number ][];

    if ( resultados.length > 0 ) {
      return await responderConResultadosFijo( resultados, query, archivoActual );
    }

  }

  if ( seccion === 'curso_online_vivo' && esPrecioRelacion( query ) ) {

    const archivoActual = '1_curso_trading_online_vivo.txt';
    const filters = {
      archivo: '1_curso_trading_online_vivo.txt',
      chunk: 'chunk_11'
    };

    const resultados = await vectorStore.similaritySearchWithScore(
      query,
      1, // solo queremos uno
      filters
    ) as [ SofiaDocument, number ][];

    if ( resultados.length > 0 ) {
      return await responderConResultadosFijo( resultados, query, archivoActual );
    }

  }

  if ( seccion === 'curso_online_vivo' && /resumen/.test( preprocessPregunta( query ) ) ) {

    const archivoActual = '1_curso_trading_online_vivo.txt';
    const filters = {
      archivo: '1_curso_trading_online_vivo.txt',
      chunk: 'chunk_02'
    };

    const resultados = await vectorStore.similaritySearchWithScore(
      query,
      1, // solo queremos uno
      filters
    ) as [ SofiaDocument, number ][];

    if ( resultados.length > 0 ) {
      return await responderConResultadosFijo( resultados, query, archivoActual );
    }

  }

  if ( seccion === 'curso_online_vivo' && /temario completo/.test( preprocessPregunta( query ) ) ) {

    const archivoActual = '1_curso_trading_online_vivo.txt';
    const filters = {
      archivo: '1_curso_trading_online_vivo.txt',
      chunk: 'chunk_20'
    };

    const resultados = await vectorStore.similaritySearchWithScore(
      query,
      1, // solo queremos uno
      filters
    ) as [ SofiaDocument, number ][];

    if ( resultados.length > 0 ) {
      return await responderConResultadosFijo( resultados, query, archivoActual );
    }

  }

  const esConsultaIndicadores = /\bindicadores(?:\s+(t[eé]cnicos?|que\s+enseñan|enseñan|de trading))?|\benseñan\s+indicadores\b/i.test( preprocessPregunta( query ) );

  if ( seccion === 'curso_online_vivo' && esConsultaIndicadores ) {

    const archivoActual = '1_curso_trading_online_vivo.txt';
    const filters = {
      archivo: '1_curso_trading_online_vivo.txt',
      chunk: 'indicadores'
    };

    const resultados = await vectorStore.similaritySearchWithScore(
      query,
      1, // solo queremos uno
      filters
    ) as [ SofiaDocument, number ][];

    if ( resultados.length > 0 ) {
      return await responderConResultadosFijo( resultados, query, archivoActual );
    }

  }
  if ( seccion === 'curso_online_vivo' && /(m[eé]todos?|forma[s]?) de pago[s]?/.test( preprocessPregunta( query ) ) ) {

    const archivoActual = '1_curso_trading_online_vivo.txt';
    const filters = {
      archivo: '1_curso_trading_online_vivo.txt',
      chunk: 'metodo_pago'
    };

    const resultados = await vectorStore.similaritySearchWithScore(
      query,
      1, // solo queremos uno
      filters
    ) as [ SofiaDocument, number ][];

    if ( resultados.length > 0 ) {
      return await responderConResultadosFijo( resultados, query, archivoActual );
    }

  }

  if ( ask_menu === 'formacion_miami' ) {

    const archivoActual = '4_curso_trading_miami.txt';
    const filters = {
      archivo: '4_curso_trading_miami.txt',
      chunk: 'chunk_01'
    };

    const resultados = await vectorStore.similaritySearchWithScore(
      query,
      1, // solo queremos uno
      filters
    ) as [ SofiaDocument, number ][];

    if ( resultados.length > 0 ) {
      return await responderConResultadosFijo( resultados, query, archivoActual );
    }

  }

  if ( seccion === 'formacion_miami' && esPrecioRelacion( query ) ) {

    const archivoActual = '4_curso_trading_miami.txt';
    const filters = {
      archivo: '4_curso_trading_miami.txt',
      chunk: 'chunk_51'
    };

    const resultados = await vectorStore.similaritySearchWithScore(
      query,
      1, // solo queremos uno
      filters
    ) as [ SofiaDocument, number ][];

    if ( resultados.length > 0 ) {
      return await responderConResultadosFijo( resultados, query, archivoActual );
    }

  }

  if ( seccion === 'formacion_miami' && /resumen/.test( preprocessPregunta( query ) ) ) {

    const archivoActual = '4_curso_trading_miami.txt';
    const filters = {
      archivo: '4_curso_trading_miami.txt',
      chunk: 'chunk_02'
    };

    const resultados = await vectorStore.similaritySearchWithScore(
      query,
      1, // solo queremos uno
      filters
    ) as [ SofiaDocument, number ][];

    if ( resultados.length > 0 ) {
      return await responderConResultadosFijo( resultados, query, archivoActual );
    }

  }

  if ( seccion === 'formacion_miami' && /temario completo/.test( preprocessPregunta( query ) ) ) {

    const archivoActual = '4_curso_trading_miami.txt';
    const filters = {
      archivo: '4_curso_trading_miami.txt',
      chunk: 'chunk_42'
    };

    const resultados = await vectorStore.similaritySearchWithScore(
      query,
      1, // solo queremos uno
      filters
    ) as [ SofiaDocument, number ][];

    if ( resultados.length > 0 ) {
      return await responderConResultadosFijo( resultados, query, archivoActual );
    }

  }

  if ( ask_menu === 'formacion_santiago' ) {

    const archivoActual = '5_curso_trading_santiago.txt';
    const filters = {
      archivo: '5_curso_trading_santiago.txt',
      chunk: 'chunk_01'
    };

    const resultados = await vectorStore.similaritySearchWithScore(
      query,
      1, // solo queremos uno
      filters
    ) as [ SofiaDocument, number ][];

    if ( resultados.length > 0 ) {
      return await responderConResultadosFijo( resultados, query, archivoActual );
    }

  }

  if ( seccion === 'formacion_santiago' && esPrecioRelacion( query ) ) {

    const archivoActual = '5_curso_trading_santiago.txt';
    const filters = {
      archivo: '5_curso_trading_santiago.txt',
      chunk: 'chunk_50'
    };

    const resultados = await vectorStore.similaritySearchWithScore(
      query,
      1, // solo queremos uno
      filters
    ) as [ SofiaDocument, number ][];

    if ( resultados.length > 0 ) {
      return await responderConResultadosFijo( resultados, query, archivoActual );
    }

  }

  if ( seccion === 'formacion_santiago' && /resumen/.test( preprocessPregunta( query ) ) ) {

    const archivoActual = '5_curso_trading_santiago.txt';
    const filters = {
      archivo: '5_curso_trading_santiago.txt',
      chunk: 'chunk_02'
    };

    const resultados = await vectorStore.similaritySearchWithScore(
      query,
      1, // solo queremos uno
      filters
    ) as [ SofiaDocument, number ][];

    if ( resultados.length > 0 ) {
      return await responderConResultadosFijo( resultados, query, archivoActual );
    }

  }

  if ( seccion === 'formacion_santiago' && /temario completo/.test( preprocessPregunta( query ) ) ) {

    const archivoActual = '5_curso_trading_santiago.txt';
    const filters = {
      archivo: '5_curso_trading_santiago.txt',
      chunk: 'chunk_41'
    };

    const resultados = await vectorStore.similaritySearchWithScore(
      query,
      1, // solo queremos uno
      filters
    ) as [ SofiaDocument, number ][];

    if ( resultados.length > 0 ) {
      return await responderConResultadosFijo( resultados, query, archivoActual );
    }

  }

  if ( ask_menu === 'soy_alumno' ) {

    const archivoActual = '3_alumnos.txt';
    const filters = {
      archivo: '3_alumnos.txt',
      chunk: 'chunk_02'
    };

    const resultados = await vectorStore.similaritySearchWithScore(
      query,
      1, // solo queremos uno
      filters
    ) as [ SofiaDocument, number ][];

    if ( resultados.length > 0 ) {
      return await responderConResultadosFijo( resultados, query, archivoActual );
    }

  }

  if ( ask_menu === 'soy_alumno_miami' ) {

    const archivoActual = '3_alumnos.txt';
    const filters = {
      archivo: '3_alumnos.txt',
      chunk: 'chunk_09'
    };

    const resultados = await vectorStore.similaritySearchWithScore(
      query,
      1, // solo queremos uno
      filters
    ) as [ SofiaDocument, number ][];

    if ( resultados.length > 0 ) {
      return await responderConResultadosFijo( resultados, query, archivoActual );
    }

  }

  if ( ask_menu === 'soy_alumno_santiago' ) {

    const archivoActual = '3_alumnos.txt';
    const filters = {
      archivo: '3_alumnos.txt',
      chunk: 'chunk_10'
    };

    const resultados = await vectorStore.similaritySearchWithScore(
      query,
      1, // solo queremos uno
      filters
    ) as [ SofiaDocument, number ][];

    if ( resultados.length > 0 ) {
      return await responderConResultadosFijo( resultados, query, archivoActual );
    }

  }

  if ( ask_menu === 'soy_alumno_grabado' ) {

    const archivoActual = '3_alumnos.txt';
    const filters = {
      archivo: '3_alumnos.txt',
      chunk: 'chunk_11'
    };

    const resultados = await vectorStore.similaritySearchWithScore(
      query,
      1, // solo queremos uno
      filters
    ) as [ SofiaDocument, number ][];

    if ( resultados.length > 0 ) {
      return await responderConResultadosFijo( resultados, query, archivoActual );
    }

  }

  if ( ask_menu === 'curso_gratis' ) {

    const archivoActual = '8_flujos_recursos_web.txt';
    const filters = {
      archivo: '8_flujos_recursos_web.txt',
      chunk: 'chunk_12'
    };

    const resultados = await vectorStore.similaritySearchWithScore(
      query,
      1, // solo queremos uno
      filters
    ) as [ SofiaDocument, number ][];

    if ( resultados.length > 0 ) {
      return await responderConResultadosFijo( resultados, query, archivoActual );
    }

  }

  if ( ask_menu === 'libro_fran' ) {

    const archivoActual = '8_flujos_recursos_web.txt';
    const filters = {
      archivo: '8_flujos_recursos_web.txt',
      chunk: 'chunk_10'
    };

    const resultados = await vectorStore.similaritySearchWithScore(
      query,
      1, // solo queremos uno
      filters
    ) as [ SofiaDocument, number ][];

    if ( resultados.length > 0 ) {
      return await responderConResultadosFijo( resultados, query, archivoActual );
    }

  }

  if ( ask_menu === 'comunidad_alumnos' ) {

    const archivoActual = '3_alumnos.txt';
    const filters = {
      archivo: '3_alumnos.txt',
      chunk: 'chunk_07'
    };

    const resultados = await vectorStore.similaritySearchWithScore(
      query,
      1, // solo queremos uno
      filters
    ) as [ SofiaDocument, number ][];

    if ( resultados.length > 0 ) {
      return await responderConResultadosFijo( resultados, query, archivoActual );
    }

  }

  if ( ask_menu === 'noticias_mercado' ) {

    const archivoActual = '8_flujos_recursos_web.txt';
    const filters = {
      archivo: '8_flujos_recursos_web.txt',
      chunk: 'chunk_3'
    };

    const resultados = await vectorStore.similaritySearchWithScore(
      query,
      1, // solo queremos uno
      filters
    ) as [ SofiaDocument, number ][];

    if ( resultados.length > 0 ) {
      return await responderConResultadosFijo( resultados, query, archivoActual );
    }

  }


  if ( ask_menu === 'recursos_gratuitos' ) {

    const archivoActual = '9_soporte_general.txt';
    const filters = {
      archivo: '9_soporte_general.txt',
      chunk: 'chunk_08'
    };

    const resultados = await vectorStore.similaritySearchWithScore(
      query,
      1, // solo queremos uno
      filters
    ) as [ SofiaDocument, number ][];

    if ( resultados.length > 0 ) {
      return await responderConResultadosFijo( resultados, query, archivoActual );
    }

  }

  if ( ask_menu === 'club_fran' ) {

    const archivoActual = '8_flujos_recursos_web.txt';
    const filters = {
      archivo: '8_flujos_recursos_web.txt',
      chunk: 'chunk_2'
    };

    const resultados = await vectorStore.similaritySearchWithScore(
      query,
      1, // solo queremos uno
      filters
    ) as [ SofiaDocument, number ][];

    if ( resultados.length > 0 ) {
      return await responderConResultadosFijo( resultados, query, archivoActual );
    }

  }

  if ( ask_menu === 'comparacion' ) {

    const archivoActual = '2_curso_trading_online_grabado.txt';
    const filters = {
      archivo: '2_curso_trading_online_grabado.txt',
      chunk: 'chunk_20'
    };

    const resultados = await vectorStore.similaritySearchWithScore(
      query,
      1, // solo queremos uno
      filters
    ) as [ SofiaDocument, number ][];

    if ( resultados.length > 0 ) {
      return await responderConResultadosFijo( resultados, query, archivoActual );
    }

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

  const STOPWORDS = new Set( [
    'de', 'la', 'que', 'el', 'en', 'y', 'a', 'los', 'del', 'se', 'las'
  ] );
  const palabrasIrrelevantes = new Set( [ 'miami', 'santiago', 'grabado', 'en vivo', 'en directo' ] );
  const palabrasFiltradas = query.split( /\s+/ ).filter( p => !palabrasIrrelevantes.has( p ) );
  const queryFiltrada = palabrasFiltradas.filter( p => !STOPWORDS.has( p ) ).join( " " );
  console.log( 'query filtrada:', queryFiltrada );

  const resultadosActuales = await vectorStore.similaritySearchWithScore( queryFiltrada, 10, filters ) as [ SofiaDocument, number ][];

  // const relevantesActuales = resultadosActuales.map( ( [ doc, score ] ) => {
  //   const tags = ( doc.metadata?.tags || [] ).map( ( t: string ) => t.toLowerCase() );
  //   const interseccion = palabrasQuery.filter( p => tags.includes( p ) );
  //   let bonificacion = 0;
  //   if ( interseccion.length > 0 ) {
  //     bonificacion += 0.03;
  //     console.log( `✅ Bonificación por coincidencia con tags: ${ interseccion.join( ', ' ) } en chunk ${ doc.metadata?.chunk }` );
  //   }
  //   return [ doc, score + bonificacion ] as [ SofiaDocument, number ];
  // } ).filter( ( [ doc ] ) => matchDisparador( doc, query ) );

  const relevantesActuales = resultadosActuales
    .filter( ( [ doc ] ) => matchDisparador( doc, query ) )
    .map( ( [ doc, score ] ) => {
      const tags = ( doc.metadata?.tags || [] ).map( ( t: string ) => t.toLowerCase() );
      const interseccion = palabrasQuery.filter( p => tags.includes( p ) );
      let bonificacion = 0;
      if ( interseccion.length > 0 ) {
        bonificacion += 0.03;
        console.log( `✅ Bonificación por coincidencia con tags: ${ interseccion.join( ', ' ) } en chunk ${ doc.metadata?.chunk }` );
      }
      return [ doc, score + bonificacion ] as [ SofiaDocument, number ];
    } );

  const nuevoContextoDetectado = detectarCambioDeContexto( query );

  if ( relevantesActuales.length > 0 ) {
    return await responderConResultados( relevantesActuales, query, archivoActual );
  }
  console.log( 'buscar en global' );

  const filtrosGlobales = {
    archivo: { $in: [ '9_soporte_general.txt', '8_flujos_recursos_web.txt' ] }
  };

  const resultadosOtros = await vectorStore.similaritySearchWithScore( query, 10, filtrosGlobales ) as [ SofiaDocument, number ][];

  const relevantesPermitidos = resultadosOtros.map( ( [ doc, score ] ) => {
    const archivo = doc.metadata.archivo;
    const esFallback = doc.metadata.es_fallback;
    const coincideContexto = archivo === nuevoContextoDetectado;
    const tags = ( doc.metadata?.tags || [] ).map( ( t: string ) => t.toLowerCase() );
    const interseccion = palabrasQuery.filter( p => tags.includes( p ) );
    let bonificacion = 0;
    if ( interseccion.length > 0 ) {
      bonificacion += 0.03;
      console.log( `✅ Bonificación por coincidencia con tags: ${ interseccion.join( ', ' ) } en chunk ${ doc.metadata?.chunk }` );
    }
    return [ doc, score + bonificacion ] as [ SofiaDocument, number ];
  } ).filter( ( [ doc ] ) => {
    const archivo = doc.metadata.archivo;
    const esFallback = doc.metadata.es_fallback;
    const coincideContexto = archivo === nuevoContextoDetectado;

    //    console.log( `⛔ Filtro 1 - archivo: ${ archivo }, esFallback: ${ esFallback }, coincideContexto: ${ coincideContexto }` );
    //    return esFallback || coincideContexto || archivo === '9_soporte_general.txt';
    return true;
  } ).filter( ( [ doc ] ) => matchDisparador( doc, query ) );

  return await responderConResultados( relevantesPermitidos, query, nuevoContextoDetectado || archivoActual );
};


const responderConResultados = async (
  resultados: [ SofiaDocument, number ][],
  query: string,
  archivoContexto: string
) => {
  // Filtrar consultas triviales o irrelevantes
  const consultaSimple = query.trim().toLowerCase();
  const sinIntencionClara = [ "", "n", "ok", "gracias", "?", "👍", "🙃" ];
  if ( consultaSimple.length < 3 && ![ "sí", "no" ].includes( consultaSimple ) ) {
    return {
      texto: "¿Podrías darme un poco más de contexto o detalle para ayudarte mejor?",
      origen: "sin_intencion_clara",
      tags: [],
      chunkId: null
    };
  }
  //  const coincidenciasFijas = resultados.filter( ( [ doc ] ) => doc.metadata.tipo === 'respuesta_fija' && !doc.metadata.es_fallback );
  const coincidenciasFijas = resultados
    .filter( ( [ doc ] ) => doc.metadata.tipo === 'respuesta_fija' && !doc.metadata.es_fallback )
    .sort( ( a, b ) => b[ 1 ] - a[ 1 ] );
  const coincidenciasFallback = resultados.filter( ( [ doc ] ) => doc.metadata.tipo === 'respuesta_fija' && doc.metadata.es_fallback );


  const mejor =
    coincidenciasFijas[ 0 ]?.[ 0 ] ||
    coincidenciasFallback[ 0 ]?.[ 0 ];
  const score = resultados[ 0 ]?.[ 1 ] || 0;

  if ( mejor && score >= 0.65 ) {
    const match = mejor.pageContent.match( /👉[^\n]*\n+([\s\S]*)/ );
    const onlyAnswer = match?.[ 1 ]?.trim() || mejor.pageContent;

    return {
      texto: onlyAnswer,
      origen: mapArchivoToSeccion( mejor.metadata.archivo ),
      tags: mejor.metadata.tags || [],
      chunkId: mejor.metadata.chunk || null
    };
  }



  const contextoFiltrado = resultados
    .filter( ( [ doc ] ) => doc.pageContent && doc.pageContent.trim().length > 0 )
    .map( ( [ doc ] ) => doc.pageContent.trim() )
    .join( "\n\n" );
  const instruccionesSofia = `
Eres *Sofía*, la agente virtual de la Escuela "Tu Plan A: Bolsa y Trading", especializada en responder con precisión y empatía sobre los cursos y recursos de Fran Fialli.

🎯 Tu estilo es profesional, claro y cercano (uso de "usted").  
🎓 Comunicas de forma didáctica, sin jerga ni promesas exageradas.  
📲 Usás formato WhatsApp: frases cortas, listas verticales, *negrita*, _cursiva_ y emojis moderados (📊 😊 ⚠️).

🔒 No debes improvisar, suponer ni inventar respuestas. Si no hay información suficiente, ofrece ayuda o una derivación profesional a Javier Gómez, asesor académico.

⚠️ Si algún fragmento del contexto incluye frases como “Responder exactamente con el siguiente bloque de texto”, debes copiar y pegar ese texto literalmente, sin modificarlo.

Siempre respondé exclusivamente con base en el siguiente contexto.
`;


  const prompt = new PromptTemplate( {
    inputVariables: [ "context", "query", "instrucciones" ],
    template: `
{instrucciones}

---------------------
{context}
---------------------

Pregunta: {query}

Respuesta:
`
  } );

  const finalPrompt = await prompt.format( {
    instrucciones: instruccionesSofia,
    context: contextoFiltrado || `
⚠️ No se encontró información específica para responder con precisión.

Estoy aquí para ayudarle igualmente. Puede reformular su pregunta o, si lo desea, puedo ponerle en contacto con Javier Gómez, nuestro asesor académico.

`,
    query
  } );
  const openai = new ChatOpenAI( {
    modelName: process.env.MODELO_SOFIA,
    temperature: 0.3,
    openAIApiKey: process.env.OPENAI_API_KEY!
  } );

  const response = await openai.invoke( finalPrompt );
  console.log( "🤖 OpenAI generó una respuesta alternativa." );

  return {
    texto: typeof response === "string" ? response : ( response.text || "Lo siento, no encontré información para responder eso de forma precisa." ),
    origen: mapArchivoToSeccion( archivoContexto ),
    tags: [],
    chunkId: null
  };
};


const responderConResultadosFijo = async (
  resultados: [ SofiaDocument, number ][],
  query: string,
  archivoContexto: string
) => {
  // let i = 0;
  // for ( const [ doc, number ] of resultados ) {
  //   console.log( '📥 Documentos recuperados por Pinecone:' );
  //   console.log( `\n#${ i + 1 }` );
  //   console.log( 'Archivo:', doc.metadata?.archivo );
  //   console.log( 'Chunk:', doc.metadata?.chunk );
  //   console.log( 'Tipo:', doc.metadata?.tipo );
  //   console.log( 'Score:', number.toFixed( 4 ) );
  //   i++;
  // }

  const mejor = resultados[ 0 ]?.[ 0 ];

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
  const response = await new ChatOpenAI( { modelName: process.env.MODELO_SOFIA, temperature: 0.3, openAIApiKey: process.env.OPENAI_API_KEY! } ).invoke( finalPrompt );

  console.log( "gemini responde" );

  return {
    texto: typeof response === "string" ? response : ( response.text || "" ),
    origen: mapArchivoToSeccion( archivoContexto ),
    tags: [],
    chunkId: null
  };
};


