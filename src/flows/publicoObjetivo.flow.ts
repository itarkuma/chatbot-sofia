import { addKeyword, EVENTS } from '@builderbot/bot';
import { preprocessPregunta } from '../lib/utils/preprocessinText';
import { generateTimer } from '../lib/utils/generateTimer';
import { askSofia } from '../scripts/query';




const flowPublicoObjetivo = addKeyword( EVENTS.ACTION ).addAction( async ( ctx, { state, flowDynamic } ) => {
  try {
    console.log( 'flow Publico Objetivo' );
    const seccion = await state.get( 'seccionActual' );

    const { texto, origen, chunkId } = await askSofia( preprocessPregunta( ctx.body ), seccion, 'publico_objetivo' );

    await state.update( { seccionActual: seccion } );
    await flowDynamic( [ { body: texto, delay: generateTimer( 150, 250 ) } ] );
    console.log( { origen, chunkId } );


  } catch ( err ) {
    console.log( `[ERROR]: en el flujo Publico Objetivo`, err );
    return;
  }
} );

export { flowPublicoObjetivo };