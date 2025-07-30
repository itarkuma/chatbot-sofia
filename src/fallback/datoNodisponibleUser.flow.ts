import { addKeyword, EVENTS } from '@builderbot/bot';
import { preprocessPregunta } from '../lib/utils/preprocessinText';
import { generateTimer } from '../lib/utils/generateTimer';
import { askSofia } from '../scripts/query';

const detectDatoNodisponibleUser = ( query: string ): boolean => {
  const texto = preprocessPregunta( query ); // Normaliza: minúsculas, sin tildes, trim

  const confusionTriggers: ( string | RegExp )[] = [

    // Confusión
    "me puedes enviar el certificado por correo",
    "puedo inscribirme aunque este fuera de plazo",
    "como funciona el acceso desde otro pais",
    "me permiten cambiar de curso si ya pague",
    "puedo hablar con alguien sobre mi caso particular",
    "necesito una validacion especial",
    "ofrecen factura con mis datos fiscales",
    "como gestiono un problema con la plataforma",

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

const fallbackDatoNodisponibleUser = addKeyword( EVENTS.ACTION ).addAction( async ( ctx, { state, flowDynamic, extensions } ) => {
  try {
    console.log( 'fallback -> DatoNodisponibleUser' );

    const seccion = await state.get( 'seccionActual' );

    const { texto, origen, chunkId } = await askSofia( preprocessPregunta( ctx.body ), seccion, 'user_dato_nodisponible' );

    await flowDynamic( [ { body: texto, delay: generateTimer( 150, 250 ) } ] );
    console.log( { origen, chunkId } );


  } catch ( err ) {
    console.log( `[ERROR]: en el flujo fallback user dato nodisponible`, err );
    return;
  }
} );

export { detectDatoNodisponibleUser, fallbackDatoNodisponibleUser };

