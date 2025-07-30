import { addKeyword, EVENTS } from '@builderbot/bot';
import { preprocessPregunta } from '../lib/utils/preprocessinText';
import { generateTimer } from '../lib/utils/generateTimer';
import { askSofia } from '../scripts/query';

const detectFormasdepagoUser = ( query: string ): boolean => {
  const texto = preprocessPregunta( query ); // Normaliza: minúsculas, sin tildes, trim

  const confusionTriggers: ( string | RegExp )[] = [

    // Confusión
    "puedo pagar con criptomonedas",
    "aceptan transferencia bancaria en argentina",
    "tienen metodos de pago alternativa",
    "puedo pagar desde el exterior",
    "tienen cuotas sin tarjeta",
    "aceptan pagos en efectivo",
    "puedo usar mercadopago o payoneer",
    "que formas de pago tienen disponibles en mi pais",
    "se puede pagar desde otro continente"
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

const fallbackFormasdepagoUser = addKeyword( EVENTS.ACTION ).addAction( async ( ctx, { state, flowDynamic, extensions } ) => {
  try {

    const seccion = await state.get( 'seccionActual' );

    const { texto, origen, chunkId } = await askSofia( preprocessPregunta( ctx.body ), seccion, 'user_formasdepago' );

    await flowDynamic( [ { body: texto, delay: generateTimer( 150, 250 ) } ] );
    console.log( { origen, chunkId } );


  } catch ( err ) {
    console.log( `[ERROR]: en el flujo fallback user formas de pago no registradas`, err );
    return;
  }
} );

export { detectFormasdepagoUser, fallbackFormasdepagoUser };

