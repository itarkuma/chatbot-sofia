import { join } from 'path';
import { createBot, createProvider, createFlow, addKeyword, utils, EVENTS } from '@builderbot/bot';
import { MemoryDB as Database } from '@builderbot/bot';
import { BaileysProvider as Provider } from '@builderbot/provider-baileys';

import { askSofia } from './scripts/query';
import { preprocessPregunta } from './scripts/preprocesamiento';
import { pineconeQuery } from './scripts/pineconeQuery';

import { distance } from 'fastest-levenshtein';

function esConfirmacionDerivacion( texto: string ): boolean {
  const frasesBase = [
    'sí',
    'sí por favor',
    'adelante',
    'de acuerdo',
    'quiero que me contacten',
    'puedes avisarle ya',
    'necesito hablar con él',
    'sí, pásame con él',
    'dile que me escriba',
    'quiero atención de javier',
    'quiero que me responda javier',
    'prefiero que me ayude javier'
  ];

  const textoLimpio = texto.trim().toLowerCase();
  for ( const frase of frasesBase ) {
    const dist = distance( textoLimpio, frase.toLowerCase() );
    const maxLen = Math.max( textoLimpio.length, frase.length );
    const similitud = dist / maxLen;

    if ( similitud < 0.35 ) {
      console.log( `✅ Confirmación detectada con: "${ frase }" (dist: ${ dist }, %: ${ similitud.toFixed( 2 ) })` );
      return true;
    }
  }

  console.log( '❌ No se detectó confirmación de derivación' );
  return false;
}

function esNegacionDerivacion( texto: string ): boolean {
  const negaciones = [
    'no',
    'no gracias',
    'mejor no',
    'prefiero seguir con la ia',
    'quiero seguir con la asistente',
    'no quiero hablar con javier',
    'prefiero seguir por aquí',
    'no quiero atención humana',
    'no hace falta'
  ];

  const textoLimpio = texto.trim().toLowerCase();
  for ( const frase of negaciones ) {
    const dist = distance( textoLimpio, frase.toLowerCase() );
    const maxLen = Math.max( textoLimpio.length, frase.length );
    const similitud = dist / maxLen;

    if ( similitud < 0.35 ) {
      console.log( `🚫 Negación detectada con: "${ frase }" (dist: ${ dist }, %: ${ similitud.toFixed( 2 ) })` );
      return true;
    }
  }

  return false;
}

// const query = "¿El curso por Zoom sirve si vengo de ser autodidacta?";
// const resultados = await pineconeQuery( query );

// for ( const [ doc, score ] of resultados ) {
//   console.log( {
//     archivo: doc.metadata.archivo,
//     chunk: doc.metadata.chunk,
//     score: score.toFixed( 4 ),
//     texto: doc.pageContent.slice( 0, 80 ) + '...',
//   } );
// }

// console.log( resultados.map( r => ( {
//   archivo: r.metadata.archivo,
//   chunk: r.metadata.chunk_id || r.id,
//   score: r.score.toFixed( 4 ),
//   texto: r.metadata.text.slice( 0, 80 ) + '...',
// } ) ) );


const PORT = process.env.PORT ?? 3008;

type IntencionDetectada = {
  seccion: string;
  texto: string;
};

const archivoPorSeccion = {
  curso_online_vivo: '1_curso_trading_online_vivo.txt',
  curso_online_grabado: '2_curso_trading_online_grabado.txt',
  formacion_miami: '4_curso_trading_miami.txt',
  formacion_santiago: '5_curso_trading_santiago.txt',
  soy_alumno: '3_alumnos.txt',
  soporte_general: '9_soporte_general.txt',
};

function mapArchivoToSeccion( archivo: string ): string | null {
  for ( const [ seccion, nombreArchivo ] of Object.entries( archivoPorSeccion ) ) {
    if ( nombreArchivo === archivo ) return seccion;
  }
  return null;
}

export async function detectarIntencion( mensaje: string ): Promise<IntencionDetectada | null> {
  const query = preprocessPregunta( mensaje );
  const resultados = await pineconeQuery( query );

  if ( resultados.length > 0 ) {
    const [ doc, score ] = resultados[ 0 ]; // ✅ desestructura la tupla
    const archivo = doc.metadata.archivo || '';
    const seccion = mapArchivoToSeccion( archivo );

    return {
      seccion: seccion || '',
      texto: doc.metadata.text || doc.pageContent || '',
    };
  }

  return null;
}

const discordFlow = addKeyword<Provider, Database>( 'doc' ).addAnswer(
  [ 'You can see the documentation here', '📄 https://builderbot.app/docs \n', 'Do you want to continue? *yes*' ].join(
    '\n'
  ),
  { capture: true },
  async ( ctx, { gotoFlow, flowDynamic } ) => {
    if ( ctx.body.toLocaleLowerCase().includes( 'yes' ) ) {
      return gotoFlow( registerFlow );
    }
    await flowDynamic( 'Thanks!' );
    return;
  }
);

