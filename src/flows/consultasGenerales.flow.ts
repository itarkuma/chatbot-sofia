import { addKeyword, EVENTS } from '@builderbot/bot';
import { preprocessPregunta } from '../lib/utils/preprocessinText';
import { generateTimer } from '../lib/utils/generateTimer';
import { askSofia } from '../scripts/query';

const detectflowConsultasGenerales = ( query: string, seccionActual: string ): boolean => {
  const consultasGeneralesTriggers = [
    "consultas generales",
    "7",
    /quien\s+es\s+fran\s+fialli/,
    /por\s+que\s+deber[ií]a\s+confiar/,
    /que\s+respaldo\s+tienen?/,
    /esto\s+es\s+serio/,
    /otro\s+curso\s+mas/
  ];
  const texto = preprocessPregunta( query );

  return consultasGeneralesTriggers.some( trigger => {
    if ( typeof trigger === "string" ) {
      return texto === trigger; // coincidencia exacta
    }
    if ( trigger instanceof RegExp ) {
      return trigger.test( texto ); // coincidencia por patrón
    }
    return false;
  } );

};

const flowConsultasGenerales = addKeyword( EVENTS.ACTION ).addAction( async ( ctx, { state, flowDynamic, extensions } ) => {
  try {
    await state.update( { seccionActual: 'soporte_general' } );
    const seccion = await state.get( 'seccionActual' );

    const { texto, origen, chunkId } = await askSofia( preprocessPregunta( '¿Quién es Fran Fialli?' ), seccion );

    await flowDynamic( [ { body: texto, delay: generateTimer( 150, 250 ) } ] );
    console.log( { origen, chunkId } );


  } catch ( err ) {
    console.log( `[ERROR]: en el flujo Consultas generales`, err );
    return;
  }
} );

export { detectflowConsultasGenerales, flowConsultasGenerales };