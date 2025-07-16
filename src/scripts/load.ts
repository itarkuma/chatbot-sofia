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

const chunksDir = path.join( __dirname, '../entrenamiento' );

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

function splitChunksFromText( text: string, filename: string ): Document[] {
  const rawChunks = text.split( /^### Chunk/gm ).filter( Boolean );

  return rawChunks.map( ( chunkText, i ) => {
    const fullText = `### Chunk${ chunkText }`.trim();

    const chunkIdMatch = fullText.match( /^### Chunk\s*(\d+)/ );
    const chunkId = chunkIdMatch?.[ 1 ] ?? `unknown_${ i }`;

    const isRespuestaFija = fullText.includes( '👉 *Responder exactamente' );

    // Separar líneas
    const lines = fullText.trim().split( '\n' );

    // Buscar la línea que contiene los hashtags
    const tagLine = lines.find( line =>
      line.trim().startsWith( '#' ) && !line.trim().startsWith( '##' )
    );

    // Extraer los hashtags si la línea existe
    const tags = tagLine
      ? tagLine
        .trim()
        .split( /\s+/ )
        .filter( tag => tag.startsWith( '#' ) )
        .map( tag => tag.slice( 1 ) )
      : [];

    // Extraer frases disparadoras
    const disparadoras = ( fullText.match( /^- .+/gm ) || [] )
      .map( line => line.replace( /^- /, '' ).trim() )
      .filter( Boolean );

    // 👇 Extraemos las frases disparadoras
    const frases = extractFrasesDisparadoras( fullText );
    const frasesSection = frases.length
      ? `Frases disparadoras:\n${ frases.map( f => `- ${ f }` ).join( '\n' ) }\n\n`
      : '';

    const respuesta = fullText;
    // if ( isRespuestaFija ) {
    //   const partes = fullText.split( /👉 \*/ );
    //   respuesta = partes[ 1 ]?.split( '\n' ).slice( 1 ).join( '\n' ).trim() ?? fullText;
    // }
    // 👇 Agregamos frases al inicio del contenido para mejorar embeddings
    const enhancedContent = frasesSection + respuesta;

    return new Document( {
      pageContent: enhancedContent,
      metadata: {
        tipo: isRespuestaFija ? 'respuesta_fija' : 'respuesta_libre',
        es_fallback: false,
        archivo: filename,
        chunk: `chunk_${ chunkId }`,
        tags,
        disparadoras,
      },
    } );
  } );
}

export const loadChunks = async () => {
  const files = fs.readdirSync( chunksDir ).filter( f => f.endsWith( '.txt' ) );
  const allChunks: Document[] = [];
  for ( const file of files ) {
    const filePath = path.join( chunksDir, file );
    const fileContent = fs.readFileSync( filePath, 'utf8' );
    const chunks = splitChunksFromText( fileContent, file );
    allChunks.push( ...chunks );
  }
  const index = pinecone.Index( process.env.PINECONE_INDEX_NAME! );
  await PineconeStore.fromDocuments( allChunks, new OpenAIEmbeddings(), {
    pineconeIndex: index,
    textKey: 'text',
  } );
  console.log( `✅ En Pinecone Se indexaron ${ allChunks.length } chunks desde ${ files.length } archivos.` );
};

loadChunks();