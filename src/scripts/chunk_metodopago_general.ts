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
  const text = `💳 Nuestros métodos de pago disponibles para todas nuestras formaciones son los siguientes:

💶 Si vas a pagar en euros (EUR)
* PayPal
* Tarjeta de crédito o débito
* Transferencia bancaria
* Bizum
* Wise
* Pago a cuotas

💵 Si vas a pagar en dólares (USD):
* Zelle
* PayPal EE.UU.
* Transferencia bancaria (Wells Fargo)
* Wise EE.UU.

🌍 Otro país o moneda local:
* Hotmart (con múltiples monedas)
* PayPal
* Payoneer
* Wise Global
* Fracciona tu pago

Puedes pagar desde cualquier país con total seguridad. Si necesitas ayuda personalizada para elegir el método más cómodo, solo dime desde dónde quieres pagar y te ayudo.`;


  const index = pinecone.Index( process.env.PINECONE_INDEX_NAME! );
  const embeddings = new OpenAIEmbeddings( { openAIApiKey: process.env.OPENAI_API_KEY! } );
  const vector = await embeddings.embedQuery( text );


  await index.upsert( [
    {
      id: 'chunk_general_metodo_pago', // id único
      values: vector,
      metadata: {
        archivo: '9_soporte_general.txt',
        chunk: 'metodo_pago',
        tipo: 'respuesta_fija',
        es_fallback: false,
        tags: [ 'métodos_de_pago', 'formas_de_pago', 'pago_en_euros', 'pago_en_dólares', 'pago_internacional' ],
        disparadoras: [
          '¿Cómo puedo pagar el curso?',
          '¿Qué formas de pago tenéis para el curso de Fran?',
          '¿Se puede pagar desde el extranjero?',
          '¿Puedo pagar con PayPal o Wise?',
          '¿Aceptáis pagos en cuotas para el curso?',
          '¿Qué métodos de pago hay si estoy en otro país?',
          '¿Se puede pagar por transferencia o Zelle?',
          '¿Qué opciones hay para pagar el curso?',
        ],
        text: text.trim(), // importante si luego quieres indexar texto original
      }
    }
  ] );

  console.log( `✅ En Pinecone Se indexaron xx chunks desde xx archivos.` );
};

loadChunksPlataformaTrading();