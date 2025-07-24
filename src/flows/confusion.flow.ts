import { addKeyword, EVENTS } from '@builderbot/bot';
import { preprocessPregunta } from '../lib/utils/preprocessinText';
import { generateTimer } from '../lib/utils/generateTimer';
import { askSofia } from '../scripts/query';
import { esComparacionGrabadoVsVivo } from '../lib/utils/esComparacionGrabadoVsVivo';

const detectflowConfusion = ( query: string, seccionActual: string ): boolean => {

  const texto = preprocessPregunta( query );

  const frasesExactas = [
    "curso online",
    "tienen curso online",
    "tenéis curso online",
    "tenes curso online",
    "tiene curso online",
    "el curso online",
    "hay curso online",
    "ofrecen curso online"
  ];

  if ( frasesExactas.includes( texto ) ) {
    return true;
  }

  // Regex para detectar frases muy cortas que solo pregunten si existe
  const patronCorto = /^(ten[eé]is|ten[eé]s|tienen|hay|ofrec[eé]n|tiene)?\s*(el\s+)?curso\s+online\??$/;
  return patronCorto.test( texto );

};

const flowConfusion = addKeyword( EVENTS.ACTION ).addAction( async ( ctx, { state, flowDynamic } ) => {
  try {
    console.log( 'flow confusion' );
    await state.update( { estaconfundido_answer: true } );
    const seccion = await state.get( 'seccionActual' );

    const texto = "¿Podrías confirmarme si te refieres al Curso Grabado o al Curso en vivo con Fran?\nAmbos se realizan en modalidad online, pero tienen características diferentes. Así podré darte una respuesta más precisa. 😊";

    await flowDynamic( [ { body: texto, delay: generateTimer( 150, 250 ) } ] );
    console.log( 'texto ingresado fijo' );


  } catch ( err ) {
    console.log( `[ERROR]: en el flujo confusion`, err );
    return;
  }
} );

export { detectflowConfusion, flowConfusion };