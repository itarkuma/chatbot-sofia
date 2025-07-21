import { join } from 'path';
import 'dotenv/config';
import { createBot, createProvider, createFlow, addKeyword, EVENTS } from '@builderbot/bot';
import { MemoryDB as Database } from '@builderbot/bot';
import { BaileysProvider as Provider } from '@builderbot/provider-baileys';

import { askSofia } from './scripts/query';
import { askSofiaFallback } from './scripts/queryFallback';
import { preprocessPregunta } from './scripts/preprocesamiento';
import { pineconeQuery } from './scripts/pineconeQuery';
import { clasificarChunk14 } from './scripts/clasificarChunk14';


import { distance } from 'fastest-levenshtein';

import { enviarDerivacionWhatsApp } from './lib/utils/sendMessagewa';

function es_curso_online_vivo( texto: string ): boolean {
  const frasesBase = [
    'Curso Online en vivo',
    '¿Qué es el curso online en vivo?',
    '¿Qué es el curso online en directo?',
    '¿Cómo funciona el curso de trading en directo?',
    '¿Qué diferencia tiene con el curso grabado?',
    '¿Las clases son en tiempo real?',
    '¿Fran Fialli da las clases?',
    '¿Esta formación es con clases por Zoom?',
    '¿Fran Fialli enseña en vivo o es grabado?',
    '¿En qué se diferencia el curso online en vivo del grabado?'
  ];

  const textoLimpio = preprocessPregunta( texto );
  for ( const frase of frasesBase ) {
    const dist = distance( textoLimpio, preprocessPregunta( frase ) );
    const maxLen = Math.max( textoLimpio.length, frase.length );
    const similitud = dist / maxLen;

    if ( similitud < 0.5 ) {
      console.log( `✅ si es curso online vivodetectada con: "${ frase }" (dist: ${ dist }, %: ${ similitud.toFixed( 2 ) })` );
      return true;
    }
  }

  console.log( '❌ No es curso online vivo' );
  return false;
}

function es_curso_online_grabado( texto: string ): boolean {
  const frasesBase = [
    'Curso Online Grabado',
    '¿Qué es el curso online grabado de Fran Fialli?',
    '¿En qué consiste el curso de trading con módulos grabados?',
    '¿Podrías explicarme de qué trata el curso grabado de Fran Fialli?',
    '¿Tienen un curso de trading online en formato grabado, no en vivo?',
    '¿Cómo es el curso de trading online grabado que ofrecen?'
  ];

  const textoLimpio = preprocessPregunta( texto );
  for ( const frase of frasesBase ) {
    const dist = distance( textoLimpio, preprocessPregunta( frase ) );
    const maxLen = Math.max( textoLimpio.length, frase.length );
    const similitud = dist / maxLen;

    if ( similitud < 0.5 ) {
      console.log( `✅ si es curso online grabado detectada con: "${ frase }" (dist: ${ dist }, %: ${ similitud.toFixed( 2 ) })` );
      return true;
    }
  }

  console.log( '❌ No es curso online grabado' );
  return false;
}

function es_formacion_miami( texto: string ): boolean {
  const frasesBase = [
    'Formación en Miami',
    '¿Tienen un curso de trading en Miami?',
    '¿Podrías explicarme el entrenamiento de Miami con Fran Fialli?',
    '¿Puedo hacer un curso presencial de bolsa en Estados Unidos?',
    '¿Es una masterclass de trading en Miami o un curso completo?',
    '¿Cómo es el entrenamiento presencial de trading en Miami?',
    '¿Ofrecen formación en Miami?',
    '¿Tienen curso de trading en Miami?',
    'curso trading Miami presencial',
    'información curso Miami Fran Fialli',
    '¿Cómo es el curso de trading en Miami?',
    '¿Tiene Fran Fialli algún curso presencial en Miami?',
    '¿Tienes cursos de trading en Miami?'
  ];

  const textoLimpio = preprocessPregunta( texto );
  for ( const frase of frasesBase ) {
    const dist = distance( textoLimpio, preprocessPregunta( frase ) );
    const maxLen = Math.max( textoLimpio.length, frase.length );
    const similitud = dist / maxLen;

    if ( similitud < 0.5 ) {
      console.log( `✅ si es curso formacion miami detectada con: "${ frase }" (dist: ${ dist }, %: ${ similitud.toFixed( 2 ) })` );
      return true;
    }
  }

  console.log( '❌ No es curso formacion miami' );
  return false;
}

