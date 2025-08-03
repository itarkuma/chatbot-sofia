import { addKeyword, EVENTS } from '@builderbot/bot';
import { preprocessPregunta } from '../lib/utils/preprocessinText';
import { generateTimer } from '../lib/utils/generateTimer';
import { askSofia } from '../scripts/query';
import { removeAccents } from '../lib/utils/removeAccents';

const detectflowMenu = ( query: string, seccionActual: string ): boolean => {
  const texto = preprocessPregunta( query );
  const textoNormalizado = removeAccents( texto.toLowerCase() );

  // Frases disparadoras para el menú
  const frasesDisparadorasMenu = [
    "menú",
    "menu",        // Agregamos 'menu' sin tilde
    "muestra el menú",
    "quiero ver las opciones",
    "¿qué puedo hacer aquí?",
    "envíame el listado",
    "quiero comenzar",
    "dame las opciones",
    "¿Qué ofrecen?",
    "Que ofrecen",
  ];

  // Patrones para detectar frases comunes más flexibles del menú
  const patronesDisparadoresMenu = [
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

  const esMenu = frasesDisparadorasMenu.some( f =>
    textoNormalizado.includes( removeAccents( f.toLowerCase() ) )
  ) ||
    patronesDisparadoresMenu.some( p => p.test( textoNormalizado ) );

  return esMenu; // Devuelve true solo si detecta el menú


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