const menuFlow = addKeyword( [ 'MENÚ', 'menu' ] )
  .addAction( async ( ctx, { flowDynamic, state } ) => {
    await state.clear(); // Limpiar la sección previa
    console.log( 'Estado actual1:', await state.get( 'seccionActual' ) );
    const { texto } = await askSofia( ctx.body.toLocaleLowerCase(), '' );
    await flowDynamic( texto );
  } );

const welcomeFlow = addKeyword( EVENTS.WELCOME )
  .addAction( async ( ctx, { gotoFlow, flowDynamic, state } ) => {
    console.log( 'Estado actual2:', await state.get( 'seccionActual' ) );
    const seccion = await state.get( 'seccionActual' );
    const consulta = preprocessPregunta( ctx.body );


    const esperandoDerivacion = await state.get( 'esperandoDerivacion' );
    if ( esperandoDerivacion ) {
      if ( esConfirmacionDerivacion( consulta ) ) {
        await state.update( { esperandoDerivacion: false } );
        await flowDynamic( `🟢 Conectando con Javier Gómez... 👨‍💼 Él continuará con usted en este mismo chat.` );
      }

      if ( esNegacionDerivacion( consulta ) ) {
        await state.update( { esperandoDerivacion: false } );
        await flowDynamic( `✅ Entendido. Seguimos por aquí entonces 😉` );
      }
    } else {


      if ( seccion ) {
        console.log( 'Estado actual_query:', seccion );
        const { texto, origen, tags } = await askSofia( consulta, seccion );
        if ( tags.includes( 'solicitud_datos' ) && origen === 'curso_online_vivo' ) {
          // Acción específica
          console.log( 'Caso especial 1' );
          //        await state.update( { esperandoSolicitudDatos: true } );
          await flowDynamic( texto );
          return gotoFlow( registerSolicitudDatos );
        }
        if ( tags.includes( 'reserva_plaza' ) && origen === 'curso_online_vivo' ) {
          // Acción específica
          console.log( 'Caso especial 2' );
          await flowDynamic( texto );
          return gotoFlow( registerReservaPlaza );
        }
        if ( tags.includes( 'inscripción' ) && origen === 'curso_online_grabado' ) {
          // Acción específica
          console.log( 'Caso especial 3' );
          await flowDynamic( texto );
          return gotoFlow( registerInscripcion );
        }


        if ( tags.includes( 'escenario_entrenable-fallback-dato_no_disponible-derivación-Javier_Gómez' ) && origen === 'curso_online_grabado' ) {
          console.log( 'Caso especial 4' );
          await state.update( { esperandoDerivacion: true } );
        }
        if ( tags.includes( 'escenario_entrenable-fallback-promoción-descuento-Javier_Gómez' ) && origen === 'curso_online_grabado' ) {
          console.log( 'Caso especial 5' );
          await state.update( { esperandoDerivacion: true } );
        }
        if ( tags.includes( 'escenario_entrenable-fallback-formas_de_pago-derivación-Javier_Gómez' ) && origen === 'curso_online_grabado' ) {
          console.log( 'Caso especial 6' );
          await state.update( { esperandoDerivacion: true } );
        }


        await flowDynamic( texto );



      } else {

        const intencion = await detectarIntencion( consulta );
        if ( intencion.seccion ) {
          switch ( intencion.seccion ) {
            case 'curso_online_vivo': {

              console.log( 'Intención detectada:', intencion.seccion );
              return gotoFlow( cursoOnlineVFlow );
            }
            case 'curso_online_grabado': {
              console.log( 'Intención detectada:', intencion.seccion );
              return gotoFlow( cursoOnlineGFlow );

            }

            case 'formacion_miami': {

              console.log( 'Intención detectada:', intencion.seccion );
              return gotoFlow( formacionMiamiFlow );
            }

            case 'formacion_santiago': {

              console.log( 'Intención detectada:', intencion.seccion );
              return gotoFlow( formacionSantiagoFlow );
            }

            case 'soy_alumno': {

              console.log( 'Intención detectada:', intencion.seccion );
              return gotoFlow( yasoyAlumnoFlow );
            }

            case 'soporte_general': {

              console.log( 'Intención detectada:', intencion.seccion );
              return gotoFlow( soporteGeneralFlow );
            }


            default: {
              console.log( 'No detecto la intencion' );
              const { texto } = await askSofia( consulta, seccion );
              await flowDynamic( texto );
              break;
            }
          }
        } else {
          const { texto } = await askSofia( consulta, seccion );
          await flowDynamic( texto );
        }

      }

    }
    // if ( esperandoLista ) {
    //   const datos = extraerDatosListaPrioritaria( consulta );

    //   if ( !datos.nombre || !datos.email || !datos.pais ) {
    //     await flowDynamic( `❗️Por favor, asegúrese de enviar: *nombre completo*, *correo electrónico* y *país de residencia*.` );
    //     return;
    //   }

    //   await flowDynamic( `✅ ¡Gracias! Ya lo anoté en la lista prioritaria. Le avisaremos cuando se abra la próxima convocatoria.` );

    // Guardar los datos si hace falta
    //   console.log( '📌 Datos de lista prioritaria:', datos );

    //   await state.update( { esperandoSolicitudDatos: false } );
    //   return;
    // }





  } );

