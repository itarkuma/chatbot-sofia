import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Document } from 'langchain/document';
import { OpenAIEmbeddings } from '@langchain/openai';
import { PineconeStore } from '@langchain/pinecone';
import { pinecone } from '../lib/pinecone/connect';

// Definir __dirname en ESM
const __filename = fileURLToPath( import.meta.url );
const __dirname = path.dirname( __filename );


function extractFrasesDisparadoras( text ) {
  const match = text.match( /\*\*Frases disparadoras típicas:\*\*([\s\S]*?)\n\n|👉/ );
  if ( !match ) return [];
  const bloque = match[ 1 ] || '';
  return bloque
    .split( '\n' )
    .map( line => line.trim() )
    .filter( line => line.startsWith( '-' ) )
    .map( line => line.replace( /^- /, '' ).trim() );
}



export const loadChunksPlataformaTrading = async () => {
  const text = '';


  const index = pinecone.Index( process.env.PINECONE_INDEX_NAME! );
  const embeddings = new OpenAIEmbeddings( { openAIApiKey: process.env.OPENAI_API_KEY! } );
  const vector = await embeddings.embedQuery( text );


  await index.upsert( [
    {
      id: 'chunk_vivo_indicadores', // id único
      values: vector,
      metadata: {
        archivo: '1_curso_trading_online_vivo.txt',
        chunk: 'indicadores',
        tipo: 'respuesta_fija',
        es_fallback: false,
        tags: [ 'indicadores_técnicos', 'análisis_técnico', 'rsi', 'macd', 'medias_móviles', 'volumen', 'momentum', 'vwap' ],
        disparadoras: [
          '¿Qué indicadores enseñan en el curso?',
          '¿Se trabaja con indicadores técnicos como RSI o MACD?',
          '¿El curso incluye análisis con volumen y medias móviles?',
          '¿Se estudia lectura de velas japonesas?',
          '¿Aprenderé a usar indicadores reales? ',
          'Quisiera saber qué indicadores se aprenden en el curso.',
          'se trabaja con indicadores tecnicos rsi macd? ',
          'indicadores curso rsi macd volumen',
        ],
        text: text.trim(), // importante si luego quieres indexar texto original
      }
    }
  ] );

  console.log( `✅ En Pinecone Se indexaron xx chunks desde xx archivos.` );
};

loadChunksPlataformaTrading();