function es_formacion_santiago( texto: string ): boolean {
  const frasesBase = [
    'Formación en Santiago',
    '¿Tienen un curso de trading en Santiago de Compostela?',
    '¿Podrías explicarme el entrenamiento de Santiago de Compostela con Fran Fialli?',
    '¿Podrías explicarme el entrenamiento de Santiago de Compostela con Fran Fialli?',
    '¿Puedo hacer un curso presencial de bolsa en España?',
    '¿Es una masterclass de trading en Santiago de Compostela o un curso completo?',
    '¿Cómo es el entrenamiento presencial de trading en Santiago de Compostela?',
    '¿Ofrecen formación en Santiago de Compostela?',
    '¿Tienen curso de trading en Santiago de Compostela?',
    'Quisiera saber qué es el curso presencial de Fran Fialli en Santiago de Compostela.',
    'tienen un curso de trading en santiago de compostela?',
    'curso presencial fran fialli santiago compostela'
  ];

  const textoLimpio = preprocessPregunta( texto );
  for ( const frase of frasesBase ) {
    const dist = distance( textoLimpio, preprocessPregunta( frase ) );
    const maxLen = Math.max( textoLimpio.length, frase.length );
    const similitud = dist / maxLen;

    if ( similitud < 0.5 ) {
      console.log( `✅ si es curso formacion santiago detectada con: "${ frase }" (dist: ${ dist }, %: ${ similitud.toFixed( 2 ) })` );
      return true;
    }
  }

  console.log( '❌ No es curso formacion santiago' );
  return false;
}

