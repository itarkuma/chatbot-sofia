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
      id: 'chunk_grabado_plataforma', // id único
      values: vector,
      metadata: {
        archivo: '2_curso_trading_online_grabado.txt',
        chunk: 'plataforma_trading',
        tipo: 'respuesta_fija',
        es_fallback: false,
        tags: [ 'plataformas', 'ninjatrader', 'tradingview', 'mapas_de_calor', 'configuración_en_aula' ],
        disparadoras: [
          '¿Qué plataformas se usan en el curso?',
          '¿Utilizan NinjaTrader o TradingView?',
          '¿Tengo que saber usar plataformas antes del curso?',
          '¿Se configuran las plataformas en clase?',
          '¿Se usa algún mapa de calor o software profesional?',
          '¿Podría explicarme qué plataforma se utiliza durante el curso presencial?',
          'utilizan tradingview o ninjatrader en el curso?',
          'plataformas curso santiago mapa calor',
        ],
        text: text.trim(), // importante si luego quieres indexar texto original
      }
    }
  ] );

  console.log( `✅ En Pinecone Se indexaron xx chunks desde xx archivos.` );
};

loadChunksPlataformaTrading();