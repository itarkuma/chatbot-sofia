import { addKeyword, EVENTS } from '@builderbot/bot';
import { preprocessPregunta } from '../lib/utils/preprocessinText';
import { generateTimer } from '../lib/utils/generateTimer';
import { askSofia } from '../scripts/query';
import { removeAccents } from '../lib/utils/removeAccents';

const detectflowCursorGratuito = ( query: string, seccionActual: string ): boolean => {
  const texto = preprocessPregunta( query );
  const textoNormalizado = removeAccents( texto.toLowerCase() );

  const cursoGratuitoTriggers = [
    "curso gratuito por email",
    //    "5", // número
    /algo\s+gratuito/,
    /empezar.*sin\s+pagar/,
    /probar.*antes.*inscribirme/,
    /ofrecen.*recursos.*sin\s+costo/,
    /curso.*principiantes?/,
    /algo\s+gratis/,
    /probar.*sin\s+pagar/,
    /curso.*sin\s+coste/,
    /algo.*novatos?/,
    /recursos\s+de\s+prueba/,
    /interesa.*aprender.*no\s+gastar/,
    /empezar.*b[aá]sico/
  ];

  return cursoGratuitoTriggers.some( trigger => {
    if ( typeof trigger === "string" ) {
      return textoNormalizado === trigger; // coincidencia exacta
    }
    if ( trigger instanceof RegExp ) {
      return trigger.test( textoNormalizado ); // coincidencia por patrón
    }
    return false;
  } );

};

const flowCursoGratis = addKeyword( EVENTS.ACTION ).addAction( async ( ctx, { state, flowDynamic, extensions } ) => {
  try {

    const seccion = await state.get( 'seccionActual' );

    const { texto, origen, chunkId } = await askSofia( preprocessPregunta( ctx.body ), seccion, 'curso_gratis' );

    await flowDynamic( [ { body: texto, delay: generateTimer( 150, 250 ) } ] );
    console.log( { origen, chunkId } );


  } catch ( err ) {
    console.log( `[ERROR]: en el flujo Curso Gratuito`, err );
    return;
  }
} );

export { detectflowCursorGratuito, flowCursoGratis };