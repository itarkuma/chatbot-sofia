import 'dotenv/config';
import { OpenAIEmbeddings, ChatOpenAI } from '@langchain/openai';
import { PineconeStore } from '@langchain/pinecone';
import { pinecone } from '../lib/pinecone/connect';
import { PromptTemplate } from '@langchain/core/prompts';
import { Document } from "langchain/document";
import { preprocessPregunta } from '../lib/utils/preprocessinText';

import { esComparacionGrabadoVsVivo } from '../lib/utils/esComparacionGrabadoVsVivo';
import { esPrecioRelacion } from '../lib/utils/esPrecioRelacion';
import { ordenarPorMejorCoincidencia } from "../lib/utils/ordernarPorMejorCoincidencia";
import { type IntencionDetectada } from "../ai/cath-intention";


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


export const askSofia = async (
  question: string,
  seccion: string,
  ask_menu: string = '',
  esAlumno: boolean = false,
  intencion: IntencionDetectada = "UNKNOWN"
) => {


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

  if ( intencion === 'CURSO_MIAMI_IDIOMA' ) {

    const archivoActual = '4_curso_trading_miami.txt';
    const filters = {
      archivo: '4_curso_trading_miami.txt',
      chunk: 'chunk_45'
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

  if ( intencion === 'CURSO_SANTIAGO_IDIOMA' ) {

    const archivoActual = '5_curso_trading_santiago.txt';
    const filters = {
      archivo: '5_curso_trading_santiago.txt',
      chunk: 'chunk_44'
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

  if ( ask_menu === 'curso_presencial' ) {
    const archivoActual = '4_curso_trading_miami.txt';
    const filters = {
      archivo: '4_curso_trading_miami.txt',
      chunk: 'chunk_unknown_53'
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

  const regexPlataformas = new RegExp(
    "\\b(plataforma|plataformas|software|herramienta[s]?|ninjatrader|tradingview|bookmap|mapa[s]? de calor)\\b.*\\b(usan|usa|utilizan|utiliza|se\\s+usa|se\\s+usan)?|" +
    "\\b(usan|usa|utilizan|utiliza|se\\s+usa|se\\s+usan)\\b.*\\b(plataforma|plataformas|software|herramienta[s]?|ninjatrader|tradingview|bookmap|mapa[s]? de calor)\\b",
    "i"
  );


  if (
    ( !seccion && intencion === 'METODO_PAGO' ) ||
    ( seccion === 'soporte_general' && intencion === 'METODO_PAGO' ) ) {


    const archivoActual = '9_soporte_general.txt';
    const filters = {
      archivo: '9_soporte_general.txt',
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

  if ( seccion === 'curso_online_grabado' && regexPlataformas.test( preprocessPregunta( query ) ) ) {

    const archivoActual = '2_curso_trading_online_grabado.txt';
    const filters = {
      archivo: '2_curso_trading_online_grabado.txt',
      chunk: 'chunk_45'
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

  if ( seccion === 'curso_online_grabado' && intencion === 'PRECIO_EURO' ) {

    const archivoActual = '2_curso_trading_online_grabado.txt';
    const filters = {
      archivo: '2_curso_trading_online_grabado.txt',
      chunk: 'chunk_25'
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

  if ( seccion === 'curso_online_grabado' && intencion === 'PRECIO_DOLAR' ) {

    const archivoActual = '2_curso_trading_online_grabado.txt';
    const filters = {
      archivo: '2_curso_trading_online_grabado.txt',
      chunk: 'chunk_26'
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

  if ( seccion === 'curso_online_grabado' && intencion === 'PRECIO_MONEDA_LOCAL' ) {

    const archivoActual = '2_curso_trading_online_grabado.txt';
    const filters = {
      archivo: '2_curso_trading_online_grabado.txt',
      chunk: 'chunk_27'
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
  if ( seccion === 'curso_online_grabado' && intencion === 'METODO_PAGO' ) {

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


  if (
    (
      ( intencion === "PRECIO_CURSO_GRABADO" ) ||
      ( intencion === "PRECIO_CURSO" )
    ) ) {

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

  if ( ( seccion === 'curso_online_vivo' ) &&
    ( intencion === "LISTA_PRIORITARIA" ) ) {
    const archivoActual = '1_curso_trading_online_vivo.txt';
    const filters = {
      archivo: '1_curso_trading_online_vivo.txt',
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

  if (
    (
      ( intencion === "PRECIO_CURSO_VIVO" ) ||
      ( intencion === "PRECIO_CURSO" )
    )
  ) {

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


  const regexPlataformasvivo = new RegExp(
    "\\b(plataforma|plataformas|software|herramienta[s]?|ninjatrader|tradingview|bookmap|mapa[s]? de calor)\\b.*\\b(usan|usa|utilizan|utiliza|se\\s+usa|se\\s+usan)?|" +
    "\\b(usan|usa|utilizan|utiliza|se\\s+usa|se\\s+usan)\\b.*\\b(plataforma|plataformas|software|herramienta[s]?|ninjatrader|tradingview|bookmap|mapa[s]? de calor)\\b",
    "i"
  );

  if ( seccion === 'curso_online_vivo' && regexPlataformasvivo.test( preprocessPregunta( query ) ) ) {

    const archivoActual = '1_curso_trading_online_vivo.txt';
    const filters = {
      archivo: '1_curso_trading_online_vivo.txt',
      chunk: 'chunk_22'
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
  if ( seccion === 'curso_online_vivo' && intencion === 'METODO_PAGO' ) {

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

  if (
    (
      ( intencion === "PRECIO_CURSO_MIAMI" ) ||
      ( intencion === "PRECIO_CURSO" )
    )
  ) {

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

  if (
    (
      ( intencion === "PRECIO_CURSO_SANTIAGO" ) ||
      ( intencion === "PRECIO_CURSO" )
    )
  ) {

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

  if ( ask_menu === 'consultas_generales' ) {

    const archivoActual = '9_soporte_general.txt';
    const filters = {
      archivo: '9_soporte_general.txt',
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
    'a'
  ] );
  const palabrasIrrelevantes = new Set( [ 'miami', 'santiago', 'grabado', 'en vivo', 'en directo' ] );
  const palabrasFiltradas = query.split( /\s+/ ).filter( p => !palabrasIrrelevantes.has( p ) );
  const queryFiltrada = palabrasFiltradas.filter( p => !STOPWORDS.has( p ) ).join( " " );
  console.log( 'query filtrada:', queryFiltrada );
  const nuevoContextoDetectado = detectarCambioDeContexto( query );

  const resultadosActuales = await vectorStore.similaritySearchWithScore( queryFiltrada, 10, filters ) as [ SofiaDocument, number ][];

  const resultadosFiltrados = ordenarPorMejorCoincidencia( resultadosActuales, queryFiltrada )
    .filter( r => r.fuerza !== undefined && r.fuerza >= 3 );
  console.log( "📌 Resultados filtrados con fuerza >= 3:" );
  resultadosFiltrados.forEach( ( r, i ) => {
    console.log(
      `#${ i + 1 } — Chunk: ${ r.chunkId } | Tipo: ${ r.tipo } | Fuerza: ${ r.fuerza } | Score: ${ r.score } | Tags: ${ r.doc?.metadata?.tags?.join( ', ' ) ?? '-' }`,
    );
  } );
  if ( resultadosFiltrados.length > 0 ) {
    const soloDocsYScore: [ SofiaDocument, number ][] = resultadosFiltrados.map( r => [ r.doc, r.score ?? 1 ] );
    return await responderConResultados( soloDocsYScore, query, archivoActual );
  }

  console.log( "🔍 No hubo coincidencias fuertes. Buscando en recursos globales..." );

  // realizar búsqueda en recursos generales
  const filtrosGlobales = {
    archivo: { $in: [ '9_soporte_general.txt', '8_flujos_recursos_web.txt' ] }
  };

  const resultadosOtros = await vectorStore.similaritySearchWithScore( query, 10, filtrosGlobales ) as [ SofiaDocument, number ][];
  const globalOrdenadas = ordenarPorMejorCoincidencia( resultadosOtros, query ).filter( r => r.fuerza !== undefined && r.fuerza >= 2 );

  if ( globalOrdenadas.length > 0 ) {
    const soloDocsYScore: [ SofiaDocument, number ][] = globalOrdenadas.map( r => [ r.doc, r.score ?? 1 ] );
    return await responderConResultados( soloDocsYScore, query, nuevoContextoDetectado || archivoActual );
  }


  // 🧯 Si nada funcionó, devolvé una respuesta vacía pero controlada:
  console.log( "🛑 No se encontraron coincidencias relevantes en ningún contexto." );
  return await responderConResultados( [], query, archivoActual );

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
    .filter( ( [ doc ] ) => doc.metadata.tipo === 'respuesta_fija' && !doc.metadata.es_fallback );
  const coincidenciasFallback = resultados.filter( ( [ doc ] ) => doc.metadata.tipo === 'respuesta_fija' && doc.metadata.es_fallback );


  const mejorEntry =
    coincidenciasFijas[ 0 ] ||
    coincidenciasFallback[ 0 ];

  const mejor = mejorEntry?.[ 0 ];
  const score = mejorEntry?.[ 1 ] || 0;

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


