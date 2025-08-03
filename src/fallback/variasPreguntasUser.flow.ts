import { addKeyword, EVENTS } from '@builderbot/bot';
import { preprocessPregunta } from '../lib/utils/preprocessinText';
import { generateTimer } from '../lib/utils/generateTimer';
import { askSofia } from '../scripts/query';
import { log } from 'util';

const detectarMensajeMultiplesPreguntas = ( query: string ): boolean => {
  const texto = preprocessPregunta( query ); // Normaliza texto
  const original = query; // Para signos como "¿", "?"

  // Heurística 1: múltiples signos de interrogación
  const signosInterrogacion = ( original.match( /[¿?]/g ) || [] ).length;
  if ( signosInterrogacion >= 2 ) return true;

  // Heurística 2: conectores típicos de cambio de tema o acumulación
  const conectores = [
    "y otra cosa",
    "ah y",
    "ademas",
    "tambien",
    "por cierto",
    "aparte",
    "otra duda",
    "otra consulta",
    "ya que estamos",
    "de paso"
  ];

  if ( conectores.some( frase => texto.includes( frase ) ) ) {
    return true;
  }

  return false;
};

const fallbackMensajeMultiplesUser = addKeyword( EVENTS.ACTION ).addAction( async ( ctx, { state, flowDynamic, extensions } ) => {
  try {
    console.log( 'fallback -> MensajeMultiplesUser' );
    const seccion = await state.get( 'seccionActual' );

    const { texto, origen, chunkId } = await askSofia( preprocessPregunta( ctx.body ), seccion, 'user_question_multiples' );

    await flowDynamic( [ { body: texto, delay: generateTimer( 150, 250 ) } ] );
    console.log( { origen, chunkId } );


  } catch ( err ) {
    console.log( `[ERROR]: en el flujo fallback user multiples pregntas`, err );
    return;
  }
} );

export { detectarMensajeMultiplesPreguntas, fallbackMensajeMultiplesUser };

