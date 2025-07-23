import { addKeyword, EVENTS } from '@builderbot/bot';
import { preprocessPregunta } from '../lib/utils/preprocessinText';
import { generateTimer } from '../lib/utils/generateTimer';
import { askSofia } from '../scripts/query';
import { registerAlumno } from '../flows/registerAlumno.flow';

const detectflowsoyAlumno = ( query: string, seccionActual: string ): boolean => {
  const cursoGratuitoTriggers = [
    "Ya soy alumno/a  ",
    "6", // número
    /soy\s+alumn[oa]/,
    /ya\s+hice\s+el\s+curso/,
    /tengo\s+acceso\s+al\s+aula\s+virtual/,
    /hice\s+la\s+masterclass/,
    /estuve\s+en\s+una\s+edicion\s+anterior/,
    /estoy\s+inscrit[oa]\s+en\s+el\s+curso/,
    /fui\s+alumno\s+de\s+fran\s+fialli/,
    /asisti\s+a\s+su\s+curso\s+de\s+trading/,
    /realice\s+el\s+curso\s+con\s+fran\s+fialli/
  ];
  const texto = preprocessPregunta( query );

  return cursoGratuitoTriggers.some( trigger => {
    if ( typeof trigger === "string" ) {
      return texto === trigger; // coincidencia exacta
    }
    if ( trigger instanceof RegExp ) {
      return trigger.test( texto ); // coincidencia por patrón
    }
    return false;
  } );

};

const flowSoyAlumno = addKeyword( EVENTS.ACTION ).addAction( async ( ctx, { state, gotoFlow, flowDynamic, extensions } ) => {
  try {

    const seccion = await state.get( 'seccionActual' );
    const isAlumno = await state.get( 'isAlumnoRegistrado' );
    const isAlumnoMiami = await state.get( 'isAlumnoRegistradoMiami' );
    const isAlumnoSantiago = await state.get( 'isAlumnoRegistradoSantiago' );
    const isAlumnoGrabado = await state.get( 'isAlumnoRegistradoGrabado' );

    if ( isAlumno ) {
      if ( isAlumnoMiami ) {
        const { texto, origen, chunkId } = await askSofia( preprocessPregunta( ctx.body ), seccion, 'soy_alumno_miami' );
        await flowDynamic( [ { body: texto, delay: generateTimer( 150, 250 ) } ] );
        console.log( { origen, chunkId } );
      }
      if ( isAlumnoSantiago ) {
        const { texto, origen, chunkId } = await askSofia( preprocessPregunta( ctx.body ), seccion, 'soy_alumno_santiago' );
        await flowDynamic( [ { body: texto, delay: generateTimer( 150, 250 ) } ] );
        console.log( { origen, chunkId } );
      }
      if ( isAlumnoGrabado ) {
        const { texto, origen, chunkId } = await askSofia( preprocessPregunta( ctx.body ), seccion, 'soy_alumno_grabado' );
        await flowDynamic( [ { body: texto, delay: generateTimer( 150, 250 ) } ] );
        console.log( { origen, chunkId } );
      }

    } else {

      const { texto, origen, chunkId } = await askSofia( preprocessPregunta( ctx.body ), seccion, 'soy_alumno' );

      await flowDynamic( [ { body: texto, delay: generateTimer( 150, 250 ) } ] );
      console.log( { origen, chunkId } );

      if ( origen === 'soy_alumno' && chunkId === 'chunk_02' ) {
        return gotoFlow( registerAlumno );
      }
    }



  } catch ( err ) {
    console.log( `[ERROR]: en el flujo soy alumno`, err );
    return;
  }
} );

export { detectflowsoyAlumno, flowSoyAlumno };