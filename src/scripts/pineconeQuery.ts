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

  const vectorStore = await PineconeStore.fromExistingIndex( new OpenAIEmbeddings(), {
    pineconeIndex: index,
    textKey: 'text',
  } );

  const filter = seccionActual
    ? { archivo: { $eq: mapSeccionToArchivo( seccionActual ) } } // filtra solo chunks del menú actual
    : undefined;


  //  const results = await vectorStore.similaritySearch( query, 3, filter );
  const results = await vectorStore.similaritySearchWithScore( query, 3, filter );

  return results;
}
