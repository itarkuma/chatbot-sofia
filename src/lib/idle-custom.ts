import { EVENTS, addKeyword } from '@builderbot/bot';
import { BotContext, TFlow } from '@builderbot/bot/dist/types';
import { askSofia } from '../scripts/query';
// Object to store timers for each user
const timers = {};

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
const start = ( ctx: BotContext, gotoFlow: ( a: TFlow ) => Promise<void>, ms: number ) => {
  timers[ ctx.from ] = setTimeout( () => {
    console.log( `User timeout: ${ ctx.from }` );
    return gotoFlow( idleFlow );
  }, ms );
};

// Function to reset the inactivity timer for a user
const reset = ( ctx: BotContext, gotoFlow: ( a: TFlow ) => Promise<void>, ms: number ) => {
  stop( ctx );
  if ( timers[ ctx.from ] ) {
    console.log( `reset countdown for the user: ${ ctx.from }` );
    clearTimeout( timers[ ctx.from ] );
  }
  start( ctx, gotoFlow, ms );
};

// Function to stop the inactivity timer for a user
const stop = ( ctx: BotContext ) => {
  if ( timers[ ctx.from ] ) {
    clearTimeout( timers[ ctx.from ] );
  }
};

export {
  start,
  reset,
  stop,
  idleFlow,
};
