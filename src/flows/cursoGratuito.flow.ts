import { addKeyword, EVENTS } from '@builderbot/bot';
import { preprocessPregunta } from '../lib/utils/preprocessinText';
import { generateTimer } from '../lib/utils/generateTimer';
import { askSofia } from '../scripts/query';
import { removeAccents } from '../lib/utils/removeAccents';
import { log } from 'console';

const detectflowCursorGratuito = ( query: string, seccionActual: string ): boolean => {
  const texto = preprocessPregunta( query );
  const textoNormalizado = removeAccents( texto.toLowerCase() );

  const cursoGratuitoTriggers = [
    "curso gratuito por email",
    //    "5", // número
    /\balgo\s+gratuito\b/,
    /\bempezar.*sin\s+pagar\b/,
    /\bprobar.*antes.*inscribirme\b/,
    /\bofrecen.*recursos.*sin\s+costo\b/,
    /\bcurso.*principiantes\b/,
    /\balgo\s+gratis\b/,
    /\bprobar.*sin\s+pagar\b/,
    /\bcurso.*sin\s+coste\b/,
    /\balgo.*novatos\b/,
    /\brecursos\s+de\s+prueba\b/,
    /\binteresa.*aprender.*no\s+gastar\b/,
    /\bempezar.*b[aá]sico\b/
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
    console.log( 'flow curso gratuito' );
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