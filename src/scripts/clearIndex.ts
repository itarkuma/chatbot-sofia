import 'dotenv/config';
import { pinecone } from '../lib/pinecone/connect';

const deleteAllVectors = async () => {
  const index = pinecone.Index( process.env.PINECONE_INDEX_NAME! );

  await index.deleteAll(); // ✅ Este sí es público en el SDK actual
  console.log( '✅ Todos los vectores han sido eliminados del índice.' );
};

deleteAllVectors().catch( console.error );
