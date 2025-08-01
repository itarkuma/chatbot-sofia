import { addKeyword, EVENTS } from '@builderbot/bot';
import { preprocessPregunta } from '../lib/utils/preprocessinText';
import { generateTimer } from '../lib/utils/generateTimer';
import { askSofia } from '../scripts/query';
import { removeAccents } from '../lib/utils/removeAccents';

const detectflowSaludo = ( query: string, seccionActual: string ): boolean => {
  const texto = preprocessPregunta( query );
  const textoNormalizado = removeAccents( texto.toLowerCase() );

  // Palabras clave que no deben ser consideradas como un saludo
  const excluidosDeSaludo = [ "trading", "curso", "cursos", "ofrecen", "opciones", "dolar", "euro" ];

  // Frases disparadoras para saludo (sin incluir "trading" ni temas relacionados con cursos)
  const frasesDisparadorasSaludo = [
    "hola",
    "buenas",
    "saludos",
    "ola",
    "buenos días",
    "buenas tardes",
    "no sé nada de trading",  // Esta frase es válida porque está enfocada en el desconocimiento, no en el curso
    "estoy empezando",
    "me gustaría información sobre"
  ];

  // Patrones para detectar frases comunes más flexibles del saludo
  const patronesDisparadoresSaludo = [
    /hola/,
    /\bbuenas\b/,
    /\bsaludos\b/,
    /\bola\b/,
    /\bbuenos días\b/,
    /\bbuenas tardes\b/,
    /no sé nada de trading/,
    /estoy empezando/,
    /me gustaría información sobre/,
    /quiero información/,
    /necesito ayuda/,
    /¿me puedes ayudar?/,
    /¿qué cursos ofrecen?/,
  ];

  // 1. Detecta si hay frases disparadoras de saludo, excluyendo palabras clave como "trading"
  const esSaludo = frasesDisparadorasSaludo.some( f =>
    textoNormalizado.includes( removeAccents( f.toLowerCase() ) ) &&
    !excluidosDeSaludo.some( e => textoNormalizado.includes( removeAccents( e.toLowerCase() ) ) )
  ) ||
    patronesDisparadoresSaludo.some( p =>
      p.test( textoNormalizado ) &&
      !excluidosDeSaludo.some( e => textoNormalizado.includes( removeAccents( e.toLowerCase() ) ) )
    );

  if ( esSaludo ) {
    return true;
  }
};

const flowSaludo = addKeyword( EVENTS.ACTION ).addAction( async ( ctx, { state, flowDynamic, extensions } ) => {
  try {
    console.log( 'flow saludo' );

    //    await state.clear(); // Limpiar la sección previa
    await state.update( { seccionActual: '' } );
    const seccion = await state.get( 'seccionActual' );

    const { texto, origen, chunkId } = await askSofia( preprocessPregunta( ctx.body ), seccion, 'saludo' );

    await flowDynamic( [ { body: texto, delay: generateTimer( 150, 250 ) } ] );
    console.log( { origen, chunkId } );


  } catch ( err ) {
    console.log( `[ERROR]: en el flujo saludo`, err );
    return;
  }
} );

export { detectflowSaludo, flowSaludo };