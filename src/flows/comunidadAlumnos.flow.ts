import { addKeyword, EVENTS } from '@builderbot/bot';
import { preprocessPregunta } from '../lib/utils/preprocessinText';
import { generateTimer } from '../lib/utils/generateTimer';
import { askSofia } from '../scripts/query';
import { removeAccents } from '../lib/utils/removeAccents';

const detectflowComunidadAlumno = ( query: string, seccionActual: string ): boolean => {
  const texto = preprocessPregunta( query );
  const textoNormalizado = removeAccents( texto.toLowerCase() );

  const comunidadAlumnoTriggers = [
    "comunidad de alumnos",
    //    "7",
    /grupo.*alumnos/,
    /tienen.*comunidad.*compartir/,
    /hablar.*otros.*alumnos/,
    /grupo.*telegram/,
    /compartir.*analisis.*otros/,
    /telegram.*alumnos/,
    /comunidad.*alumnos.*curso/,
    /chat.*alumnos/,
    /grupo.*para.*alumnos/,
    /unirme.*comunidad.*alumnos/
  ];

  return comunidadAlumnoTriggers.some( trigger => {
    if ( typeof trigger === "string" ) {
      return textoNormalizado === trigger; // coincidencia exacta
    }
    if ( trigger instanceof RegExp ) {
      return trigger.test( textoNormalizado ); // coincidencia por patrón
    }
    return false;
  } );

};

const flowComunidadAlumno = addKeyword( EVENTS.ACTION ).addAction( async ( ctx, { state, flowDynamic, extensions } ) => {
  try {

    const seccion = await state.get( 'seccionActual' );

    const { texto, origen, chunkId } = await askSofia( preprocessPregunta( ctx.body ), seccion, 'comunidad_alumnos' );

    await flowDynamic( [ { body: texto, delay: generateTimer( 150, 250 ) } ] );
    console.log( { origen, chunkId } );


  } catch ( err ) {
    console.log( `[ERROR]: en el flujo comunidad Alumno`, err );
    return;
  }
} );

export { detectflowComunidadAlumno, flowComunidadAlumno };