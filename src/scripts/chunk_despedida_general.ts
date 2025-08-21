import 'dotenv/config';
import path from 'path';
import { fileURLToPath } from 'url';
import { OpenAIEmbeddings } from '@langchain/openai';
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
  const text = `¡Muchas gracias por su interés! 😊 Espero haber ayudado. Si necesita más información, estaré aquí para apoyarle. También puede escribir la palabra ‘menú’ para ver las opciones disponibles. 

¡Que tenga un excelente día! 🍀`;


  const index = pinecone.Index( process.env.PINECONE_INDEX_NAME! );
  const embeddings = new OpenAIEmbeddings( { openAIApiKey: process.env.OPENAI_API_KEY! } );
  const vector = await embeddings.embedQuery( text );


  await index.upsert( [
    {
      id: 'chunk_general_despedida', // id único
      values: vector,
      metadata: {
        archivo: '9_soporte_general.txt',
        chunk: 'despedida',
        tipo: 'respuesta_fija',
        es_fallback: false,
        tags: [ 'despedida', 'fin_conversación', 'cierre_chat', 'hasta_luego', 'gracias' ],
        disparadoras: [
          'Chao', 'Chau', 'Bye', 'Adiós', 'Hasta luego', 'Nos vemos', 'Hasta pronto', 'Que esté bien', 'Gracias', 'Muchas gracias', 'Mil gracias', 'Perfecto, gracias', 'Eso es todo, gracias', 'Listo, hablamos luego', 'Me despido', 'Eso sería todo', 'Ya no necesito nada más', 'Me desconecto', 'Todo claro, gracias', 'Genial, gracias', 'Por ahora no tengo más dudas', 'Creo que ya no necesito más ayuda', 'Me voy, que tenga buen día', 'Hasta otra ocasión',
        ],
        text: text.trim(), // importante si luego quieres indexar texto original
      }
    }
  ] );

  console.log( `✅ En Pinecone Se indexaron xx chunks desde xx archivos.` );
};

loadChunksPlataformaTrading();