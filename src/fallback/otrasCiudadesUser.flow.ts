import { addKeyword, EVENTS } from '@builderbot/bot';
import { preprocessPregunta } from '../lib/utils/preprocessinText';
import { generateTimer } from '../lib/utils/generateTimer';
import { askSofia } from '../scripts/query';

const detectOtrasCiudadesUser = ( query: string ): boolean => {
  const texto = preprocessPregunta( query ); // Normaliza: minúsculas, sin tildes, trim

  const confusionTriggers: ( string | RegExp )[] = [

    // Confusión
    "haran cursos en mexico",
    "tienen planeado ir a colombia",
    "cuando vienen a argentina",
    "tienen pensado hacer cursos en otros paises",
    "van a estar en latinoamerica",
    "habra cursos en mi ciudad",
    "van a recorrer mas sitios",
    "donde mas haran los cursos presenciales",
    "tienen agenda internacional",
    "vendran a otros lugares en el futuro"
  ];

  return confusionTriggers.some( trigger => {
    if ( typeof trigger === "string" ) {
      return texto.includes( trigger );
    }
    if ( trigger instanceof RegExp ) {
      return trigger.test( query ); // usamos el texto original para los emojis
    }
    return false;
  } );
};

const fallbackOtrasCiudadesUser = addKeyword( EVENTS.ACTION ).addAction( async ( ctx, { state, flowDynamic, extensions } ) => {
  try {
    console.log( 'fallback -> OtrasCiudadesUser' );

    const seccion = await state.get( 'seccionActual' );

    const { texto, origen, chunkId } = await askSofia( preprocessPregunta( ctx.body ), seccion, 'user_otrasciudades' );

    await flowDynamic( [ { body: texto, delay: generateTimer( 150, 250 ) } ] );
    console.log( { origen, chunkId } );


  } catch ( err ) {
    console.log( `[ERROR]: en el flujo fallback user otras ciudades`, err );
    return;
  }
} );

export { detectOtrasCiudadesUser, fallbackOtrasCiudadesUser };

