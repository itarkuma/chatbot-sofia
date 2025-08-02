import { addKeyword, EVENTS } from '@builderbot/bot';
import { preprocessPregunta } from '../lib/utils/preprocessinText';
import { generateTimer } from '../lib/utils/generateTimer';
import { askSofia } from '../scripts/query';
import { removeAccents } from '../lib/utils/removeAccents';

const detectflowConsultasGenerales = ( query: string, seccionActual: string ): boolean => {
  const texto = preprocessPregunta( query );
  const textoNormalizado = removeAccents( texto.toLowerCase() );

  const consultasGeneralesTriggers = [
    "consultas generales",
    "7",
    /quien\s+es\s+fran\s+fialli/,
    /por\s+que\s+deber[ií]a\s+confiar/,
    /que\s+respaldo\s+tienen?/,
    /esto\s+es\s+serio/,
    /otro\s+curso\s+mas/
  ];

  return consultasGeneralesTriggers.some( trigger => {
    if ( typeof trigger === "string" ) {
      return textoNormalizado === trigger; // coincidencia exacta
    }
    if ( trigger instanceof RegExp ) {
      return trigger.test( textoNormalizado ); // coincidencia por patrón
    }
    return false;
  } );

};

const flowConsultasGenerales = addKeyword( EVENTS.ACTION ).addAction( async ( ctx, { state, flowDynamic, extensions } ) => {
  try {
    console.log( 'flow consultas generales' );
    //    await state.update( { seccionActual: 'soporte_general' } );
    const seccion = await state.get( 'seccionActual' );

    const { texto, origen, chunkId } = await askSofia( preprocessPregunta( '¿Qué puedo hacer desde cero?' ), seccion );

    await flowDynamic( [ { body: texto, delay: generateTimer( 150, 250 ) } ] );
    const textomsm = "❓ *¿Tienes alguna otra duda?* Escríbemelo aquí y estaré encantada de ayudarte.";
    await flowDynamic( [ { body: textomsm, delay: generateTimer( 150, 250 ) } ] );
    console.log( { origen, chunkId } );


  } catch ( err ) {
    console.log( `[ERROR]: en el flujo Consultas generales`, err );
    return;
  }
} );

export { detectflowConsultasGenerales, flowConsultasGenerales };