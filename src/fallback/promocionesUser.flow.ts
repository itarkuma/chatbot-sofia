import { addKeyword, EVENTS } from '@builderbot/bot';
import { preprocessPregunta } from '../lib/utils/preprocessinText';
import { generateTimer } from '../lib/utils/generateTimer';
import { askSofia } from '../scripts/query';

const detectPromocionesUser = ( query: string ): boolean => {
  const texto = preprocessPregunta( query ); // Normaliza: minúsculas, sin tildes, trim

  const confusionTriggers: ( string | RegExp )[] = [

    // Confusión
    "hay alguna promocion ahora",
    "tienen descuentos activos",
    "hay oferta por tiempo limitado",
    "puedo acceder con un cup",
    "hay alguna rebaja si me inscribo hoy",
    "tienen precio especial para nuevos alumnos",
    "esta en promocion esta semana",
    "ofrecen algun tipo de beca",
    "hay descuentos por pagar en una sola vez",
    "hacen ofertas en ciertas fechas",
    "puedo conseguir mejor precio"

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

const fallbackPromocionesUser = addKeyword( EVENTS.ACTION ).addAction( async ( ctx, { state, flowDynamic, extensions } ) => {
  try {
    console.log( 'fallback -> PromocionesUser' );

    const seccion = await state.get( 'seccionActual' );

    const { texto, origen, chunkId } = await askSofia( preprocessPregunta( ctx.body ), seccion, 'user_promocion' );

    await flowDynamic( [ { body: texto, delay: generateTimer( 150, 250 ) } ] );
    console.log( { origen, chunkId } );


  } catch ( err ) {
    console.log( `[ERROR]: en el flujo fallback user promocion`, err );
    return;
  }
} );

export { detectPromocionesUser, fallbackPromocionesUser };

