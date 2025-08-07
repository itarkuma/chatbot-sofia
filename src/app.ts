import 'dotenv/config';
import { createBot, createProvider, createFlow, addKeyword, EVENTS } from '@builderbot/bot';
import { MemoryDB as Database } from '@builderbot/bot';
import { BaileysProvider as Provider } from '@builderbot/provider-baileys';

import { askSofia } from './scripts/query';
import { askSofiaFallback } from './scripts/queryFallback';
import { preprocessPregunta } from './lib/utils/preprocessinText';
import { pineconeQuery } from './scripts/pineconeQuery';

import { distance } from 'fastest-levenshtein';
import { generateTimer } from './lib/utils/generateTimer';

import { derivarHumano } from './lib/utils/derivaciones';
//import { detectflowCursorGratuito, flowCursoGratis } from './flows/cursoGratuito.flow';
import { detectflowLibroFran, flowLibroFran } from './flows/libroFran.flow';
//import { detectflowComunidadAlumno, flowComunidadAlumno } from './flows/comunidadAlumnos.flow';
import { detectflowNoticiasMercado, flowNoticiasMercado } from './flows/noticiasMercado.flow';
import { detectflowClubFran, flowClubFran } from './flows/clubFran.flow';
import { detectflowConsultasGenerales, flowConsultasGenerales } from './flows/consultasGenerales.flow';
import { detectflowMenu, flowMenu } from './flows/menu.flow';
import { detectflowSaludo, flowSaludo } from './flows/saludo.flow';
import { detectflowsoyAlumno, flowSoyAlumno } from './flows/soyAlumno.flow';
import { detectflowCursoOonlineGrabado, flowCursoOnlineGrabado } from './flows/cursoOnlineGrabado.flow';
import { detectflowCursoOonlineVivo, flowCursoOnlineVivo } from './flows/cursoOnlineVivo.flow';
import { detectflowCursoMiami, flowCursoMiami } from './flows/cursoMiami.flow';
import { detectflowCursoSantiago, flowCursoSantiago } from './flows/cursoSantiago.flow';
import { flowComparacion } from './flows/comparacion.flow';
import { esComparacionGrabadoVsVivo } from './lib/utils/esComparacionGrabadoVsVivo';
import { detectflowConfusion, flowConfusion } from './flows/confusion.flow';
import { detectflowRecursosGratuitos, flowRecursosGratuitos } from './flows/recursosGratuitos.flow';
import { flowPresencial } from './flows/presencial.flow';

import { registerAlumno } from './flows/registerAlumno.flow';

import { detectConfusionUser, fallbackConfusionUser } from './fallback/confusionUser.flow';
import { detectDatoNodisponibleUser, fallbackDatoNodisponibleUser } from './fallback/datoNodisponibleUser.flow';
import { detectPromocionesUser, fallbackPromocionesUser } from './fallback/promocionesUser.flow';
import { detectFormasdepagoUser, fallbackFormasdepagoUser } from './fallback/formapagonoUser.flow';
import { detectOtrasCiudadesUser, fallbackOtrasCiudadesUser } from './fallback/otrasCiudadesUser.flow';
import { detectderivarJavierUser, fallbackderiverJavierUser } from './fallback/derivarJavierUser.flow';
import { fallbackconfirmarderivacionUser } from './fallback/confirmarDerivacionUser.flow';
import { detectJavierNoRespondeUser, fallbackJavierNoRespondeUser } from './fallback/javiernorespondeUser.flow';
import { detectarMensajeMultiplesPreguntas, fallbackMensajeMultiplesUser } from './fallback/variasPreguntasUser.flow';

import { getIntention } from './ai/cath-intention';
import type { IntencionDetectada } from "./ai/cath-intention"; // importa solo el tipo


