import { addKeyword, EVENTS } from '@builderbot/bot';
import { preprocessPregunta } from '../lib/utils/preprocessinText';
import { generateTimer } from '../lib/utils/generateTimer';
import { askSofia } from '../scripts/query';


const flowPresencial = addKeyword( EVENTS.ACTION ).addAction( async ( ctx, { state, flowDynamic, extensions } ) => {
  try {
    console.log( 'flow curso presencial' );

    //    await state.clear(); // Limpiar la sección previa
    await state.update( { seccionActual: '' } );
    const seccion = await state.get( 'seccionActual' );

    const { texto, origen, chunkId } = await askSofia( preprocessPregunta( ctx.body ), seccion, 'curso_presencial' );

    await flowDynamic( [ { body: texto, delay: generateTimer( 150, 250 ) } ] );
    console.log( { origen, chunkId } );


  } catch ( err ) {
    console.log( `[ERROR]: en el flujo curso presencial`, err );
    return;
  }
} ).addAction( { capture: true }, async ( ctx, { flowDynamic, state } ) => {
  //  await state.udpate( { name: ctx.body } );
  const seccion = await state.get( 'seccionActual' );
  const pregunta = preprocessPregunta( ctx.body );
  if ( pregunta === 'miami' ) {
    await state.update( { seccionActual: 'formacion_miami' } );
    //const { texto, origen, chunkId } = await askSofia( "informacion del curso miami", seccion );
    const { texto, origen, chunkId } = await askSofia( preprocessPregunta( ctx.body ), seccion, 'formacion_miami' );
    await flowDynamic( [ { body: texto, delay: generateTimer( 150, 250 ) } ] );
    await flowDynamic( [ { body: "¿Le gustaría ver el *temario completo* o un *resumen* con los principales detalles?", delay: generateTimer( 150, 250 ) } ] );
    console.log( { origen, chunkId } );
  } else {
    if ( pregunta === "santiago de compostela" || pregunta === "santiago" || pregunta === "santiago compostela" ) {
      await state.update( { seccionActual: 'formacion_santiago' } );
      const { texto, origen, chunkId } = await askSofia( preprocessPregunta( ctx.body ), seccion, 'formacion_santiago' );
      await flowDynamic( [ { body: texto, delay: generateTimer( 150, 250 ) } ] );
      await flowDynamic( [ { body: "¿Le gustaría ver el *temario completo* o un *resumen* con los principales detalles?", delay: generateTimer( 150, 250 ) } ] );
      console.log( { origen, chunkId } );
    } else {
      const { texto, origen, chunkId } = await askSofia( preprocessPregunta( ctx.body ), seccion );
      await flowDynamic( [ { body: texto, delay: generateTimer( 150, 250 ) } ] );
      console.log( { origen, chunkId } );
    }
  }

} )
  ;

export { flowPresencial };