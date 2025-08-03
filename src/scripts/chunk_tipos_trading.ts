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
  const text = `### Chunk 07 – ¿Qué tipos de trading aprenderé en el Curso Online Grabado?
#curso_online_grabado #tipos_de_trading #scalping #intradía #swing #largo_plazo #estilo_operativo

**Frases disparadoras típicas:**

- ¿Se enseña scalping o solo trading a largo plazo?  
- ¿Este curso me sirve para intradía?  
- ¿Qué estilos de trading incluye el curso online grabado?  
- ¿Aprenderé distintos tipos de trading?  
- ¿Me enseñan a operar a corto y largo plazo?

👉 *Responder utilizando la siguiente información como base, sin inventar ni modificar el sentido original. La IA debe responder de forma clara y precisa, inspirándose en el contenido siguiente.*

Nuestras formaciones, *tanto online como presenciales*, abarcan distintas formas de operar en los mercados, adaptadas a diferentes perfiles operativos:

⚡ *Scalping:* operaciones de muy corto plazo, enfocadas en movimientos rápidos con alta frecuencia de entrada y salida.  
  
⏱️ *Intradía:* operaciones que se abren y cierran en el mismo día, ideales para quienes desean controlar el riesgo diario y aprovechar oportunidades veloces.  
  
📆 *Swing trading:* posiciones de varios días o semanas, recomendadas para quienes disponen de menos tiempo diario pero buscan resultados sostenidos.  
  
📊 También se trabaja con *visión de largo plazo*, integrando una planificación más estratégica para construir portafolios con proyección.

🧭 Aprenderá a identificar su *estilo ideal* según su *perfil psicológico*, *disponibilidad horaria* y *tolerancia al riesgo*, para construir un enfoque que se adapte realmente a usted.`;


  const index = pinecone.Index( process.env.PINECONE_INDEX_NAME! );
  const embeddings = new OpenAIEmbeddings( { openAIApiKey: process.env.OPENAI_API_KEY! } );
  const vector = await embeddings.embedQuery( text );


  await index.upsert( [
    {
      id: 'chunk_tipos_trading', // id único
      values: vector,
      metadata: {
        archivo: '8_flujos_recursos_web.txt',
        chunk: 'chunk_tipos_trading',
        tipo: 'respuesta_fija',
        es_fallback: false,
        tags: [ 'tipos_de_trading', 'scalping', 'intradía', 'swing', 'largo_plazo', 'estilo_operativo' ],
        disparadoras: [
          '¿Se enseña scalping o solo trading a largo plazo?',
          '¿Este curso me sirve para intradía?',
          '¿Qué estilos de trading incluye el curso?',
          '¿Aprenderé distintos tipos de trading?',
          '¿Me enseñan a operar a corto y largo plazo?',
        ],
        text: text.trim(), // importante si luego quieres indexar texto original
      }
    }
  ] );

  console.log( `✅ En Pinecone Se indexaron xx chunks desde xx archivos.` );
};

loadChunksPlataformaTrading();