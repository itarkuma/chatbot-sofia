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

const instruccionesDir = path.join( __dirname, '../instrucciones' );

export const loadContexto = async () => {
  try {
    const archivoContexto = 'entrenamiento.txt'; // Ajusta nombre si es otro
    const pathContexto = path.join( instruccionesDir, archivoContexto );
    const contenidoContexto = fs.readFileSync( pathContexto, 'utf8' );

    const docContexto = new Document( {
      pageContent: contenidoContexto,
      metadata: {
        tipo: 'contexto_general',
        archivo: archivoContexto,
        chunk: 'contexto_sofia',
        tags: [ 'identidad', 'tono', 'derivacion', 'bienvenida' ],
      },
    } );

    const index = pinecone.Index( process.env.PINECONE_INDEX_NAME! );

    await PineconeStore.fromDocuments( [ docContexto ], new OpenAIEmbeddings(), {
      pineconeIndex: index,
      textKey: 'text',
    } );

    console.log( `✅ Se indexó el contexto general de Sofía desde ${ archivoContexto }` );
  } catch ( error ) {
    console.error( '❌ Error cargando contexto general:', error );
  }
};


loadContexto();