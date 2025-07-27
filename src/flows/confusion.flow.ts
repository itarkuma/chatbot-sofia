import { addKeyword, EVENTS } from '@builderbot/bot';
import { preprocessPregunta } from '../lib/utils/preprocessinText';
import { generateTimer } from '../lib/utils/generateTimer';
import { askSofia } from '../scripts/query';
import { esComparacionGrabadoVsVivo } from '../lib/utils/esComparacionGrabadoVsVivo';

const detectflowConfusion = ( query: string, seccionActual: string ): boolean => {

  const texto = preprocessPregunta( query );

  if ( /grabado|en vivo|miami|santiago/.test( texto ) ) {
    return false; // ya es específico
  }

  const frasesExactas = [
    "curso online",
    "el curso online",
    "info curso online",
    "informacion curso online",
    "información sobre el curso online",
    "información del curso online",
    "info sobre el curso online",
    "tienen curso online",
    "tenéis curso online",
    "tenes curso online",
    "tiene curso online",
    "hay curso online",
    "ofrecen curso online"
  ];

  const patrones = [
    /(informaci[oó]n|info).*curso online/,
    /curso online.*(informaci[oó]n|info)/,
    /(tienen|tiene|hay|dan|ofrecen).*curso online/,
    /me.*interesa.*curso online/,
    /quisiera.*curso online/,
    /quiero.*curso online/,
    /saber.*curso online/,
    /sobre.*curso online/,
    /^curso online\??$/
  ];

  return frasesExactas.includes( texto ) || patrones.some( p => p.test( texto ) );

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