function verificarConsulta( query: string ): boolean {
  // Definir las palabras aceptadas "sí" y "no"
  const respuestasAceptadas = [ 'sí', 'no', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10' ];

  // Eliminar posibles espacios y convertir a minúsculas
  const queryNormalizada = query.trim().toLowerCase();

  // Si la consulta es "sí" o "no", la aceptamos sin más validaciones
  if ( respuestasAceptadas.includes( queryNormalizada ) ) {
    return true;
  }

  // Si la consulta tiene menos de 3 caracteres, la consideramos inválida
  if ( queryNormalizada.length < 3 ) {
    console.log( "Consulta demasiado corta" );
    return false;
  }

  if ( queryNormalizada.length > 150 ) {
    console.log( "Consulta demasiado larga" );
    return false;
  }

  // Si contiene solo símbolos o letras sueltas, lo descartamos como ruido
  const esRuido = /^[^\w\s]+$/.test( queryNormalizada ) || /^[a-zA-Z]{1,2}$/.test( queryNormalizada );
  if ( esRuido ) {
    console.log( "Entrada parece accidental o sin sentido" );
    return false;
  }

  // Si pasa todas las validaciones, la consulta es válida
  return true;
}

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

  const textoLimpio = preprocessPregunta( texto );
  for ( const frase of frasesBase ) {
    const dist = distance( textoLimpio, preprocessPregunta( frase ) );
    const maxLen = Math.max( textoLimpio.length, frase.length );
    const similitud = dist / maxLen;

    if ( similitud < 0.45 ) {
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

  const textoLimpio = preprocessPregunta( texto );
  for ( const frase of negaciones ) {
    const dist = distance( textoLimpio, preprocessPregunta( frase ) );
    const maxLen = Math.max( textoLimpio.length, frase.length );
    const similitud = dist / maxLen;

    if ( similitud < 0.35 ) {
      console.log( `🚫 Negación detectada con: "${ frase }" (dist: ${ dist }, %: ${ similitud.toFixed( 2 ) })` );
      return true;
    }
  }

  return false;
}



const PORT = process.env.PORT ?? 3008;

type IntencionDetectadaaux = {
  seccion: string;
  texto: string;
  is_fallback: boolean;
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


function detectarFaltaTiempoOMiedo( texto ) {
  const textoLower = texto.toLowerCase();

  const patronesFaltaTiempoOMiedo = [
    // Falta de tiempo
    /\b(no tengo|me falta|tengo poco|no dispongo de) tiempo\b/,
    /\bhorarios? complicad[oa]s?\b/,
    /\bno puedo conectarme\b/,
    /\bmucho trabajo\b/,
    /\btrabajo todo el d[ií]a\b/,
    /\bmis tiempos\b.*(dif[ií]ciles|complicados)/,
    /\bestoy ocupad[oa]\b/,

    // Miedo al directo
    /\bmiedo al directo\b/,
    /\bme da (pena|vergüenza|miedo)\b/,
    /\bno me gusta hablar en grupo\b/,
    /\bno quiero participar en vivo\b/,
    /\bno me siento c[oó]modo en sesiones en vivo\b/,
    /\bme cuesta el directo\b/,
    /\bsoy muy t[ií]mid[oa]\b/,
    /\bme incomoda el grupo\b/,
  ];

  return patronesFaltaTiempoOMiedo.some( pat => pat.test( textoLower ) );
}

function delay( ms ) {
  return new Promise( resolve => setTimeout( resolve, ms ) );
}

function detectarTipoCurso( texto: string ): 'grabado' | 'vivo' | null {
  const lower = preprocessPregunta( texto );

  if ( /\b(grabado|asincr[oó]nico|a tu ritmo|cuando quiera)\b/.test( lower ) ) {
    return 'grabado';
  }

  if ( /\b(en vivo|directo|con fran|en tiempo real|grupo reducido|sesiones)\b/.test( lower ) ) {
    return 'vivo';
  }

  return null;
}

export async function detectarIntencion( mensaje: string ): Promise<IntencionDetectadaaux | null> {
  const query = preprocessPregunta( mensaje );
  const resultados = await pineconeQuery( query );
  // Log para ver los resultados obtenidos de Pinecone

  if ( resultados.length > 0 ) {
    const [ doc, score ] = resultados[ 0 ]; // ✅ desestructura la tupla

    //    console.log( 'resultados:', doc.metadata );

    const archivo = doc.metadata.archivo || '';
    const seccion = mapArchivoToSeccion( archivo );

    return {
      seccion: seccion || '',
      texto: doc.metadata.text || doc.pageContent || '',
      is_fallback: doc.metadata.es_fallback || false,
    };
  }

  return null;
}



const welcomeFlow = addKeyword( EVENTS.WELCOME )
  .addAction( async ( ctx, { gotoFlow, flowDynamic, state } ) => {
    console.log( 'Estado EVENTS WELCOME:', await state.get( 'seccionActual' ) );
    const seccion = await state.get( 'seccionActual' );
    const consulta = preprocessPregunta( ctx.body );
    if ( !verificarConsulta( consulta ) ) {
      await flowDynamic( `La pregunta es demasiado corta o no es válida. Por favor, intenta de nuevo.` );
      return;
    }

    const myintencion: IntencionDetectada = await getIntention( consulta );
    console.log( { myintencion } );

    //    const isSaludo = detectflowSaludo( consulta, seccion );
    const isCommandMenu = detectflowMenu( consulta, seccion );
    //    const isMenuOption5 = detectflowCursorGratuito( consulta, seccion );
    const isMenuOption6 = detectflowLibroFran( consulta, seccion );
    //    const isMenuOption7 = detectflowComunidadAlumno( consulta, seccion );
    const isMenuOption8 = detectflowNoticiasMercado( consulta, seccion );
    const isMenuOption9 = detectflowClubFran( consulta, seccion );
    const isMenuOption7_1 = detectflowConsultasGenerales( consulta, seccion );

    const isAlumno = detectflowsoyAlumno( consulta, seccion );
    const isOnlineGrabado = detectflowCursoOonlineGrabado( consulta, seccion );
    const isOnlineVivo = detectflowCursoOonlineVivo( consulta, seccion );
    const isCursoMiami = detectflowCursoMiami( consulta, seccion );
    const isCursoSantiago = detectflowCursoSantiago( consulta, seccion );
    const isComparacion = esComparacionGrabadoVsVivo( consulta );
    const isConfusion = detectflowConfusion( consulta, seccion );
    const isRecursosGratuitos = detectflowRecursosGratuitos( consulta, seccion );

    const isConfusoUser = false;
    const isDataNodisponibleUser = detectDatoNodisponibleUser( consulta );
    const isPromocionesUser = detectPromocionesUser( consulta );
    const isFormasDePagoUser = detectFormasdepagoUser( consulta );
    const isOtrasCiudadesUser = detectOtrasCiudadesUser( consulta );
    const isDerivarJavierUser = detectderivarJavierUser( consulta );
    const isNorespondeJavierUser = detectJavierNoRespondeUser( consulta );
    const isMultiplesPreguntas = detectarMensajeMultiplesPreguntas( consulta );
    if ( isMultiplesPreguntas ) { return gotoFlow( fallbackMensajeMultiplesUser ); }
    if ( isNorespondeJavierUser ) { return gotoFlow( fallbackJavierNoRespondeUser ); }
    if ( isDerivarJavierUser ) { return gotoFlow( fallbackderiverJavierUser ); }
    if ( isOtrasCiudadesUser ) { return gotoFlow( fallbackOtrasCiudadesUser ); }
    if ( isFormasDePagoUser ) { return gotoFlow( fallbackFormasdepagoUser ); }
    if ( isPromocionesUser ) { return gotoFlow( fallbackPromocionesUser ); }
    if ( isDataNodisponibleUser ) { return gotoFlow( fallbackDatoNodisponibleUser ); }
    if ( isConfusoUser ) { return gotoFlow( fallbackConfusionUser ); }

    if (
      !(
        ( myintencion === "PRECIO_CURSO_MIAMI" ) ||
        ( myintencion === "PRECIO_CURSO_SANTIAGO" ) ||
        ( myintencion === "PRECIO_CURSO_GRABADO" ) ||
        ( myintencion === "PRECIO_CURSO_VIVO" )
      )
      && isConfusion ) { return gotoFlow( flowConfusion ); }

    if ( isComparacion ) { return gotoFlow( flowComparacion ); }

    if ( myintencion === "GREETING" || myintencion === "INFO_REQUEST" ) {
      return gotoFlow( flowSaludo );
    }
    //    if ( isSaludo ) { return gotoFlow( flowSaludo ); }
    if ( isCommandMenu ) { return gotoFlow( flowMenu ); }

    if ( myintencion === "INFO_REQUEST_CURSO_PRESENCIALES" ) { return gotoFlow( flowPresencial ); }

    if ( isOnlineGrabado || ( myintencion === "INFO_REQUEST_CURSO_ONLINE_GRABADO" ) ) { return gotoFlow( flowCursoOnlineGrabado ); }
    if ( isOnlineVivo || ( myintencion === "INFO_REQUEST_CURSO_ONLINE_VIVO" ) ) { return gotoFlow( flowCursoOnlineVivo ); }
    if ( isCursoMiami || ( myintencion === "INFO_REQUEST_CURSO_PRESENCIALES_MIAMI" ) ) { return gotoFlow( flowCursoMiami ); }
    if ( isCursoSantiago || ( myintencion === "INFO_REQUEST_CURSO_PRESENCIALES_SANTIAGO" ) ) { return gotoFlow( flowCursoSantiago ); }
    if ( isAlumno ) { return gotoFlow( flowSoyAlumno ); }

    if ( isRecursosGratuitos ) { return gotoFlow( flowRecursosGratuitos ); }
    if ( isMenuOption9 ) { return gotoFlow( flowClubFran ); }
    if ( isMenuOption6 ) { return gotoFlow( flowLibroFran ); }
    if ( isMenuOption8 ) { return gotoFlow( flowNoticiasMercado ); }

    if ( isMenuOption7_1 || myintencion === "INFO_REQUEST_INICIAR_DESDE_CERO" ) { return gotoFlow( flowConsultasGenerales ); }
    //    if ( isMenuOption5 ) { return gotoFlow( flowCursoGratis ); }
    //    if ( isMenuOption7 ) { return gotoFlow( flowComunidadAlumno ); }

    const esperandoDerivacion = await state.get( 'esperandoDerivacion' );
    const esperandoSeguimiento = await state.get( 'esperandoSeguimiento' );
    const esperandoConfusion = await state.get( 'estaconfundido_answer' );


    if ( esperandoConfusion ) {

      const resp_curso_confundido = detectarTipoCurso( consulta );
      console.log( 'resp_curso_confundido', resp_curso_confundido );

      if ( resp_curso_confundido == 'grabado' ) {
        return gotoFlow( flowCursoOnlineGrabado );
      }
      if ( resp_curso_confundido == 'vivo' ) {
        return gotoFlow( flowCursoOnlineVivo );
      }

    }

    if ( esperandoDerivacion || esperandoSeguimiento ) {
      if ( esConfirmacionDerivacion( consulta ) ) {
        await state.update( { esperandoDerivacion: false } );
        await state.update( { esperandoSeguimiento: false } );
        await state.update( { estaconfundido_answer: false } );
        await delay( 2000 );
        await flowDynamic( `🟢 Conectando con Javier Gómez... 👨‍💼 Él continuará con usted en este mismo chat.` );
      }

      if ( esNegacionDerivacion( consulta ) ) {
        await state.update( { esperandoDerivacion: false } );
        await state.update( { esperandoSeguimiento: false } );
        await state.update( { estaconfundido_answer: false } );
        await delay( 2000 );
        await flowDynamic( `✅ Entendido. Seguimos por aquí entonces 😉` );
      }
    } else {

      //      const aclasificarChunk14 = await clasificarChunk14( consulta );

      if ( seccion ) {
        console.log( 'Si tiene seccion' );

        console.log( 'Nombre Seccion:', seccion );
        const { texto, origen, tags, chunkId } = await askSofia( consulta, seccion, '', false, myintencion );
        console.log( { origen, chunkId } );
        if ( origen === 'curso_online_vivo' ||
          origen === 'curso_online_grabado' ||
          origen === 'formacion_miami' ||
          origen === 'formacion_santiago'
        ) {
          await state.update( { seccionActual: origen } );
          console.log( 'update seccion app.ts ->:', origen );
        }

        await flowDynamic( [ { body: texto, delay: generateTimer( 150, 250 ) } ] );

        const isDerivarHumano = derivarHumano( tags, origen );

        if ( isDerivarHumano ) {
          console.log( 'Caso especial derivacion humana -> si tiene seccion' );

          return gotoFlow( fallbackconfirmarderivacionUser );
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
        if ( tags.includes( 'escenario_entrenable-presencial_miami-asistencia_parcial-duda_evento_completo' ) && origen === 'formacion_miami' ) {
          console.log( 'Caso especial 10' );
          await state.update( { esperandoDerivacion: true } );
        }

        if ( tags.includes( 'escenario_entrenable-espera_contacto' ) && origen === 'formacion_santiago' ) {
          console.log( 'Caso especial 8_18' );
          await state.update( { esperandoSeguimiento: true } );
        }
        if ( tags.includes( 'escenario_entrenable-presencial_miami-asistencia_parcial-duda_evento_completo' ) && origen === 'formacion_santiago' ) {
          console.log( 'Caso especial 9_19' );
          await state.update( { esperandoSeguimiento: true } );
        }



      } else {
        console.log( 'No se eligio seccion' );

        if ( detectarFaltaTiempoOMiedo( consulta ) ) {

          if ( detectarFaltaTiempoOMiedo( consulta ) ) {
            await delay( 2000 );
            await flowDynamic( "¡Entiendo totalmente!\nEn el *Curso en vivo con Fran*, todas las sesiones *quedan grabadas en el Campus* para que puedas verlas en el momento que mejor te funcione.\nAdemás, el grupo es *reducido y personalizado*, así que vas a poder avanzar a tu ritmo, con seguimiento directo de Fran y sin sentirte perdido." );
          }
          return;
        }

        const intencion = await detectarIntencion( consulta );

        if ( intencion.is_fallback ) {
          console.log( 'Detecto Fallback intencion else' );
          const { texto, tags, chunkId, origen } = await askSofiaFallback( consulta );
          console.log( 'retorno un fallback' );
          console.log( { origen, chunkId } );



          await flowDynamic( [ { body: texto, delay: generateTimer( 150, 250 ) } ] );

          const isDerivarHumano = derivarHumano( tags, origen );

          if ( isDerivarHumano ) {
            console.log( 'Caso especial derivacion humana -> fallback else' );
            return gotoFlow( fallbackconfirmarderivacionUser );
          }



        } else {

          if ( intencion.seccion ) {
            switch ( intencion.seccion ) {

              case 'soporte_general': {

                console.log( 'Intención detectada:', intencion.seccion );
                return gotoFlow( flowConsultasGenerales );
              }


              default: {
                console.log( 'No detecto la intencion' );
                const { texto, tags, origen, chunkId } = await askSofia( consulta, seccion, '', false, myintencion );
                console.log( { origen, chunkId } );

                if ( origen == 'curso_online_vivo' ||
                  origen == 'curso_online_grabado' ||
                  origen == 'formacion_miami' ||
                  origen == 'formacion_santiago'
                ) {
                  await state.update( { seccionActual: origen } );
                  console.log( 'update seccion ->:', origen );
                }

                const isDerivarHumano = derivarHumano( tags, origen );

                if ( isDerivarHumano ) {
                  console.log( 'Caso especial derivacion humana -> no intencion' );

                  return gotoFlow( fallbackconfirmarderivacionUser );
                }


                await flowDynamic( [ { body: texto, delay: generateTimer( 150, 250 ) } ] );
                break;
              }
            }
          } else {
            console.log( 'No detecto la intencion else' );
            const { texto, origen, tags, chunkId } = await askSofia( consulta, seccion, '', false, myintencion );
            console.log( { origen, chunkId } );
            if ( origen == 'curso_online_vivo' ||
              origen == 'curso_online_grabado' ||
              origen == 'formacion_miami' ||
              origen == 'formacion_santiago'
            ) {
              await state.update( { seccionActual: origen } );
              console.log( 'update seccion ->:', origen );
            }
            await flowDynamic( [ { body: texto, delay: generateTimer( 150, 250 ) } ] );
            const isDerivarHumano = derivarHumano( tags, origen );

            if ( isDerivarHumano ) {
              console.log( 'Caso especial derivacion humana -> no intencion else' );
              return gotoFlow( fallbackconfirmarderivacionUser );
            }

          }
        }





      }


    }



  } );






const main = async () => {

  const adapterFlow = createFlow(
    [ flowMenu,
      flowSaludo,
      welcomeFlow,
      //      flowCursoGratis,
      flowLibroFran,
      //      flowComunidadAlumno,
      flowNoticiasMercado,
      flowClubFran,
      flowConsultasGenerales,
      flowSoyAlumno,
      registerAlumno,
      flowCursoOnlineGrabado,
      flowCursoOnlineVivo,
      flowCursoMiami,
      flowCursoSantiago,
      flowComparacion,
      flowConfusion,
      flowRecursosGratuitos,
      flowPresencial,
      fallbackConfusionUser,
      fallbackDatoNodisponibleUser,
      fallbackPromocionesUser,
      fallbackFormasdepagoUser,
      fallbackOtrasCiudadesUser,
      fallbackderiverJavierUser,
      fallbackconfirmarderivacionUser,
      fallbackJavierNoRespondeUser,
      fallbackMensajeMultiplesUser
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





