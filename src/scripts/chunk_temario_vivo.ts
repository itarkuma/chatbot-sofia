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
      id: 'chunk_vivo_temario_completo', // id único
      values: vector,
      metadata: {
        archivo: '1_curso_trading_online_vivo.txt',
        chunk: 'chunk_20',
        tipo: 'respuesta_fija',
        es_fallback: false,
        tags: [ 'curso_online_en_vivo', 'temario', 'módulos', 'contenido_formativo', 'estructura', 'psicología', 'análisis_técnico', 'gestión_de_riesgo', 'sistema_de_trading', 'operativa_real' ],
        disparadoras: [
          '¿Qué módulos tiene el curso online en vivo?',
          '¿Podrías detallarme el temario completo de los módulos en vivo?',
          '¿Cuál es la estructura del curso en vivo de Fran Fialli?',
          '¿Qué aprenderé en cada módulo del curso online en vivo?',
          '¿Qué temas se tratan en el curso en vivo?',
        ],
        text: text.trim(), // importante si luego quieres indexar texto original
      }
    }
  ] );

  console.log( `✅ En Pinecone Se indexaron xx chunks desde xx archivos.` );
};

loadChunksPlataformaTrading();