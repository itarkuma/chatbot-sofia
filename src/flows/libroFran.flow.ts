import { addKeyword, EVENTS } from '@builderbot/bot';
import { preprocessPregunta } from '../lib/utils/preprocessinText';
import { generateTimer } from '../lib/utils/generateTimer';
import { askSofia } from '../scripts/query';

const detectflowLibroFran = ( query: string, seccionActual: string ): boolean => {
  const libroFranTriggers = [
    "Libro de Fran Fialli  ",
    "5", // número
    /fran.*libro/,
    /empezar.*aprender.*trading/,
    /material.*escrito/,
    /libro.*recom/i,
    /libro.*principiante/,
    /comprar.*libro.*fran/,
    /libro\s+fran/,
    /ebook/,
    /libro.*empezar/,
    /conseguir.*libro/,
    /material.*novatos?/,
    /leer.*trading/,
    /venden.*libro.*fran/
  ];
  const texto = preprocessPregunta( query );

  return libroFranTriggers.some( trigger => {
    if ( typeof trigger === "string" ) {
      return texto === trigger; // coincidencia exacta
    }
    if ( trigger instanceof RegExp ) {
      return trigger.test( texto ); // coincidencia por patrón
    }
    return false;
  } );

};

const flowLibroFran = addKeyword( EVENTS.ACTION ).addAction( async ( ctx, { state, flowDynamic, extensions } ) => {
  try {

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
