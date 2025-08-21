import { addKeyword, EVENTS } from '@builderbot/bot';
import { preprocessPregunta } from '../lib/utils/preprocessinText';
import { generateTimer } from '../lib/utils/generateTimer';
import { askSofia } from '../scripts/query';


const flowDespedida = addKeyword( EVENTS.ACTION ).addAction( async ( ctx, { state, flowDynamic, extensions } ) => {
  try {
    console.log( 'flow despedida' );

    //    await state.clear(); // Limpiar la sección previa
    await state.update( { seccionActual: '' } );
    const seccion = await state.get( 'seccionActual' );

    const { texto, origen, chunkId } = await askSofia( preprocessPregunta( ctx.body ), seccion, 'despedida' );

    await flowDynamic( [ { body: texto, delay: generateTimer( 150, 250 ) } ] );
    console.log( { origen, chunkId } );


  } catch ( err ) {
    console.log( `[ERROR]: en el flujo despedida`, err );
    return;
  }
} );

export { flowDespedida };