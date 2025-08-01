import { addKeyword, EVENTS } from '@builderbot/bot';
import { preprocessPregunta } from '../lib/utils/preprocessinText';
import { generateTimer } from '../lib/utils/generateTimer';
import { askSofia } from '../scripts/query';
import { removeAccents } from '../lib/utils/removeAccents';

const detectflowLibroFran = ( query: string, seccionActual: string ): boolean => {
  const texto = preprocessPregunta( query );
  const textoNormalizado = removeAccents( texto.toLowerCase() );
  const libroFranTriggers = [
    "Libro de Fran Fialli  ",
    "5", // número
    /\bfran.*libro\b/,
    //    /\bempezar.*aprender.*trading\b/,
    /\bmaterial.*escrito\b/,
    /\blibro.*recom\b/i,
    /\blibro.*principiante\b/,
    /\bcomprar.*libro.*fran\b/,
    /\blibro\s+fran\b/,
    /\bebook\b/,
    /\blibro.*empezar\b/,
    /\bconseguir.*libro\b/,
    /\bmaterial.*novatos?\b/,
    //    /\bleer.*trading\b/,
    /\bvenden.*libro.*fran\b/
  ];

  return libroFranTriggers.some( trigger => {
    if ( typeof trigger === "string" ) {
      return textoNormalizado === trigger; // coincidencia exacta
    }
    if ( trigger instanceof RegExp ) {
      return trigger.test( textoNormalizado ); // coincidencia por patrón
    }
    return false;
  } );

};

const flowLibroFran = addKeyword( EVENTS.ACTION ).addAction( async ( ctx, { state, flowDynamic, extensions } ) => {
  try {
    console.log( 'flow libro fran' );
    const seccion = await state.get( 'seccionActual' );

    const { texto, origen, chunkId } = await askSofia( preprocessPregunta( ctx.body ), seccion, 'libro_fran' );

    await flowDynamic( [ { body: texto, delay: generateTimer( 150, 250 ) } ] );
    console.log( { origen, chunkId } );


  } catch ( err ) {
    console.log( `[ERROR]: en el flujo Libro Fran`, err );
    return;
  }
} );

export { detectflowLibroFran, flowLibroFran };
