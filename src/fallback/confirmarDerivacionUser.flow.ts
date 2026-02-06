import { addKeyword, EVENTS } from '@builderbot/bot';
import { preprocessPregunta } from '../lib/utils/preprocessinText';
import { generateTimer } from '../lib/utils/generateTimer';
import { enviarDerivacionWhatsApp } from '../lib/utils/sendMessagewa';
import { 
  getMensajeSistemaPorId, 
  renderizarMensaje,
  MENSAJES_DERIVACION 
} from '../lib/utils/mensajesSistema';
import { distance } from 'fastest-levenshtein';

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

// Fallbacks por defecto
const DEFAULT_MSG_INICIAL = 'Le pondré en contacto con *Javier Gómez*, nuestro asesor académico del equipo de Fran Fialli. ¿Desea que lo haga? 📩';
const DEFAULT_MSG_OPCIONES = '✅ *si*.\n❌ *no*.';
const DEFAULT_MSG_CANCEL = 'ℹ️ Para ayudarle mejor, puedo mostrarle el menú principal. Solo debe escribir *MENÚ* o decirme qué tipo de información busca.';
const DEFAULT_MSG_NOMBRE = 'Que me facilite su *nombre completo*';
const DEFAULT_MSG_CORREO = 'Que me facilite su *correo electrónico*';
const DEFAULT_MSG_MOTIVO = 'Que me facilite su *motivo de su consulta*';
const DEFAULT_MSG_EXITO = '✅ Gracias *{nombre}*. Hemos recibido correctamente sus datos.';
const DEFAULT_MSG_JAVIER = 'En breve, Javier Gómez se incorporará a este chat para atender su consulta de manera personalizada.';

const fallbackconfirmarderivacionUser = addKeyword( EVENTS.ACTION )
  .addAnswer(
    [ DEFAULT_MSG_INICIAL, DEFAULT_MSG_OPCIONES ],
    { capture: true },

    async ( ctx, { endFlow, state } ) => {
      const respuesta = preprocessPregunta( ctx.body );
      
      if ( respuesta === 'no' || respuesta !== 'si' ) {
        const mensajeCancelacion = await getMensajeSistemaPorId(MENSAJES_DERIVACION.CANCELACION);
        return endFlow( mensajeCancelacion || DEFAULT_MSG_CANCEL );
      }
    }
  )
  .addAnswer(
    [ '✅ Para empezar solo necesito:' ],
    { capture: false }
  )
  .addAnswer(
    [ DEFAULT_MSG_NOMBRE ],
    { capture: true },

    async ( ctx, { endFlow, state } ) => {
      if ( preprocessPregunta( ctx.body ) === 'no' ) {
        const mensajeCancelacion = await getMensajeSistemaPorId(MENSAJES_DERIVACION.CANCELACION);
        return endFlow( mensajeCancelacion || DEFAULT_MSG_CANCEL );
      }
      await state.update( { derivar_nombre: ctx.body } );
    }
  )
  .addAnswer(
    [ DEFAULT_MSG_CORREO ],
    { capture: true },

    async ( ctx, { endFlow, state } ) => {
      if ( preprocessPregunta( ctx.body ) === 'no' ) {
        const mensajeCancelacion = await getMensajeSistemaPorId(MENSAJES_DERIVACION.CANCELACION);
        return endFlow( mensajeCancelacion || DEFAULT_MSG_CANCEL );
      }
      await state.update( { derivar_correo: ctx.body } );
    }
  )
  .addAnswer(
    [ DEFAULT_MSG_MOTIVO ],
    { capture: true },

    async ( ctx, { endFlow, state, gotoFlow } ) => {
      if ( preprocessPregunta( ctx.body ) === 'no' ) {
        const mensajeCancelacion = await getMensajeSistemaPorId(MENSAJES_DERIVACION.CANCELACION);
        return endFlow( mensajeCancelacion || DEFAULT_MSG_CANCEL );
      }
      
      await state.update( { derivar_motivo: ctx.body } );
    }
  )
  .addAction(
    async ( ctx, { flowDynamic, state } ) => {
      const nombre = await state.get( 'derivar_nombre' ) || 'No especificado';
      const correo = await state.get( 'derivar_correo' ) || 'No proporcionado';
      const motivo = await state.get( 'derivar_motivo' ) || 'No indicado';
      const telefono = ctx.from || 'Desconocido';

      const mensajeNotificacion = `
📩 Nueva solicitud de atención humana

👤 Nombre: ${ nombre }
📧 Correo: ${ correo }
📝 Motivo: ${ motivo }
📱 Teléfono: ${ telefono }
      `;
      
      await enviarDerivacionWhatsApp( mensajeNotificacion );
      
      const mensajeExitoTemplate = await getMensajeSistemaPorId(MENSAJES_DERIVACION.EXITO_CONFIRMACION);
      const mensajeJavier = await getMensajeSistemaPorId(MENSAJES_DERIVACION.EXITO_JAVIER);
      
      const textoSuccess = mensajeExitoTemplate 
        ? renderizarMensaje(mensajeExitoTemplate, { nombre })
        : DEFAULT_MSG_EXITO.replace('{nombre}', nombre);
      
      const fraseSuccess = mensajeJavier || DEFAULT_MSG_JAVIER;
      
      await flowDynamic( [ { body: textoSuccess, delay: generateTimer( 150, 250 ) } ] );
      await flowDynamic( [ { body: fraseSuccess, delay: generateTimer( 150, 250 ) } ] );
      
      await state.update( { derivar_nombre: "" } );
      await state.update( { derivar_correo: "" } );
      await state.update( { derivar_motivo: "" } );
    }
  );

export { detectConfirmacionDerivacion, fallbackconfirmarderivacionUser };
