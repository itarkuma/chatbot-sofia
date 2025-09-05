import { EVENTS, addKeyword } from '@builderbot/bot';
import { BotContext, TFlow } from '@builderbot/bot/dist/types';
import { askSofia } from '../scripts/query';
// Object to store timers for each user
const timers = {};

// Flow para mensaje intermedio de 15 minutos
const midFlow = addKeyword( EVENTS.ACTION ).addAction(
  async ( _, { flowDynamic } ) => {
    await flowDynamic( `📩 Si surge alguna otra consulta, estoy a su disposición.  
Recuerde que puede escribir *“menú”* para volver al inicio y revisar el contenido completo.`);
  }
);

// Flow for handling inactivity
const idleFlow = addKeyword( EVENTS.ACTION ).addAction(
  async ( _, { flowDynamic, endFlow } ) => {
    await flowDynamic( `📊 *¡Queremos saber cómo te fue!*
Del *1 al 5*, ¿cómo calificarías la atención que recibiste?

(*1* = Muy insatisfecho 😕 / *5* = Muy satisfecho 🤩)

Tu opinión nos ayuda a mejorar 💬 ¡Gracias por tu tiempo!`);

  }
).addAction( { capture: true }, async ( ctx, { endFlow, flowDynamic, state } ) => {
  //  await state.udpate( { name: ctx.body } );

  const pregunta = ctx.body;
  if ( pregunta === '1' || pregunta === '2' || pregunta === '3' || pregunta === '4' || pregunta === '5' ) {

    console.log( 'chunk respuesta valoracion texto ingresado fijo' );
    return endFlow( "Gracias por tu valoración 🌟" );
  } else {
    const seccion = await state.get( 'seccionActual' );
    const { texto, origen, chunkId } = await askSofia( ctx.body, seccion );
    await flowDynamic( texto );
    console.log( { origen, chunkId } );
    console.log( 'chunk respuesta valoracion ia' );

  }

} )
  ;


// Function to start the inactivity timer for a user
const start = ( ctx: BotContext, gotoFlow: ( a: TFlow ) => Promise<void>,
  msMid: number,
  msFinal: number
) => {

  // Limpio timers previos
  stop( ctx );

  timers[ ctx.from ] = {
    mid: setTimeout( () => {
      console.log( `User mid-timeout: ${ ctx.from }` );
      gotoFlow( midFlow );
    }, msMid ),

    // Timer de 1 hora (mensaje encuesta)
    final: setTimeout( () => {
      console.log( `User final-timeout: ${ ctx.from }` );
      gotoFlow( idleFlow );
    }, msFinal ),
  };
};

// Function to reset the inactivity timer for a user
const reset = ( ctx: BotContext, gotoFlow: ( a: TFlow ) => Promise<void>,
  msMid: number,
  msFinal: number
) => {

  if ( timers[ ctx.from ] ) {
    console.log( `reset countdown for the user: ${ ctx.from }` );
    clearTimeout( timers[ ctx.from ] );
  }
  stop( ctx );
  start( ctx, gotoFlow, msMid, msFinal );
};

// Function to stop the inactivity timer for a user
const stop = ( ctx: BotContext ) => {
  if ( timers[ ctx.from ] ) {
    if ( timers[ ctx.from ].mid ) clearTimeout( timers[ ctx.from ].mid );
    if ( timers[ ctx.from ].final ) clearTimeout( timers[ ctx.from ].final );
    delete timers[ ctx.from ];
  }
};

export {
  start,
  reset,
  stop,
  idleFlow,
  midFlow,
};
