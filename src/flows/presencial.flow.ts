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
} );

export { flowPresencial };