import { addKeyword, EVENTS } from '@builderbot/bot';
import { preprocessPregunta } from '../lib/utils/preprocessinText';
import { generateTimer } from '../lib/utils/generateTimer';
import { askSofia } from '../scripts/query';

const detectflowMenu = ( query: string, seccionActual: string ): boolean => {
  const texto = preprocessPregunta( query );

  // Frases disparadoras simples
  const frasesDisparadoras = [
    "menu",
    "quiero comenzar",
    "dame opciones",
    "quiero información",
    "necesito ayuda",
    "me puedes ayudar",
    "qué cursos ofrecen",
    "más información",
    "información",
    "hola",
    "buenas",
    "saludos",
    "ola",
    "buenos días",
    "buenas tardes"
  ];

  // Patrones para detectar frases comunes más flexibles
  const patronesDisparadores = [
    /muestra.*menu/,
    /ver.*opciones/,
    /que.*puedo.*hacer.*aqu[ií]/,
    /env[ií]ame.*listado/,
    /hola.*(informaci[oó]n|ayuda|opciones|más.*informaci[oó]n)/,
    /buenas.*(informaci[oó]n|opciones)/,
    /(quiero|quisiera|necesito|me.*gustar[ií]a).*informaci[oó]n/,
    /puedes.*ayudarme/,
    /m[aá]s.*informaci[oó]n/,
  ];

  return frasesDisparadoras.some( f => texto.includes( f ) ) ||
    patronesDisparadores.some( p => p.test( texto ) );

};

const flowMenu = addKeyword( EVENTS.ACTION ).addAction( async ( ctx, { state, flowDynamic, extensions } ) => {
  try {
    console.log( 'flow menu' );

    //    await state.clear(); // Limpiar la sección previa
    await state.update( { seccionActual: '' } );
    const seccion = await state.get( 'seccionActual' );

    const { texto, origen, chunkId } = await askSofia( preprocessPregunta( ctx.body ), seccion, 'menu' );

    await flowDynamic( [ { body: texto, delay: generateTimer( 150, 250 ) } ] );
    console.log( { origen, chunkId } );


  } catch ( err ) {
    console.log( `[ERROR]: en el flujo comando menu`, err );
    return;
  }
} );

export { detectflowMenu, flowMenu };