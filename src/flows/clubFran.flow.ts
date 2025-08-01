import { addKeyword, EVENTS } from '@builderbot/bot';
import { preprocessPregunta } from '../lib/utils/preprocessinText';
import { generateTimer } from '../lib/utils/generateTimer';
import { askSofia } from '../scripts/query';
import { removeAccents } from '../lib/utils/removeAccents';

const detectflowClubFran = ( query: string, seccionActual: string ): boolean => {
  const texto = preprocessPregunta( query );
  const textoNormalizado = removeAccents( texto.toLowerCase() );

  const clubFranTriggers = [
    "club fran fialli",
    "9",
    /que\s+es\s+el\s+club\s+fran\s+fialli/,
    /club\s+fran/,
    /comunidad.*fran.*fialli/,
    /comunidad.*seguir.*aprendiendo/,
    /ya.*hice.*curso.*seguir.*avanzando/,
    /contenidos?.*mas.*avanzados?/,
    /donde.*practicar.*aprendido/,
    /donde.*aplico.*aprendi/,
    /mas.*nivel.*despues.*curso/,
    /algo.*mas.*avanzado/,
    /quede.*ganas.*mas/,
    /hay.*algo.*despues.*curso/,
    /como.*sigo.*aprendiendo.*ustedes/
  ];

  return clubFranTriggers.some( trigger => {
    if ( typeof trigger === "string" ) {
      return textoNormalizado === trigger; // coincidencia exacta
    }
    if ( trigger instanceof RegExp ) {
      return trigger.test( textoNormalizado ); // coincidencia por patrón
    }
    return false;
  } );

};

const flowClubFran = addKeyword( EVENTS.ACTION ).addAction( async ( ctx, { state, flowDynamic, extensions } ) => {
  try {

    const seccion = await state.get( 'seccionActual' );

    const { texto, origen, chunkId } = await askSofia( preprocessPregunta( ctx.body ), seccion, 'club_fran' );

    await flowDynamic( [ { body: texto, delay: generateTimer( 150, 250 ) } ] );
    console.log( { origen, chunkId } );


  } catch ( err ) {
    console.log( `[ERROR]: en el flujo club fran`, err );
    return;
  }
} );

export { detectflowClubFran, flowClubFran };
