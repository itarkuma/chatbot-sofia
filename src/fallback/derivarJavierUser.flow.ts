import { addKeyword, EVENTS } from '@builderbot/bot';
import { preprocessPregunta } from '../lib/utils/preprocessinText';
import { generateTimer } from '../lib/utils/generateTimer';
import { askSofia } from '../scripts/query';

import { fallbackconfirmarderivacionUser } from './confirmarDerivacionUser.flow';

const detectderivarJavierUser = ( query: string ): boolean => {
  const texto = preprocessPregunta( query ); // Normaliza: minúsculas, sin tildes, trim

  const confusionTriggers: ( string | RegExp )[] = [

    // Confusión
    "quiero hablar con javier",
    "hablar con javier",
    "hablar con javier gómez",
    "esta fran o javier",
    "pasame con un humano",
    "no quiero hablar con una ia",
    "necesito atencion personal",
    "puedo hablar con alguien real",
    "me puedes pasar con javier",
    "hay alguien que me atienda directamente",
    "prefiero que me escriba una persona",
    "quiero contacto directo",
    "puedo escribirle a javier",
    'hablar con alguien',
    'asesor',
    'quiero ayuda humana',
    'con javier',
    'javier gomez',
    'esto no me sirve',
    'agente',
    'esto es complicado',
    'necesito soporte'
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

const fallbackderiverJavierUser = addKeyword( EVENTS.ACTION ).addAction( async ( ctx, { state, gotoFlow, flowDynamic, extensions } ) => {
  try {

    const seccion = await state.get( 'seccionActual' );

    const { texto, origen, chunkId } = await askSofia( preprocessPregunta( ctx.body ), seccion, 'user_derivarjavier' );

    await flowDynamic( [ { body: texto, delay: generateTimer( 150, 250 ) } ] );
    console.log( { origen, chunkId } );

    return gotoFlow( fallbackconfirmarderivacionUser );

  } catch ( err ) {
    console.log( `[ERROR]: en el flujo fallback user derivar javier`, err );
    return;
  }
} );

export { detectderivarJavierUser, fallbackderiverJavierUser };