const cursoOnlineGFlow = addKeyword<Provider, Database>( [ 'Curso Online Grabado', '1' ] )
  .addAction( async ( ctx, { flowDynamic, state } ) => {
    await state.update( { seccionActual: 'curso_online_grabado' } );
    console.log( 'Estado actual:', await state.get( 'seccionActual' ) );
    const seccion = await state.get( 'seccionActual' );
    const { texto } = await askSofia( '¿Qué es el curso online grabado de Fran Fialli?', seccion );
    await flowDynamic( texto );
  } );

const cursoOnlineVFlow = addKeyword<Provider, Database>( [ 'Curso Online en vivo', '2' ] )
  .addAction( async ( ctx, { flowDynamic, state } ) => {
    await state.update( { seccionActual: 'curso_online_vivo' } );
    const seccion = await state.get( 'seccionActual' );
    const { texto } = await askSofia( '¿Qué es el curso online en vivo?', seccion );
    await flowDynamic( texto );
  } );

const formacionMiamiFlow = addKeyword<Provider, Database>( [ 'Formación en Miami', '3' ] )
  .addAction( async ( ctx, { flowDynamic, state } ) => {
    await state.update( { seccionActual: 'formacion_miami' } );
    const seccion = await state.get( 'seccionActual' );
    const { texto } = await askSofia( '¿Tienen un curso de trading en Miami?', seccion );
    await flowDynamic( texto );
  } );

const formacionSantiagoFlow = addKeyword<Provider, Database>( [ 'Formación en Santiago', '4' ] )
  .addAction( async ( ctx, { flowDynamic, state } ) => {
    await state.update( { seccionActual: 'formacion_santiago' } );
    const seccion = await state.get( 'seccionActual' );
    const { texto } = await askSofia( '¿Tienen un curso de trading en Santiago de Compostela?', seccion );
    await flowDynamic( texto );
  } );

const yasoyAlumnoFlow = addKeyword<Provider, Database>( [ 'Ya soy alumno/a', '6' ] )
  .addAction( async ( ctx, { flowDynamic, state } ) => {
    await state.update( { seccionActual: 'soy_alumno' } );
    const seccion = await state.get( 'seccionActual' );
    const { texto } = await askSofia( ctx.body.toLocaleLowerCase(), seccion );
    await flowDynamic( texto );
  } );

const soporteGeneralFlow = addKeyword<Provider, Database>( [ 'Consultas generales', '7' ] )
  .addAction( async ( ctx, { flowDynamic, state } ) => {
    await state.update( { seccionActual: 'soporte_general' } );
    const seccion = await state.get( 'seccionActual' );
    const { texto } = await askSofia( ctx.body.toLocaleLowerCase(), seccion );
    await flowDynamic( texto );
  } );

const registerFlow = addKeyword<Provider, Database>( utils.setEvent( 'REGISTER_FLOW' ) )
  .addAnswer( `What is your name?`, { capture: true }, async ( ctx, { state } ) => {
    await state.update( { name: ctx.body } );
  } )
  .addAnswer( 'What is your age?', { capture: true }, async ( ctx, { state } ) => {
    await state.update( { age: ctx.body } );
  } )
  .addAction( async ( _, { flowDynamic, state } ) => {
    await flowDynamic( `${ state.get( 'name' ) }, thanks for your information!: Your age: ${ state.get( 'age' ) }` );
  } );


// casos especiales  
const registerSolicitudDatos = addKeyword( EVENTS.ACTION )
  .addAnswer( `Nombre Completo`, { capture: true }, async ( ctx, { state } ) => {
    await state.update( { name: ctx.body } );
  } )
  .addAnswer( `Correo Electrónico`, { capture: true }, async ( ctx, { state } ) => {
    await state.update( { correo: ctx.body } );
  } )
  .addAnswer( `Pais de residencia`, { capture: true }, async ( ctx, { state } ) => {
    await state.update( { pais: ctx.body } );
  } )
  .addAction( async ( _, { flowDynamic, state } ) => {
    //    await flowDynamic( `${ state.get( 'name' ) }, thanks for your information!: Your age: ${ state.get( 'correo' ) }, and your country: ${ state.get( 'pais' ) }` );
    await flowDynamic( `✅ ¡Gracias! Ya lo anoté en la lista prioritaria. Le avisaremos cuando se abra la próxima convocatoria.` );
  } );

