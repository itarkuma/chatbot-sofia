import { addKeyword, EVENTS } from '@builderbot/bot';
import { preprocessPregunta } from '../lib/utils/preprocessinText';
import { generateTimer } from '../lib/utils/generateTimer';
import { askSofia } from '../scripts/query';
import { esComparacionGrabadoVsVivo } from '../lib/utils/esComparacionGrabadoVsVivo';
import { removeAccents } from '../lib/utils/removeAccents';

const detectflowConfusion = ( query: string, seccionActual: string ): boolean => {

  const texto = preprocessPregunta( query );
  const textoNormalizado = removeAccents( texto.toLowerCase() );

  // Paso 1: Revisar si el texto menciona "curso online"
  if ( /curso online/.test( textoNormalizado ) ) {

    // Paso 2: Revisar si se menciona alguna modalidad (grabado, en vivo, en directo)
    if ( !/(grabado|en vivo|en directo)/.test( textoNormalizado ) ) {
      console.log( `⚠️ Confusión detectada: Mención de "curso online" sin modalidad especificada.` );
      return true;  // Confusión detectada, no se especificó modalidad
    }
  }

  // Si se menciona modalidad, o no se menciona "curso online", no hay confusión
  return false;
};

const flowConfusion = addKeyword( EVENTS.ACTION ).addAction( async ( ctx, { state, flowDynamic } ) => {
  try {
    console.log( 'flow confusion anwser -> no sabe si online o grabado' );
    await state.update( { estaconfundido_answer: true } );
    const seccion = await state.get( 'seccionActual' );

    const texto = "¿Podrías confirmarme si te refieres al *Curso Grabado* o al *Curso en vivo* con Fran?\nAmbos se realizan en modalidad online, pero tienen características diferentes. Así podré darte una respuesta más precisa. 😊";

    await flowDynamic( [ { body: texto, delay: generateTimer( 150, 250 ) } ] );
    console.log( 'chunk texto ingresado fijo' );


  } catch ( err ) {
    console.log( `[ERROR]: en el flujo confusion chunk ingresado fijo`, err );
    return;
  }
} );

export { detectflowConfusion, flowConfusion };