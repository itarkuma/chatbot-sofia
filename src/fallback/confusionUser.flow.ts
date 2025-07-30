import { addKeyword, EVENTS } from '@builderbot/bot';
import { preprocessPregunta } from '../lib/utils/preprocessinText';
import { generateTimer } from '../lib/utils/generateTimer';
import { askSofia } from '../scripts/query';

const detectConfusionUser = ( query: string ): boolean => {
  const texto = preprocessPregunta( query ); // Normaliza: minúsculas, sin tildes, trim

  const confusionTriggers: ( string | RegExp )[] = [
    // Confusión
    "que",
    "como",
    "no entiendo",
    "me puedes repetir eso",
    "no te sigo",
    "que quisiste decir",
    "eh",
    "perdona",
    "no me queda claro",

    // Desorientación o falta de guía
    "que opciones hay",
    "no se que escribir",
    "muestra el menu",
    "que teneis",
    "seguimos sin entendernos",
    "puedes guiarme",
    "no encuentro la informacion",

    // Frustración o preferencia por humano
    "esto no ayuda",
    "me puedes pasar con alguien",
    "prefiero hablar con una persona",
    "no me estas entendiendo",
    "ya no quiero hablar con la maquina",
    "quiero atencion humana",
    "puedo hablar con alguien real",
    "basta de ia",


    // Nuevas frases más flexibles
    /no\s+me\s+ayuda/,
    /no\s+ayuda/,
    /no\s+sirve/,
    /esto\s+no\s+sirve/,
    /no\s+me\s+sirve/,
    /no\s+me\s+estas\s+ayudando/,

    // Emojis o símbolos de confusión o molestia
    /😕/,
    /❓/,
    /😠/,
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

const fallbackConfusionUser = addKeyword( EVENTS.ACTION ).addAction( async ( ctx, { state, flowDynamic, extensions } ) => {
  try {

    const seccion = await state.get( 'seccionActual' );
    let contador = await state.get( 'estado_confucion' );
    if ( contador === 0 ) { contador = 1; await state.update( { estado_confucion: '1' } ); }
    if ( contador === 1 ) { contador = 2; await state.update( { estado_confucion: '2' } ); }

    const { texto, origen, chunkId } = await askSofia( preprocessPregunta( ctx.body ), seccion, 'esta_confuso_' + contador );

    await flowDynamic( [ { body: texto, delay: generateTimer( 150, 250 ) } ] );
    console.log( { origen, chunkId } );


  } catch ( err ) {
    console.log( `[ERROR]: en el flujo fallback confuscion user`, err );
    return;
  }
} );

export { detectConfusionUser, fallbackConfusionUser };