const registerReservaPlaza = addKeyword( EVENTS.ACTION )
  .addAnswer( `Nombre Completo`, { capture: true }, async ( ctx, { state } ) => {
    await state.update( { name: ctx.body } );
  } )
  .addAnswer( `Ciudad o país`, { capture: true }, async ( ctx, { state } ) => {
    await state.update( { pais: ctx.body } );
  } )
  .addAnswer( `Email`, { capture: true }, async ( ctx, { state } ) => {
    await state.update( { correo: ctx.body } );
  } )
  .addAction( async ( _, { flowDynamic, state } ) => {
    console.log( `${ state.get( 'name' ) }, thanks for your information!: Your age: ${ state.get( 'correo' ) }, and your country: ${ state.get( 'pais' ) }` );
    //    await flowDynamic( `${ state.get( 'name' ) }, thanks for your information!: Your age: ${ state.get( 'correo' ) }, and your country: ${ state.get( 'pais' ) }` );
    //    await flowDynamic( `✅ ¡Gracias! Ya lo anoté en la lista prioritaria. Le avisaremos cuando se abra la próxima convocatoria.` );
  } );

const registerInscripcion = addKeyword( EVENTS.ACTION )
  .addAnswer( `Nombre Completo`, { capture: true }, async ( ctx, { state } ) => {
    await state.update( { name: ctx.body } );
  } )
  .addAnswer( `Correo electrónico`, { capture: true }, async ( ctx, { state } ) => {
    await state.update( { correo: ctx.body } );
  } )
  .addAnswer( `País de residencia`, { capture: true }, async ( ctx, { state } ) => {
    await state.update( { pais: ctx.body } );
  } )
  .addAnswer( `Divisa de pago preferida`, { capture: true }, async ( ctx, { state } ) => {
    await state.update( { divisa: ctx.body } );
  } )
  .addAnswer( `Método de pago preferido`, { capture: true }, async ( ctx, { state } ) => {
    await state.update( { metodo: ctx.body } );
  } )
  .addAction( async ( _, { flowDynamic, state } ) => {
    console.log( `${ state.get( 'name' ) }, thanks : Your correo: ${ state.get( 'correo' ) }, and your country: ${ state.get( 'pais' ) }` );
    //    await flowDynamic( `${ state.get( 'name' ) }, thanks for your information!: Your age: ${ state.get( 'correo' ) }, and your country: ${ state.get( 'pais' ) }` );
    //    await flowDynamic( `✅ ¡Gracias! Ya lo anoté en la lista prioritaria. Le avisaremos cuando se abra la próxima convocatoria.` );
  } );


const main = async () => {

  const adapterFlow = createFlow(
    [ menuFlow,
      welcomeFlow,
      registerFlow,
      cursoOnlineGFlow,
      cursoOnlineVFlow,
      formacionMiamiFlow,
      formacionSantiagoFlow,
      yasoyAlumnoFlow,
      soporteGeneralFlow,
      registerSolicitudDatos,
      registerReservaPlaza,
      registerInscripcion
    ] );

  const adapterProvider = createProvider( Provider );
  const adapterDB = new Database();

  const { handleCtx, httpServer } = await createBot( {
    flow: adapterFlow,
    provider: adapterProvider,
    database: adapterDB,
  } );

  adapterProvider.server.post(
    '/v1/messages',
    handleCtx( async ( bot, req, res ) => {
      const { number, message, urlMedia } = req.body;
      await bot.sendMessage( number, message, { media: urlMedia ?? null } );
      return res.end( 'sended' );
    } )
  );

  adapterProvider.server.post(
    '/v1/register',
    handleCtx( async ( bot, req, res ) => {
      const { number, name } = req.body;
      await bot.dispatch( 'REGISTER_FLOW', { from: number, name } );
      return res.end( 'trigger' );
    } )
  );

  adapterProvider.server.post(
    '/v1/samples',
    handleCtx( async ( bot, req, res ) => {
      const { number, name } = req.body;
      await bot.dispatch( 'SAMPLES', { from: number, name } );
      return res.end( 'trigger' );
    } )
  );

  adapterProvider.server.post(
    '/v1/blacklist',
    handleCtx( async ( bot, req, res ) => {
      const { number, intent } = req.body;
      if ( intent === 'remove' ) bot.blacklist.remove( number );
      if ( intent === 'add' ) bot.blacklist.add( number );

      res.writeHead( 200, { 'Content-Type': 'application/json' } );
      return res.end( JSON.stringify( { status: 'ok', number, intent } ) );
    } )
  );

  httpServer( +PORT );
};

main();





