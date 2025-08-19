import 'dotenv/config';
import { OpenAIEmbeddings, ChatOpenAI } from '@langchain/openai';
import { PineconeStore } from '@langchain/pinecone';
import { pinecone } from '../lib/pinecone/connect';
import { PromptTemplate } from '@langchain/core/prompts';
import { Document } from "langchain/document";
import { preprocessPregunta } from '../lib/utils/preprocessinText';

import { ordenarPorMejorCoincidencia } from '../lib/utils/ordernarPorMejorCoincidencia';

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
    modelName: process.env.MODELO_SOFIA, // o "gpt-3.5-turbo"
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



  const resultadosActuales = await vectorStore.similaritySearchWithScore( query, 10, filters ) as [ SofiaDocument, number ][];

  const resultadosFiltrados = ordenarPorMejorCoincidencia( resultadosActuales, query )
    .filter( r => r.fuerza !== undefined && r.fuerza >= 3 );

  if ( resultadosFiltrados.length > 0 ) {
    const soloDocsYScore: [ SofiaDocument, number ][] = resultadosFiltrados.map( r => [ r.doc, r.score ?? 1 ] );
    return await responderConResultados( soloDocsYScore, query, '' );
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
    return await responderConResultados( soloDocsYScore, query, '' );
  }


  // 🧯 Si nada funcionó, devolvé una respuesta vacía pero controlada:
  console.log( "🛑 No se encontraron coincidencias relevantes en ningún contexto." );
  return await responderConResultados( [], query, '' );





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