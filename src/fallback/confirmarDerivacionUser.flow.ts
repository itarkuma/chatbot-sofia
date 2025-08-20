import { addKeyword, EVENTS } from '@builderbot/bot';
import { preprocessPregunta } from '../lib/utils/preprocessinText';
import { generateTimer } from '../lib/utils/generateTimer';
import { askSofia } from '../scripts/query';
import { distance } from 'fastest-levenshtein';

import { enviarDerivacionWhatsApp } from '../lib/utils/sendMessagewa';

const detectConfirmacionDerivacion = ( texto: string ): boolean => {
  const frasesBase = [
    'si',
    'si por favor',
    'adelante',
    'de acuerdo',
    'quiero que me contacten',
    'puedes avisarle ya',
    'necesito hablar con el',
    'si, pasame con el',
    'dile que me escriba',
    'quiero atencion de javier',
    'quiero que me responda javier',
    'prefiero que me ayude javier'
  ];

  const textoLimpio = preprocessPregunta( texto );
  for ( const frase of frasesBase ) {
    const dist = distance( textoLimpio, preprocessPregunta( frase ) );
    const maxLen = Math.max( textoLimpio.length, frase.length );
    const similitud = dist / maxLen;

    if ( similitud < 0.45 ) {
      console.log( `✅ flow user derivar javier: Confirmación proceder con derivación detectada con: "${ frase }" (dist: ${ dist }, %: ${ similitud.toFixed( 2 ) })` );
      return true;
    }
  }

  console.log( '❌ flow user derivar javier: No se detectó confirmación proceder  de derivación' );
  return false;
};

const fallbackconfirmarderivacionUser = addKeyword( EVENTS.ACTION )
  .addAnswer(
    [ 'Le pondré en contacto con *Javier Gómez*, nuestro asesor académico del equipo de Fran Fialli. ¿Desea que lo haga? 📩', '✅ *si*.', '❌ *no*.' ],
    { capture: true },

    async ( ctx, { flowDynamic, endFlow, state } ) => {
      if ( preprocessPregunta( ctx.body ) === 'no' ) {
        return endFlow( `ℹ️ Para ayudarle mejor, puedo mostrarle el menú principal. Solo debe escribir *MENÚ* o decirme qué tipo de información busca.` );
      } else {
        if ( preprocessPregunta( ctx.body ) !== 'si' ) {
          return endFlow( `ℹ️ Para ayudarle mejor, puedo mostrarle el menú principal. Solo debe escribir *MENÚ* o decirme qué tipo de información busca.` );
        } else {

          await flowDynamic( `✅ Para empezar solo necesito:` );
        }
      }


    }
  )
  .addAnswer(
    [ 'Que me facilite su *nombre completo*' ],
    { capture: true },

    async ( ctx, { flowDynamic, endFlow, state } ) => {
      if ( preprocessPregunta( ctx.body ) === 'no' ) {
        return endFlow( `ℹ️ Para ayudarle mejor, puedo mostrarle el menú principal. Solo debe escribir *MENÚ* o decirme qué tipo de información busca.` );
      }
      await state.update( { derivar_nombre: ctx.body } );
      //      return flowDynamic(`Perfect *${ctx.body}*, finally...`);
    }
  )
  .addAnswer(
    [ 'Que me facilite su *correo electrónico*' ],
    { capture: true },

    async ( ctx, { flowDynamic, endFlow, state } ) => {
      if ( preprocessPregunta( ctx.body ) === 'no' ) {
        return endFlow( `ℹ️ Para ayudarle mejor, puedo mostrarle el menú principal. Solo debe escribir *MENÚ* o decirme qué tipo de información busca.` );
      }
      await state.update( { derivar_correo: ctx.body } );
      //      return flowDynamic(`Perfect *${ctx.body}*, finally...`);
    }
  )
  .addAnswer(
    [ 'Que me facilite su *motivo de su consulta*' ],
    { capture: true },

    async ( ctx, { flowDynamic, endFlow, state } ) => {
      if ( preprocessPregunta( ctx.body ) === 'no' ) {
        return endFlow( `ℹ️ Para ayudarle mejor, puedo mostrarle el menú principal. Solo debe escribir *MENÚ* o decirme qué tipo de información busca.` );
      } else {

        await state.update( { derivar_motivo: ctx.body } );

        const nombre = await state.get( 'derivar_nombre' ) || 'No especificado';
        const correo = await state.get( 'derivar_correo' ) || 'No proporcionado';
        const pais = await state.get( 'derivar_motivo' ) || 'No indicado';
        const telefono = ctx.from || 'Desconocido';

        const mensaje = `
    📩 Nueva solicitud de atención humana

    👤 Nombre: ${ nombre }
    📧 Correo: ${ correo }
    📝 Motivo: ${ pais }
    📱 Teléfono: ${ telefono }
    `;
        await enviarDerivacionWhatsApp( mensaje );
        const texto_success = `✅ Gracias *${ nombre }* . Hemos recibido correctamente sus datos.`;
        await flowDynamic( [ { body: texto_success, delay: generateTimer( 150, 250 ) } ] );

        await state.update( { derivar_nombre: "" } );
        await state.update( { derivar_correo: "" } );
        await state.update( { derivar_motivo: "" } );

      }


    }
  );

export { detectConfirmacionDerivacion, fallbackconfirmarderivacionUser };