function esDerivacionHumana( texto: string ): boolean {
  const frasesBase = [
    'hablar con alguien',
    'asesor',
    'quiero ayuda humana',
    'con Javier',
    'Javier Gómez',
    'esto no me sirve',
    'agente',
    'esto es complicado',
    'necesito soporte'
  ];

  const textoLimpio = preprocessPregunta( texto );
  for ( const frase of frasesBase ) {
    const dist = distance( textoLimpio, preprocessPregunta( frase ) );
    const maxLen = Math.max( textoLimpio.length, frase.length );
    const similitud = dist / maxLen;

    if ( similitud < 0.45 ) {
      console.log( `✅ Confirmación Derivar Humana detectada con: "${ frase }" (dist: ${ dist }, %: ${ similitud.toFixed( 2 ) })` );
      return true;
    }
  }

  console.log( '❌ No se detectó Derivar Humano confirmación de derivación' );
  return false;

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

type IntencionDetectada = {
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

function detectarConfusion( texto ) {
  const textoLower = texto.toLowerCase();

  // Patrones para activar CONFUSION (solo "curso online" y variantes cercanas)
  const patronesConfusion = [
    /\bcurso online\b/,
    /\bonline\b.*\bcurso\b/,
    /\bcurso\s+en línea\b/, // otra variante común
  ];

  // Patrones para NO activar CONFUSION (ignorar estos)
  const patronesIgnorar = [
    /\bcurso grabado\b/,
    /\bcurso en vivo\b/,
    /\bcurso presencial\b/,
    /\bcurso streaming\b/,
  ];

  // Si alguna palabra de ignorar está en el texto, no hay CONFUSION
  if ( patronesIgnorar.some( pat => pat.test( textoLower ) ) ) {
    return false;
  }

  // Si algún patrón CONFUSION coincide, activamos CONFUSION
  if ( patronesConfusion.some( pat => pat.test( textoLower ) ) ) {
    return true;
  }

  return false;
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

export async function detectarIntencion( mensaje: string ): Promise<IntencionDetectada | null> {
  const query = preprocessPregunta( mensaje );
  const resultados = await pineconeQuery( query );



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




const menuFlow = addKeyword( [ 'MENÚ', 'menu' ] )
  .addAction( async ( ctx, { flowDynamic, state } ) => {
    await state.clear(); // Limpiar la sección previa
    console.log( 'Estado actual1:', await state.get( 'seccionActual' ) );
    const { texto } = await askSofia( ctx.body.toLocaleLowerCase(), '' );
    await delay( 2000 );
    await flowDynamic( texto );
  } );

const welcomeFlow = addKeyword( EVENTS.WELCOME )
  .addAction( async ( ctx, { gotoFlow, flowDynamic, state } ) => {
    console.log( 'Estado actual2:', await state.get( 'seccionActual' ) );
    const seccion = await state.get( 'seccionActual' );
    const consulta = preprocessPregunta( ctx.body );

    const esperandoDerivacion = await state.get( 'esperandoDerivacion' );
    const esperandoSeguimiento = await state.get( 'esperandoSeguimiento' );
    const esperandoConfusion = await state.get( 'estaconfundido_answer' );


    if ( esperandoConfusion ) {

      const resp_curso_confundido = detectarTipoCurso( consulta );
      console.log( 'resp_curso_confundido', resp_curso_confundido );

      if ( resp_curso_confundido == 'grabado' ) {
        return gotoFlow( cursoOnlineGFlow_2 );
      }
      if ( resp_curso_confundido == 'vivo' ) {

        return gotoFlow( cursoOnlineVFlow_2 );
      }

    }

    if ( esperandoDerivacion || esperandoSeguimiento ) {
      if ( esConfirmacionDerivacion( consulta ) ) {
        await state.update( { esperandoDerivacion: false } );
        await state.update( { esperandoSeguimiento: false } );
        await delay( 2000 );
        await flowDynamic( `🟢 Conectando con Javier Gómez... 👨‍💼 Él continuará con usted en este mismo chat.` );
      }

      if ( esNegacionDerivacion( consulta ) ) {
        await state.update( { esperandoDerivacion: false } );
        await state.update( { esperandoSeguimiento: false } );
        await delay( 2000 );
        await flowDynamic( `✅ Entendido. Seguimos por aquí entonces 😉` );
      }
    } else {

      //      const aclasificarChunk14 = await clasificarChunk14( consulta );

      if ( detectarConfusion( consulta ) || detectarFaltaTiempoOMiedo( consulta ) ) {

        if ( detectarConfusion( consulta ) ) {
          await delay( 2000 );
          //          await flowDynamic( "¿Te refieres al *Curso Grabado* o al *Curso en vivo con Fran*?\nAmbos son cursos online, pero tienen características distintas. Puedo ayudarte mejor si me confirmás a cuál te referís. 😊" );
          await flowDynamic(
            "¿Podrías confirmarme si te referís al *Curso Grabado* o al *Curso en vivo con Fran*?\nAmbos se realizan online, pero tienen características distintas. Así podré darte una respuesta más precisa. 😊"
          );
          await state.update( { estaconfundido_answer: true } );
        }

        if ( detectarFaltaTiempoOMiedo( consulta ) ) {
          await delay( 2000 );
          await flowDynamic( "¡Entiendo totalmente!\nEn el *Curso en vivo con Fran*, todas las sesiones *quedan grabadas en el Campus* para que puedas verlas en el momento que mejor te funcione.\nAdemás, el grupo es *reducido y personalizado*, así que vas a poder avanzar a tu ritmo, con seguimiento directo de Fran y sin sentirte perdido." );
        }

      } else {

        if ( seccion ) {
          console.log( 'Si tiene seccion' );

          console.log( 'Estado actual_query:', seccion );
          const { texto, origen, tags } = await askSofia( consulta, seccion );

          if ( origen == 'curso_online_vivo' ||
            origen == 'curso_online_grabado' ||
            origen == 'formacion_miami' ||
            origen == 'formacion_santiago'
          ) {
            await state.update( { seccionActual: origen } );
          }

          if ( tags.includes( 'solicitud_datos' ) && origen === 'curso_online_vivo' ) {
            // Acción específica
            console.log( 'Caso especial 1' );
            await delay( 2000 );
            await flowDynamic( texto );
            return gotoFlow( registerSolicitudDatos );
          }
          if ( tags.includes( 'reserva_plaza' ) && origen === 'curso_online_vivo' ) {
            // Acción específica
            console.log( 'Caso especial 2' );
            await delay( 2000 );
            await flowDynamic( texto );
            return gotoFlow( registerReservaPlaza );
          }
          if ( tags.includes( 'inscripción' ) && origen === 'curso_online_grabado' ) {
            // Acción específica
            console.log( 'Caso especial 3' );
            await delay( 2000 );
            await flowDynamic( texto );
            return gotoFlow( registerInscripcion );
          }

          if ( tags.includes( 'escenario_entrenable-sin_fechas-interés_usuario-lead_prioritario' ) && origen === 'formacion_miami' ) {
            console.log( 'Caso especial 7' );
            await delay( 2000 );
            await flowDynamic( texto );
            return gotoFlow( registerNoFechaDisponible );
          }
          if ( tags.includes( 'captación_datos' ) && origen === 'formacion_miami' ) {
            console.log( 'Caso especial 8' );
            await delay( 2000 );
            await flowDynamic( texto );
            return gotoFlow( registerCaptarDatosMiami );
          }
          if ( tags.includes( 'falta_confirmación' ) && origen === 'formacion_miami' ) {
            console.log( 'Caso especial 9' );
            await delay( 2000 );
            await flowDynamic( texto );
            return gotoFlow( registerFaltaConfirmacion );
          }
          if ( tags.includes( 'admisiones' ) && origen === 'formacion_santiago' ) {
            console.log( 'Caso especial 1_11' );
            await delay( 2000 );
            await flowDynamic( texto );
            return gotoFlow( registerAdmisionesSantiagos );
          }
          if ( tags.includes( 'reserva_de_plaza' ) && origen === 'formacion_santiago' ) {
            console.log( 'Caso especial 2_12' );
            await delay( 2000 );
            await flowDynamic( texto );
            return gotoFlow( registerAdmisionesSantiagos );
          }
          if ( tags.includes( 'inscripción_presencial' ) && origen === 'formacion_santiago' ) {
            console.log( 'Caso especial 3_13' );
            await delay( 2000 );
            await flowDynamic( texto );
            return gotoFlow( registerAdmisionesSantiagos );
          }
          if ( tags.includes( 'precio_curso_Santiago' ) && origen === 'formacion_santiago' ) {
            console.log( 'Caso especial 4_14' );
            await delay( 2000 );
            await flowDynamic( texto );
            return gotoFlow( registerAdmisionesSantiagos );
          }
          if ( tags.includes( 'escenario_entrenable-sin_fechas-interés_usuario-lead_prioritario' ) && origen === 'formacion_santiago' ) {
            console.log( 'Caso especial 5_15' );
            await delay( 2000 );
            await flowDynamic( texto );
            return gotoFlow( registerNoFechaDisponible );
          }
          if ( tags.includes( 'escenario_entrenable-inscripciones_cerradas-lead_urgente' ) && origen === 'formacion_santiago' ) {
            console.log( 'Caso especial 6_16' );
            await delay( 2000 );
            await flowDynamic( texto );
            return gotoFlow( registerCaptacionDatosSantiago );
          }
          if ( tags.includes( 'escenario_entrenable-post_inscripción' ) && origen === 'formacion_santiago' ) {
            console.log( 'Caso especial 7_17' );
            await delay( 2000 );
            await flowDynamic( texto );
            return gotoFlow( registerFaltaConfirmacion );
          }
          if ( tags.includes( 'contacto_humano' ) ) {
            console.log( 'Caso especial 1_20' );
            await delay( 2000 );
            await flowDynamic( texto );
            return gotoFlow( registerContactoHumanoSoporte );
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
          if ( tags.includes( 'asesor_activo' ) && origen === 'soporte_general' ) {
            console.log( 'Caso especial 2_21' );
            console.log( "send enviar mensaje a Javier" );
            const mensaje = `
          📩 Nueva solicitud de atención humana
          
          📱 Teléfono: ${ ctx.from }
          `;
            await enviarDerivacionWhatsApp( mensaje );

          }
          await delay( 2000 );
          await flowDynamic( texto );

        } else {
          console.log( 'No se eligio seccion' );

          const intencion = await detectarIntencion( consulta );

          const derivar = esDerivacionHumana( consulta );

          const cursoOnlineVivo = es_curso_online_vivo( consulta );

          const cursoOnlineGrabado = es_curso_online_grabado( consulta );

          const formacionMiami = es_formacion_miami( consulta );

          const formacionSantiago = es_formacion_santiago( consulta );

          if ( cursoOnlineVivo ) {
            return gotoFlow( cursoOnlineVFlow );
          }
          if ( cursoOnlineGrabado ) {
            return gotoFlow( cursoOnlineGFlow );
          }
          if ( formacionMiami ) {
            return gotoFlow( formacionMiamiFlow );
          }
          if ( formacionSantiago ) {
            return gotoFlow( formacionSantiagoFlow );
          }

          if ( derivar ) {
            console.log( 'Derivación Humana' );
            return gotoFlow( derivacionHumana );
          } else {
            if ( intencion.is_fallback ) {
              console.log( 'Detecto Fallback intencion else' );
              const { texto } = await askSofiaFallback( consulta );
              await delay( 2000 );
              await flowDynamic( texto );
            } else {

              if ( intencion.seccion ) {
                switch ( intencion.seccion ) {

                  case 'soporte_general': {

                    console.log( 'Intención detectada:', intencion.seccion );
                    return gotoFlow( soporteGeneralFlow );
                  }


                  default: {
                    console.log( 'No detecto la intencion' );
                    const { texto } = await askSofia( consulta, seccion );
                    await delay( 2000 );
                    await flowDynamic( texto );
                    break;
                  }
                }
              } else {
                console.log( 'No detecto la intencion else' );
                const { texto } = await askSofia( consulta, seccion );
                await delay( 2000 );
                await flowDynamic( texto );
              }
            }
          }



        }
      }



    }



  } );

const cursoOnlineGFlow_2 = addKeyword<Provider, Database>( [
  'Curso Online Grabado redirijido',
] )
  .addAction( async ( ctx, { flowDynamic, state } ) => {
    await state.update( { seccionActual: 'curso_online_grabado' } );
    console.log( 'Estado actual:', await state.get( 'seccionActual' ) );
    const seccion = await state.get( 'seccionActual' );
    const { texto } = await askSofia( preprocessPregunta( '¿Qué es el curso online grabado de Fran Fialli?' ), seccion );
    await delay( 2000 );
    await flowDynamic( texto );
  } );

const cursoOnlineGFlow = addKeyword<Provider, Database>( [
  'Curso Online Grabado',
  '1',
  '¿Qué es el curso online grabado de Fran Fialli?',
  '¿En qué consiste el curso de trading con módulos grabados?',
  '¿Podrías explicarme de qué trata el curso grabado de Fran Fialli?',
  '¿Tienen un curso de trading online en formato grabado, no en vivo?',
  '¿Cómo es el curso de trading online grabado que ofrecen?'
] )
  .addAction( async ( ctx, { flowDynamic, state } ) => {
    await state.update( { seccionActual: 'curso_online_grabado' } );
    console.log( 'Estado actual:', await state.get( 'seccionActual' ) );
    const seccion = await state.get( 'seccionActual' );
    const { texto } = await askSofia( preprocessPregunta( ctx.body ), seccion );
    await delay( 2000 );
    await flowDynamic( texto );
  } );

const cursoOnlineVFlow_2 = addKeyword<Provider, Database>(
  [
    'Curso Online en vivo redirijido',
  ]
)
  .addAction( async ( ctx, { flowDynamic, state } ) => {
    await state.update( { seccionActual: 'curso_online_vivo' } );
    const seccion = await state.get( 'seccionActual' );
    const { texto } = await askSofia( preprocessPregunta( '¿Qué es el curso online en vivo?' ), seccion );
    await delay( 2000 );
    await flowDynamic( texto );
  } );

const cursoOnlineVFlow = addKeyword<Provider, Database>(
  [
    'Curso Online en vivo',
    '2',
    '¿Qué es el curso online en vivo?',
    '¿Qué es el curso online en directo?',
    '¿Cómo funciona el curso de trading en directo?',
    '¿Qué diferencia tiene con el curso grabado?',
    '¿Las clases son en tiempo real?',
    '¿Fran Fialli da las clases?',
    '¿Esta formación es con clases por Zoom?',
    '¿Fran Fialli enseña en vivo o es grabado?',
    '¿En qué se diferencia el curso online en vivo del grabado?'
  ]
)
  .addAction( async ( ctx, { flowDynamic, state } ) => {
    await state.update( { seccionActual: 'curso_online_vivo' } );
    const seccion = await state.get( 'seccionActual' );
    const { texto } = await askSofia( preprocessPregunta( ctx.body ), seccion );
    await delay( 2000 );
    await flowDynamic( texto );
  } );

const formacionMiamiFlow = addKeyword<Provider, Database>(
  [ 'Formación en Miami',
    '3',
    '¿Tienen un curso de trading en Miami?',
    '¿Podrías explicarme el entrenamiento de Miami con Fran Fialli?',
    '¿Puedo hacer un curso presencial de bolsa en Estados Unidos?',
    '¿Es una masterclass de trading en Miami o un curso completo?',
    '¿Cómo es el entrenamiento presencial de trading en Miami?',
    '¿Ofrecen formación en Miami?',
    '¿Tienen curso de trading en Miami?',
    'curso trading Miami presencial',
    'información curso Miami Fran Fialli',
    '¿Cómo es el curso de trading en Miami?',
    '¿Tiene Fran Fialli algún curso presencial en Miami?',
    '¿Tienes cursos de trading en Miami?'
  ]
)
  .addAction( async ( ctx, { flowDynamic, state } ) => {
    await state.update( { seccionActual: 'formacion_miami' } );
    const seccion = await state.get( 'seccionActual' );
    const { texto } = await askSofia( preprocessPregunta( ctx.body ), seccion );
    await delay( 2000 );
    await flowDynamic( texto );
  } );

const formacionSantiagoFlow = addKeyword<Provider, Database>( [
  'Formación en Santiago',
  '4',
  '¿Tienen un curso de trading en Santiago de Compostela?',
  '¿Podrías explicarme el entrenamiento de Santiago de Compostela con Fran Fialli?',
  '¿Podrías explicarme el entrenamiento de Santiago de Compostela con Fran Fialli?',
  '¿Puedo hacer un curso presencial de bolsa en España?',
  '¿Es una masterclass de trading en Santiago de Compostela o un curso completo?',
  '¿Cómo es el entrenamiento presencial de trading en Santiago de Compostela?',
  '¿Ofrecen formación en Santiago de Compostela?',
  '¿Tienen curso de trading en Santiago de Compostela?',
  'Quisiera saber qué es el curso presencial de Fran Fialli en Santiago de Compostela.',
  'tienen un curso de trading en santiago de compostela?',
  'curso presencial fran fialli santiago compostela'
] )
  .addAction( async ( ctx, { flowDynamic, state } ) => {
    await state.update( { seccionActual: 'formacion_santiago' } );
    const seccion = await state.get( 'seccionActual' );
    const { texto } = await askSofia( preprocessPregunta( ctx.body ), seccion );
    await delay( 2000 );
    await flowDynamic( texto );
  } );

const yasoyAlumnoFlow = addKeyword<Provider, Database>( [ 'Ya soy alumno/a', '6' ] )
  .addAction( async ( ctx, { flowDynamic, state } ) => {
    await state.update( { seccionActual: 'soy_alumno' } );
    const seccion = await state.get( 'seccionActual' );
    const { texto } = await askSofia( preprocessPregunta( ctx.body ), seccion );
    await delay( 2000 );
    await flowDynamic( texto );
  } );

const soporteGeneralFlow = addKeyword<Provider, Database>( [ 'Consultas generales', '7' ] )
  .addAction( async ( ctx, { flowDynamic, state } ) => {
    await state.update( { seccionActual: 'soporte_general' } );
    const seccion = await state.get( 'seccionActual' );
    const { texto } = await askSofia( preprocessPregunta( ctx.body ), seccion );
    await delay( 2000 );
    await flowDynamic( texto );
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
  .addAction( async ( ctx, { flowDynamic, state } ) => {

    const nombre = await state.get( 'name' ) || 'No especificado';
    const correo = await state.get( 'correo' ) || 'No proporcionado';
    const pais = await state.get( 'pais' ) || 'No indicado';
    const telefono = ctx.from || 'Desconocido';

    const mensaje = `
    📩 Nueva solicitud de atención humana

    👤 Nombre: ${ nombre }
    📧 Correo: ${ correo }
    📝 Pais de residencia: ${ pais }
    📱 Teléfono: ${ telefono }
    `;
    await enviarDerivacionWhatsApp( mensaje );
    await delay( 2000 );
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
  .addAction( async ( ctx, { flowDynamic, state } ) => {

    const nombre = await state.get( 'name' ) || 'No especificado';
    const correo = await state.get( 'correo' ) || 'No proporcionado';
    const pais = await state.get( 'pais' ) || 'No indicado';
    const telefono = ctx.from || 'Desconocido';

    const mensaje = `
    📩 Nueva solicitud de atención humana

    👤 Nombre: ${ nombre }
    📧 Correo: ${ correo }
    📝 Ciudad o país: ${ pais }
    📱 Teléfono: ${ telefono }
    `;
    await enviarDerivacionWhatsApp( mensaje );
    await delay( 2000 );
    await flowDynamic( `✅ Gracias. Hemos recibido correctamente sus datos.` );
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
  .addAction( async ( ctx, { flowDynamic, state } ) => {

    const nombre = await state.get( 'name' ) || 'No especificado';
    const correo = await state.get( 'correo' ) || 'No proporcionado';
    const pais = await state.get( 'pais' ) || 'No indicado';
    const divisa = await state.get( 'divisa' ) || 'No indicado';
    const metodo = await state.get( 'metodo' ) || 'No indicado';
    const telefono = ctx.from || 'Desconocido';

    const mensaje = `
    📩 Nueva solicitud de atención humana
    
    👤 Nombre: ${ nombre }
    📧 Correo: ${ correo }
    📝 Ciudad o país: ${ pais }
    📱 Teléfono: ${ telefono }
    Divisa: ${ divisa }
    Metodo de pago: ${ metodo }
    `;
    await enviarDerivacionWhatsApp( mensaje );
    await delay( 2000 );
    await flowDynamic( `✅ Gracias. Hemos recibido correctamente sus datos.` );
  } );

const registerNoFechaDisponible = addKeyword( EVENTS.ACTION )
  .addAnswer( `Nombre Completo`, { capture: true }, async ( ctx, { state } ) => {
    await state.update( { name: ctx.body } );
  } )
  .addAnswer( `Correo electrónico`, { capture: true }, async ( ctx, { state } ) => {
    await state.update( { correo: ctx.body } );
  } )
  .addAnswer( `Ciudad de interés`, { capture: true }, async ( ctx, { state } ) => {
    await state.update( { ciudad: ctx.body } );
  } )
  .addAction( async ( ctx, { flowDynamic, state } ) => {

    const nombre = await state.get( 'name' ) || 'No especificado';
    const correo = await state.get( 'correo' ) || 'No proporcionado';
    const pais = await state.get( 'pais' ) || 'No indicado';
    const telefono = ctx.from || 'Desconocido';

    const mensaje = `
    📩 Nueva solicitud de atención humana
    
    👤 Nombre: ${ nombre }
    📧 Correo: ${ correo }
    📝 Ciudad de interés: ${ pais }
    📱 Teléfono: ${ telefono }
    `;
    await enviarDerivacionWhatsApp( mensaje );
    await delay( 2000 );
    await flowDynamic( `✅ Gracias. Hemos recibido correctamente sus datos.` );

  } );

const registerCaptarDatosMiami = addKeyword( EVENTS.ACTION )
  .addAnswer( `Nombre Completo`, { capture: true }, async ( ctx, { state } ) => {
    await state.update( { name: ctx.body } );
  } )
  .addAnswer( `Correo electrónico`, { capture: true }, async ( ctx, { state } ) => {
    await state.update( { correo: ctx.body } );
  } )
  .addAction( async ( ctx, { flowDynamic, state } ) => {

    const nombre = await state.get( 'name' ) || 'No especificado';
    const correo = await state.get( 'correo' ) || 'No proporcionado';
    const telefono = ctx.from || 'Desconocido';

    const mensaje = `
    📩 Nueva solicitud de atención humana
    
    👤 Nombre: ${ nombre }
    📧 Correo: ${ correo }
    📱 Teléfono: ${ telefono }
    `;
    await enviarDerivacionWhatsApp( mensaje );
    await delay( 2000 );
    await flowDynamic( `✅ Gracias. Hemos recibido correctamente sus datos.` );

  } );

const registerFaltaConfirmacion = addKeyword( EVENTS.ACTION )
  .addAnswer( `Nombre Completo`, { capture: true }, async ( ctx, { state } ) => {
    await state.update( { name: ctx.body } );
  } )
  .addAnswer( `Correo electrónico`, { capture: true }, async ( ctx, { state } ) => {
    await state.update( { correo: ctx.body } );
  } )
  .addAction( async ( ctx, { flowDynamic, state } ) => {

    const nombre = await state.get( 'name' ) || 'No especificado';
    const correo = await state.get( 'correo' ) || 'No proporcionado';
    const telefono = ctx.from || 'Desconocido';

    const mensaje = `
    📩 Nueva solicitud de atención humana
    
    👤 Nombre: ${ nombre }
    📧 Correo: ${ correo }
    📱 Teléfono: ${ telefono }
    `;
    await enviarDerivacionWhatsApp( mensaje );
    await delay( 2000 );
    await flowDynamic( `✅ Gracias. Hemos recibido correctamente sus datos.` );

  } );

const registerAdmisionesSantiagos = addKeyword( EVENTS.ACTION )
  .addAnswer( `Nombre Completo`, { capture: true }, async ( ctx, { state } ) => {
    await state.update( { name: ctx.body } );
  } )
  .addAnswer( `Correo Electrónico`, { capture: true }, async ( ctx, { state } ) => {
    await state.update( { correo: ctx.body } );
  } )
  .addAction( async ( ctx, { flowDynamic, state } ) => {
    //    await flowDynamic( `${ state.get( 'name' ) }, thanks for your information!: Your age: ${ state.get( 'correo' ) }, and your country: ${ state.get( 'pais' ) }` );
    const nombre = await state.get( 'name' ) || 'No especificado';
    const correo = await state.get( 'correo' ) || 'No proporcionado';
    const telefono = ctx.from || 'Desconocido';

    const mensaje = `
    📩 Nueva solicitud de atención humana
    
    👤 Nombre: ${ nombre }
    📧 Correo: ${ correo }
    📱 Teléfono: ${ telefono }
    `;
    await enviarDerivacionWhatsApp( mensaje );
    await delay( 2000 );
    await flowDynamic( `✅ Gracias. Hemos recibido correctamente sus datos. Los agregaremos a la *lista prioritaria* del curso de Bolsa y Trading en *Santiago de Compostela*.

    Le avisaremos personalmente tan pronto abramos una nueva convocatoria para que pueda confirmar su plaza con antelación.` );
  } );

const registerCaptacionDatosSantiago = addKeyword( EVENTS.ACTION )
  .addAnswer( `Nombre Completo`, { capture: true }, async ( ctx, { state } ) => {
    await state.update( { name: ctx.body } );
  } )
  .addAnswer( `Correo Electrónico`, { capture: true }, async ( ctx, { state } ) => {
    await state.update( { correo: ctx.body } );
  } )
  .addAnswer( `Teléfono`, { capture: true }, async ( ctx, { state } ) => {
    await state.update( { telefono: ctx.body } );
  } )
  .addAction( async ( ctx, { flowDynamic, state } ) => {

    const nombre = await state.get( 'name' ) || 'No especificado';
    const correo = await state.get( 'correo' ) || 'No proporcionado';
    const telefono = await state.get( 'telefono' ) || 'No proporcionado';
    const telefono2 = ctx.from || 'Desconocido';

    const mensaje = `
    📩 Nueva solicitud de atención humana
    
    👤 Nombre: ${ nombre }
    📧 Correo: ${ correo }
    📱 Teléfono: ${ telefono }
    📱 Teléfono(envio): ${ telefono2 }
    `;
    await enviarDerivacionWhatsApp( mensaje );
    await delay( 2000 );
    //    await flowDynamic( `${ state.get( 'name' ) }, thanks for your information!: Your age: ${ state.get( 'correo' ) }, and your country: ${ state.get( 'pais' ) }` );
    await flowDynamic( `✅ ¡Gracias! Ya lo anoté en la lista prioritaria. Le avisaremos cuando se abra la próxima convocatoria.` );
  } );


const registerContactoHumanoSoporte = addKeyword( EVENTS.ACTION )
  .addAnswer( `Nombre Completo`, { capture: true }, async ( ctx, { state } ) => {
    await state.update( { name: ctx.body } );
  } )
  .addAnswer( `Motivo Principal`, { capture: true }, async ( ctx, { state } ) => {
    await state.update( { correo: ctx.body } );
  } )
  .addAction( async ( ctx, { flowDynamic, state } ) => {

    const nombre = await state.get( 'name' ) || 'No especificado';
    const motivo = await state.get( 'correo' ) || 'No proporcionado';
    const telefono = ctx.from || 'Desconocido';

    const mensaje = `
    📩 Nueva solicitud de atención humana
    
    👤 Nombre: ${ nombre }
    📧 Motivo: ${ motivo }
    📱 Teléfono: ${ telefono }
    `;
    await enviarDerivacionWhatsApp( mensaje );
    await delay( 2000 );
    //    await flowDynamic( `${ state.get( 'name' ) }, thanks for your information!: Your age: ${ state.get( 'correo' ) }, and your country: ${ state.get( 'pais' ) }` );
    await flowDynamic( `✅ ¡Gracias! Le pondré en contacto con *Javier Gómez*, nuestro asesor académico del equipo de Fran Fialli.` );
  } );

const derivacionHumana = addKeyword( EVENTS.ACTION )
  .addAnswer( `Nombre Completo`, { capture: true }, async ( ctx, { state } ) => {
    await state.update( { name: ctx.body } );
  } )
  .addAnswer( `Correo electrónico`, { capture: true }, async ( ctx, { state } ) => {
    await state.update( { correo: ctx.body } );
  } )
  .addAction( async ( ctx, { flowDynamic, state } ) => {

    const nombre = await state.get( 'name' ) || 'No especificado';
    const correo = await state.get( 'correo' ) || 'No proporcionado';
    const telefono = ctx.from || 'Desconocido';

    const mensaje = `
    📩 Nueva solicitud de atención humana
    
    👤 Nombre: ${ nombre }
    📧 Correo: ${ correo }
    📱 Teléfono: ${ telefono }
    `;
    await enviarDerivacionWhatsApp( mensaje );
    await delay( 2000 );
    await flowDynamic( `✅ Gracias. Hemos recibido correctamente sus datos.` );

  } );

const main = async () => {

  const adapterFlow = createFlow(
    [ menuFlow,
      welcomeFlow,
      cursoOnlineGFlow,
      cursoOnlineGFlow_2,
      cursoOnlineVFlow,
      cursoOnlineVFlow_2,
      formacionMiamiFlow,
      formacionSantiagoFlow,
      yasoyAlumnoFlow,
      soporteGeneralFlow,
      registerSolicitudDatos,
      registerReservaPlaza,
      registerInscripcion,
      registerNoFechaDisponible,
      registerCaptarDatosMiami,
      registerFaltaConfirmacion,
      registerAdmisionesSantiagos,
      registerCaptacionDatosSantiago,
      registerContactoHumanoSoporte,
      derivacionHumana
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





