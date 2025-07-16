import 'dotenv/config';
import { DirectoryLoader } from 'langchain/document_loaders/fs/directory';
import { TextLoader } from 'langchain/document_loaders/fs/text';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { runOnPinecone } from '../lib/pinecone/index';

export const loadChunks = async () => {
  const loader = new DirectoryLoader( 'entrenamiento', {
    '.txt': ( path ) => new TextLoader( path ),
  } );
  const rawDocs = await loader.load();

  const splitter = new RecursiveCharacterTextSplitter( {
    chunkSize: 1000,
    chunkOverlap: 150,
  } );
  const docs = await splitter.splitDocuments( rawDocs );

  await runOnPinecone( docs );
  console.log( '✅ Chunks cargados en Pinecone correctamente.' );
};

