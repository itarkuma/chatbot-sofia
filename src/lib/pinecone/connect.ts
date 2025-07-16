import 'dotenv/config';
import { Pinecone } from '@pinecone-database/pinecone';


if ( !process.env.PINECONE_API_KEY ) {
  throw new Error( 'PINECONE_API_KEY faltante' );
}

async function initPinecone() {
  try {
    const pinecone = new Pinecone( {
      apiKey: process.env.PINECONE_API_KEY!,
    } );

    return pinecone;
  } catch ( error ) {
    console.error( '❌ Error inicializando Pinecone:', error );
    throw new Error( 'Failed to initialize Pinecone Client' );
  }
}

export const pinecone = await initPinecone();
