import { addKeyword, EVENTS } from '@builderbot/bot';
import { preprocessPregunta } from '../lib/utils/preprocessinText';
import { generateTimer } from '../lib/utils/generateTimer';
import { askSofia } from '../scripts/query';

const detectflowMenu = ( query: string, seccionActual: string ): boolean => {
  const menuTriggers = [
    "menu",
    /muestra.*menu/,
    /ver.*opciones/,
    /que.*puedo.*hacer.*aqui/,
    /env[ií]ame.*listado/,
    /quiero.*comenzar/,
    /dame.*opciones/
  ];
  const texto = preprocessPregunta( query );

  return menuTriggers.some( trigger => {
    if ( typeof trigger === "string" ) {
      return texto === trigger; // coincidencia exacta
    }
    if ( trigger instanceof RegExp ) {
      return trigger.test( texto ); // coincidencia por patrón
    }
    return false;
  } );

};

const flowMenu = addKeyword( EVENTS.ACTION ).addAction( async ( ctx, { state, flowDynamic, extensions } ) => {
  try {
    //    await state.clear(); // Limpiar la sección previa
    await state.update( { seccionActual: '' } );
    const seccion = await state.get( 'seccionActual' );

    const { texto, origen, chunkId } = await askSofia( preprocessPregunta( ctx.body ), seccion, 'menu' );

    await flowDynamic( [ { body: texto, delay: generateTimer( 150, 250 ) } ] );
    console.log( { origen, chunkId } );


  } catch ( err ) {
    console.log( `[ERROR]: en el flujo comando menu`, err );
    return;
  }
} );

export { detectflowMenu, flowMenu };