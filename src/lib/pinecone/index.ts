//import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
//import { PineconeStore } from 'langchain/vectorstores/pinecone';
import { OpenAIEmbeddings } from '@langchain/openai';
import { PineconeStore } from '@langchain/pinecone';
import { Document } from 'langchain/document';


import { pinecone } from './connect';

const PINECONE_INDEX_NAME = process.env.PINECONE_INDEX_NAME ?? '';

export const runOnPinecone = async ( docs: Document<Record<string, any>>[] ) => {


  const embeddings = new OpenAIEmbeddings();

  const index = pinecone.Index( PINECONE_INDEX_NAME );
  console.log( `Documentos a insertar: ${ docs.length }` );

  try {
    await PineconeStore.fromDocuments( docs, embeddings, { pineconeIndex: index } );
    console.log( 'Inserción completada' );
  } catch ( error ) {
    console.error( 'Error insertando documentos:', error );
  }


  return true;
};
