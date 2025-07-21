// lib/pineconeQuery.ts
import { pinecone } from '../lib/pinecone/connect';

import { PineconeStore } from '@langchain/pinecone';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { preprocessPregunta } from './preprocesamiento'; // si usas la función que vimos antes


const embeddings = new OpenAIEmbeddings( { apiKey: process.env.OPENAI_API_KEY } );

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

export async function pineconeQuery( pregunta: string, seccionActual?: string ) {
  const query = preprocessPregunta( pregunta );
  const index = pinecone.Index( process.env.PINECONE_INDEX_NAME! );
  const embeddings = new OpenAIEmbeddings();

  const vectorStore = await PineconeStore.fromExistingIndex( embeddings, {
    pineconeIndex: index,
    textKey: 'text',
  } );

  // Configuración
  const fallbackScoreThreshold = 0.8;
  const minValidScore = 0.65;

  // 1. Buscar en fallbacks
  const fallbackResults = await vectorStore.similaritySearchWithScore( query, 3, {
    es_fallback: { $eq: true },
  } );
  const fallbackTop = fallbackResults[ 0 ];

  // 2. Buscar en chunks normales (por sección si hay)
  const archivosDeFlujos = [
    '1_curso_trading_online_vivo.txt',
    '2_curso_trading_online_grabado.txt',
    '4_curso_trading_miami.txt',
    '5_curso_trading_santiago.txt',
    '9_soporte_general.txt',
    '3_alumnos.txt',
  ];

  const filter = seccionActual
    ? {
      archivo: { $eq: mapSeccionToArchivo( seccionActual ) },
      es_fallback: { $ne: true },
    }
    : {
      archivo: { $nin: archivosDeFlujos },
      es_fallback: { $ne: true },
    };

  const sectionResults = await vectorStore.similaritySearchWithScore( query, 3, filter );
  const sectionTop = sectionResults[ 0 ];

  // console.log( '\n🔎*****pinecone Resultados sección (no fallback):' );
  // sectionResults.forEach( ( [ doc, score ], i ) => {
  //   console.log( `#${ i + 1 }` );
  //   console.log( `Archivo: ${ doc.metadata.archivo }` );
  //   console.log( `Chunk: ${ doc.metadata.chunk }` );
  //   console.log( `Score: ${ score.toFixed( 4 ) }` );
  //   console.log( `Texto: ${ doc.metadata.text?.substring( 0, 100 ) }...` );
  //   console.log( '---' );
  // } );

  // 3. Comparar resultados
  if ( !sectionTop && !fallbackTop ) {
    console.log( '🛑 Ningún resultado relevante encontrado.' );
    return [];
  }

  // Ambos existen
  if ( sectionTop && fallbackTop ) {
    const [ doc1, score1 ] = sectionTop;
    const [ doc2, score2 ] = fallbackTop;

    if ( score1 >= score2 && score1 >= minValidScore ) {
      console.log( '✅ Se eligió resultado normal (flujo)' );
      return sectionResults;
    } else if ( score2 > score1 && score2 >= minValidScore ) {
      console.log( '✅ Se eligió fallback' );
      return fallbackResults;
    } else {
      console.log( '🛑 Ningún resultado supera el score mínimo' );
      return [];
    }
  }

  // Solo hay normal
  if ( sectionTop && sectionTop[ 1 ] >= minValidScore ) {
    return sectionResults;
  }

  // Solo hay fallback
  if ( fallbackTop && fallbackTop[ 1 ] >= minValidScore ) {
    return fallbackResults;
  }

  // Nada válido
  return [];
}
