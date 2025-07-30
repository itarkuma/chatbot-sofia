import { addKeyword, EVENTS } from '@builderbot/bot';
import { preprocessPregunta } from '../lib/utils/preprocessinText';
import { generateTimer } from '../lib/utils/generateTimer';
import { askSofia } from '../scripts/query';

const detectJavierNoRespondeUser = ( query: string ): boolean => {
  const texto = preprocessPregunta( query ); // Normaliza: minúsculas, sin tildes, trim

  const confusionTriggers: ( string | RegExp )[] = [

    // Confusión
    "cuando responde javier",
    "tarda mucho en contestar",
    "esta disponible ahora",
    "me hablara hoy mismo",
    "cuanto suele demorar javier",
    "javier responde rapido",
    "cuando me contacta javier",
    "en que momento responde javier"

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

const fallbackJavierNoRespondeUser = addKeyword( EVENTS.ACTION ).addAction( async ( ctx, { state, flowDynamic, extensions } ) => {
  try {

    const seccion = await state.get( 'seccionActual' );
    0;
    const { texto, origen, chunkId } = await askSofia( preprocessPregunta( ctx.body ), seccion, 'user_javiernoresponde' );

    await flowDynamic( [ { body: texto, delay: generateTimer( 150, 250 ) } ] );
    console.log( { origen, chunkId } );


  } catch ( err ) {
    console.log( `[ERROR]: en el flujo fallback user cuando respondera javier`, err );
    return;
  }
} );

export { detectJavierNoRespondeUser, fallbackJavierNoRespondeUser };

